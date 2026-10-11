import {randomUUID} from 'node:crypto';
import {mkdir,chmod,open,readFile,lstat,rename,unlink} from 'node:fs/promises';
import {homedir} from 'node:os';
import path from 'node:path';
import {z} from 'zod';

const MAX_DRAFT_BYTES=2*1024*1024;
const idSchema=z.uuid();
const revisionSchema=z.number().int().positive();
const jsonObject=z.record(z.string(),z.json());
const httpsUrl=z.string().url().pipe(z.string().refine(value=>{
  const url=new URL(value);
  return url.protocol==='https:'&&!url.username&&!url.password;
},'Reference URLs must use HTTPS without credentials'));
const sourceSchema=z.discriminatedUnion('type',[
  z.object({type:z.literal('url'),url:httpsUrl}).strict(),
  z.object({type:z.literal('file'),id:idSchema,name:z.string().min(1),mimeType:z.string().min(1),size:z.number().int().positive()}).strict(),
]);
export const mediaSchema=z.object({type:z.enum(['image','video','audio']),source:sourceSchema,meta:jsonObject.optional()}).strict();
export const briefSchema=z.object({summary:z.string().max(10000),output:z.string().max(10000)}).strict();
export const continuationIdsSchema=z.array(idSchema).max(19).refine(ids=>new Set(ids).size===ids.length,'Duplicate continuation drafts');
const batchReviewSchema=z.object({status:z.enum(['submitting','submitted','stopped']),items:z.array(z.object({draftId:idSchema,baseRevision:revisionSchema}).strict()).min(2).max(20),budgetUsd:z.number().positive(),estimatedCostUsd:z.number().nonnegative(),error:z.string().optional()}).strict();
const editable={brief:briefSchema.optional(),continuationDraftIds:continuationIdsSchema.optional(),title:z.string(),model:z.string().nullable(),prompt:z.string().max(100000),media:z.array(mediaSchema).max(30),parameters:jsonObject,meta:jsonObject};
const statusSchema=z.enum(['draft','submitting','submitted','unknown']);
function sizeLimit(value,context) {
  if(Buffer.byteLength(JSON.stringify(value),'utf8')>MAX_DRAFT_BYTES)context.addIssue({code:'custom',message:'Draft exceeds the 2 MiB size limit'});
}
export const draftSchema=z.object({
  id:idSchema,spaceId:idSchema,revision:revisionSchema,...editable,status:statusSchema,
  taskRunId:idSchema.optional(),error:z.string().optional(),reviewPaused:z.boolean().optional(),batchReview:batchReviewSchema.optional(),
  createdAt:z.iso.datetime({offset:true}),updatedAt:z.iso.datetime({offset:true}),
}).strict().superRefine(sizeLimit).superRefine((draft,context)=>{
  if(draft.continuationDraftIds?.includes(draft.id))context.addIssue({code:'custom',message:'A draft cannot continue itself'});
  if((draft.status==='submitted')!==(draft.taskRunId!==undefined))context.addIssue({
    code:'custom',path:['taskRunId'],
    message:draft.status==='submitted'?'Submitted drafts require a task receipt':'Only submitted drafts can contain a task receipt',
  });
});
export const patchSchema=z.object(editable).partial().strict().superRefine(sizeLimit);
const initialSchema=z.object({
  brief:editable.brief,continuationDraftIds:editable.continuationDraftIds,spaceId:idSchema,title:editable.title.default(''),model:editable.model.default(null),prompt:editable.prompt.default(''),
  media:editable.media.default([]),parameters:jsonObject.default({}),meta:jsonObject.default({}),status:statusSchema.default('draft'),
  taskRunId:idSchema.optional(),error:z.string().optional(),
}).strict();

function failure(code,message,properties={}) {
  return Object.assign(new Error(message),{code,...properties});
}
async function withCleanup(operation,cleanup) {
  let result,error,failed=false;
  try {result=await operation();} catch(cause) {failed=true;error=cause;}
  try {await cleanup();} catch(cause) {
    if(failed)throw new AggregateError([error,cause],'Draft operation and cleanup both failed');
    throw cause;
  }
  if(failed)throw error;
  return result;
}
async function closeAndRemove(handle,file) {
  const errors=[];
  try {await handle.close();} catch(error) {errors.push(error);}
  if(file)try {await unlink(file);} catch(error) {errors.push(error);}
  if(errors.length)throw new AggregateError(errors,'Failed to clean up this draft operation');
}

