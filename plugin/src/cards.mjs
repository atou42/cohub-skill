import { z } from 'zod';
import { runCohub } from './cli.mjs';

export const querySchema=z.object({kind:z.enum(['generation','publication']),spaceId:z.uuid(),id:z.uuid()}).strict();
const sourceSchema=z.discriminatedUnion('type',[
  z.object({type:z.literal('url'),url:z.string()}),
  z.object({type:z.literal('base64'),mediaType:z.string(),data:z.string().min(1)}),
]);
const blockSchema=z.union([
  z.object({type:z.literal('text'),text:z.string()}),
  z.object({type:z.enum(['image','video','audio']),source:sourceSchema}),
]);
const billingSchema=z.object({amountUsd:z.number().finite().nonnegative(),status:z.enum(['recorded','overage','skipped'])});
const resultSchema=z.object({model:z.string().min(1),output:z.array(blockSchema).min(1),billing:billingSchema.nullish()});
const timeSchema=z.iso.datetime({offset:true}).nullish();
const taskSchema=z.object({run:z.object({id:z.uuid(),spaceId:z.uuid(),taskType:z.literal('generation'),status:z.enum(['pending','running','completed','failed']),payload:z.object({data:z.object({model:z.string().min(1),content:z.array(blockSchema)})}),result:resultSchema.nullish(),errorMessage:z.string().nullish(),createdAt:timeSchema,startedAt:timeSchema,finishedAt:timeSchema})});
const appSchema=z.object({app:z.object({id:z.uuid(),spaceId:z.uuid(),status:z.enum(['published','disabled']),visibility:z.enum(['public','space']),slug:z.string().min(1),latestVersion:z.number().int().nonnegative(),meta:z.object({title:z.string().optional(),name:z.string().optional(),image:z.string().optional()}).nullish()}),publicUrl:z.string().nullable(),version:z.object({version:z.number().int().positive()}).nullish()});

function httpsUrl(value) {
  const url=new URL(value);
  if(url.protocol!=='https:' || url.username || url.password)throw new Error('Invalid media or publication URL');
  return url.href;
}
function mediaBlock(block) {
  if(block.type==='text')return [];
  if(block.source.type==='url')return [{type:block.type,url:httpsUrl(block.source.url)}];
  const {mediaType,data}=block.source;
  const supported={image:['image/png','image/jpeg','image/webp','image/gif','image/avif'],video:['video/mp4','video/webm','video/ogg'],audio:['audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/ogg','audio/flac']};
  if(!supported[block.type].includes(mediaType) || !data || Buffer.from(data,'base64').toString('base64')!==data)throw new Error('Invalid inline media');
  return [{type:block.type,url:`data:${mediaType};base64,${data}`,mimeType:mediaType}];
}
function sameIdentity(record,query) {
  if(record.id!==query.id || record.spaceId!==query.spaceId)throw new Error('The result does not belong to the requested object and Space');
}
export function generationCard(data,query) {
  const {run}=taskSchema.parse(data);sameIdentity(run,query);
  if(run.status==='completed' && !run.result)throw new Error('Completed task is missing its result');
  const media=run.result?.output.flatMap(mediaBlock) ?? [];
  if(run.status==='completed' && !media.length)throw new Error('Completed generation contains no displayable media');
  const prompt=run.payload.data.content.find(block=>block.type==='text')?.text;
  return {kind:'generation',spaceId:run.spaceId,id:run.id,title:'生成作品',...(prompt ? {prompt}:{}),
    status:run.status,model:run.payload.data.model,media,
    ...(run.result?.billing ? {billing:run.result.billing}:{}),
    ...(run.status==='failed' ? {error:run.errorMessage || '生成失败，服务未返回具体原因'}:{}),
    ...Object.fromEntries(['createdAt','startedAt','finishedAt'].filter(key=>run[key]).map(key=>[key,run[key]])),
    checkedAt:new Date().toISOString()};
}
export function publicationCard(data,query) {
  const {app,publicUrl,version}=appSchema.parse(data);sameIdentity(app,query);
  if(app.status==='published' && !publicUrl)throw new Error('Published App is missing its access URL');
  const versionNumber=version?.version ?? app.latestVersion;
  if(app.status==='published' && versionNumber<1)throw new Error('Published App is missing its version');
  return {kind:'publication',spaceId:app.spaceId,id:app.id,title:app.meta?.title || app.meta?.name || app.slug,
    status:app.status,visibility:app.visibility,...(versionNumber>0 ? {version:versionNumber}:{}),
    media:app.meta?.image ? [{type:'image',url:httpsUrl(app.meta.image)}]:[],
    ...(publicUrl ? {url:httpsUrl(publicUrl)}:{}),checkedAt:new Date().toISOString()};
}
export function createReader(execute=runCohub) {
  return async input=>{
    const query=querySchema.parse(input);
    const data=await execute(['-s',query.spaceId,query.kind==='generation'?'tasks':'apps','get',query.id,'--json']);
    return query.kind==='generation'?generationCard(data,query):publicationCard(data,query);
  };
}