export function createDraftStore({directory}={}) {
  const configured=directory??(process.env.COHUB_CARDS_STATE_DIR||path.join(process.env.XDG_STATE_HOME||path.join(homedir(),'.local','state'),'cohub-cards'));
  if(typeof configured!=='string'||!configured.trim())throw new TypeError('A state directory is required');
  const stateDirectory=path.resolve(configured);
  const recordPath=id=>path.join(stateDirectory,`${idSchema.parse(id)}.json`);

  async function get(id) {
    const file=recordPath(id),info=await lstat(file);
    if(!info.isFile())throw failure('DRAFT_NOT_FILE','The draft record is not a regular file');
    if(info.size>MAX_DRAFT_BYTES)throw failure('DRAFT_TOO_LARGE','Draft exceeds the 2 MiB size limit');
    const bytes=await readFile(file);
    if(bytes.length>MAX_DRAFT_BYTES)throw failure('DRAFT_TOO_LARGE','Draft exceeds the 2 MiB size limit');
    const draft=draftSchema.parse(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
    if(draft.id!==id)throw failure('DRAFT_ID_MISMATCH','The saved draft does not match the requested ID');
    return draft;
  }

  async function locked(id,operation) {
    const file=path.join(stateDirectory,`${idSchema.parse(id)}.lock`);
    let handle;
    try {handle=await open(file,'wx',0o600);} catch(error) {
      if(error.code==='EEXIST')throw failure('DRAFT_LOCKED','This draft is locked by another operation; the existing lock was preserved',{cause:error});
      throw error;
    }
    return withCleanup(async()=>{
      await handle.writeFile(JSON.stringify({pid:process.pid,createdAt:new Date().toISOString()}));
      return operation();
    },()=>closeAndRemove(handle,file));
  }

  async function persist(draft) {
    const file=recordPath(draft.id),temporary=`${file}.${randomUUID()}.tmp`;
    const handle=await open(temporary,'wx',0o600);
    let moved=false;
    return withCleanup(async()=>{
      await handle.writeFile(JSON.stringify(draft));
      await handle.sync();
      await rename(temporary,file);
      moved=true;
      return draft;
    },()=>closeAndRemove(handle,moved?null:temporary));
  }

  async function create(initial) {
    const values=initialSchema.parse(initial),timestamp=new Date().toISOString();
    const draft=draftSchema.parse({...values,id:randomUUID(),revision:1,createdAt:timestamp,updatedAt:timestamp});
    await mkdir(stateDirectory,{recursive:true,mode:0o700});
    await chmod(stateDirectory,0o700);
    return locked(draft.id,async()=>{
      try {await lstat(recordPath(draft.id));} catch(error) {
        if(error.code==='ENOENT')return persist(draft);
        throw error;
      }
      throw failure('DRAFT_ALREADY_EXISTS','The new draft ID already exists; the saved record was preserved');
    });
  }

  async function mutateUnlocked(id,expectedRevision,transform) {
    idSchema.parse(id);revisionSchema.parse(expectedRevision);
    if(typeof transform!=='function')throw new TypeError('Draft transform must be a function');
    {
      const current=await get(id);
      if(current.revision!==expectedRevision)throw failure('REVISION_CONFLICT','This draft changed after it was read',{current});
      const candidate=draftSchema.parse(await transform(structuredClone(current)));
      if(candidate.id!==current.id||candidate.spaceId!==current.spaceId||candidate.createdAt!==current.createdAt)throw failure('DRAFT_IDENTITY_CHANGED','Draft ID, Space and creation time cannot change');
      const next=draftSchema.parse({...candidate,revision:current.revision+1,updatedAt:new Date().toISOString()});
      return persist(next);
    }
  }

  async function mutate(id,revision,transform){return locked(id,()=>mutateUnlocked(id,revision,transform));}
  async function transaction(ids,operation){
    const ordered=[...new Set(ids)].sort();
    const next=index=>index===ordered.length?operation({get,mutate:mutateUnlocked}):locked(ordered[index],()=>next(index+1));
    return next(0);
  }
  return {directory:stateDirectory,create,get,mutate,transaction};
}
