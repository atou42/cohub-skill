import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,stat,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createDraftStore,draftSchema,mediaSchema,patchSchema} from '../src/drafts.mjs';

const spaceId='11111111-1111-4111-8111-111111111111';
async function setup(t) {
  const parent=await mkdtemp(path.join(tmpdir(),'cohub-drafts-test-'));
  t.after(()=>rm(parent,{recursive:true,force:true}));
  const directory=path.join(parent,'state');
  return {directory,store:createDraftStore({directory})};
}

test('creates private durable drafts with explicit defaults and reloads the exact saved record',async t=>{
  const {directory,store}=await setup(t);
  assert.equal(store.directory,directory);
  const draft=await store.create({spaceId,prompt:'海岸'});
  assert.equal(draftSchema.safeParse(draft).success,true);
  assert.deepEqual({...draft,id:undefined,createdAt:undefined,updatedAt:undefined},{
    id:undefined,spaceId,revision:1,title:'',model:null,prompt:'海岸',media:[],parameters:{},meta:{},status:'draft',createdAt:undefined,updatedAt:undefined,
  });
  assert.equal(draft.createdAt,draft.updatedAt);
  assert.deepEqual(await createDraftStore({directory}).get(draft.id),draft);
  assert.deepEqual(JSON.parse(await readFile(path.join(directory,`${draft.id}.json`),'utf8')),draft);
  assert.equal((await stat(directory)).mode&0o777,0o700);
  assert.equal((await stat(path.join(directory,`${draft.id}.json`))).mode&0o777,0o600);
  assert.deepEqual(await readdir(directory),[`${draft.id}.json`]);
});

test('the write lock also excludes a separate Node process',async t=>{
  const {directory,store}=await setup(t),draft=await store.create({spaceId,prompt:'原稿'});
  const program=`import {createDraftStore} from ${JSON.stringify(new URL('../src/drafts.mjs',import.meta.url).href)};
    const store=createDraftStore({directory:${JSON.stringify(directory)}});
    await store.mutate(${JSON.stringify(draft.id)},1,async draft=>{
      process.stdout.write('locked\\n');
      await new Promise(resolve=>process.stdin.once('data',resolve));
      return {...draft,prompt:'子进程已保存'};
    });process.stdin.destroy();`;
  const child=spawn(process.execPath,['--input-type=module','--eval',program],{stdio:['pipe','pipe','pipe']});
  t.after(()=>{if(child.exitCode===null)child.kill();});
  let stderr='';child.stderr.on('data',chunk=>{stderr+=chunk;});
  const exit=once(child,'exit');
  const [ready]=await once(child.stdout,'data',{signal:AbortSignal.timeout(5000)});
  assert.equal(ready.toString(),'locked\n');
  await assert.rejects(store.mutate(draft.id,1,current=>({...current,prompt:'冲突写入'})),error=>error.code==='DRAFT_LOCKED');
  child.stdin.end('continue');
  const [code]=await exit;assert.equal(code,0,stderr);
  const saved=await store.get(draft.id);assert.equal(saved.prompt,'子进程已保存');assert.equal(saved.revision,2);
});

test('two independent stores cannot enter the same mutation; stale revisions cannot overwrite a saved edit',async t=>{
  const {directory,store}=await setup(t),other=createDraftStore({directory});
  const original=await store.create({spaceId,prompt:'原稿'});
  let enter,release;const entered=new Promise(resolve=>{enter=resolve;}),gate=new Promise(resolve=>{release=resolve;});
  const first=store.mutate(original.id,1,async draft=>{enter();await gate;return {...draft,prompt:'第一处修改'};});
  await entered;
  let secondRan=false;
  try {
    await assert.rejects(other.mutate(original.id,1,draft=>{secondRan=true;return {...draft,prompt:'不应写入'};}),error=>error.code==='DRAFT_LOCKED');
    assert.equal(secondRan,false);
    assert.deepEqual(await other.get(original.id),original);
  } finally {release();}
  const saved=await first;
  assert.equal(saved.revision,2);assert.equal(saved.prompt,'第一处修改');
  await assert.rejects(other.mutate(original.id,1,draft=>({...draft,prompt:'过期修改'})),error=>{
    assert.equal(error.code,'REVISION_CONFLICT');assert.deepEqual(error.current,saved);return true;
  });
  assert.deepEqual(await other.get(original.id),saved);
  const third=await other.mutate(original.id,2,draft=>({...draft,prompt:'第二处修改'}));
  assert.equal(third.revision,3);assert.equal(third.prompt,'第二处修改');
  assert.equal(third.createdAt,original.createdAt);
  assert.ok(Date.parse(third.updatedAt)>=Date.parse(saved.updatedAt));
  assert.deepEqual(await readdir(directory),[`${original.id}.json`]);
});

test('malformed JSON and invalid stored schemas remain untouched after failed reads and edits',async t=>{
  const {directory,store}=await setup(t),draft=await store.create({spaceId});
  const file=path.join(directory,`${draft.id}.json`);
  const damaged=['{broken',JSON.stringify({...draft,revision:0}),JSON.stringify({...draft,unexpected:true})];
  for(const contents of damaged) {
    await writeFile(file,contents);
    await assert.rejects(store.get(draft.id));
    await assert.rejects(store.mutate(draft.id,1,value=>({...value,prompt:'不能覆盖'})));
    assert.equal(await readFile(file,'utf8'),contents);
    assert.deepEqual(await readdir(directory),[`${draft.id}.json`]);
  }
});

test('an existing lock is preserved exactly and blocks writes instead of being treated as stale',async t=>{
  const {directory,store}=await setup(t),draft=await store.create({spaceId,prompt:'保留'});
  const lock=path.join(directory,`${draft.id}.lock`),contents='do not discard this lock';
  await writeFile(lock,contents,{mode:0o600});
  await assert.rejects(store.mutate(draft.id,1,current=>({...current,prompt:'覆盖'})),error=>error.code==='DRAFT_LOCKED');
  assert.equal(await readFile(lock,'utf8'),contents);
  assert.deepEqual(await store.get(draft.id),draft);
});

test('failed transforms and invalid results release only their own lock and preserve the record',async t=>{
  const {directory,store}=await setup(t),draft=await store.create({spaceId,prompt:'保留'});
  const before=await readFile(path.join(directory,`${draft.id}.json`));
  const failure=new Error('specific transform failure');
  await assert.rejects(store.mutate(draft.id,1,()=>{throw failure;}),error=>error===failure);
  await assert.rejects(store.mutate(draft.id,1,current=>({...current,status:'bad-state'})));
  assert.deepEqual(await readFile(path.join(directory,`${draft.id}.json`)),before);
  assert.deepEqual(await readdir(directory),[`${draft.id}.json`]);
  const saved=await store.mutate(draft.id,1,current=>({...current,title:'可以继续'}));
  assert.equal(saved.title,'可以继续');assert.equal(saved.revision,2);
});

test('identity is checked on reads and cannot be changed by a transform or path-like id',async t=>{
  const {directory,store}=await setup(t),draft=await store.create({spaceId});
  const file=path.join(directory,`${draft.id}.json`),otherId=randomUUID();
  for(const patch of [{id:otherId},{spaceId:otherId},{createdAt:'2000-01-01T00:00:00.000Z'}]) {
    await assert.rejects(store.mutate(draft.id,1,current=>({...current,...patch})),error=>error.code==='DRAFT_IDENTITY_CHANGED');
    assert.deepEqual(await store.get(draft.id),draft);
  }
  await assert.rejects(store.get('../outside'));
  await assert.rejects(store.mutate('../outside',1,value=>value));
  const wrong=JSON.stringify({...draft,id:otherId});await writeFile(file,wrong);
  await assert.rejects(store.get(draft.id),error=>error.code==='DRAFT_ID_MISMATCH');
  await assert.rejects(store.mutate(draft.id,1,value=>value),error=>error.code==='DRAFT_ID_MISMATCH');
  assert.equal(await readFile(file,'utf8'),wrong);
});

test('patches and media reject hidden fields, executable URLs, credentials, and file paths',()=>{
  const file={type:'image',source:{type:'file',id:randomUUID(),name:'海岸.png',mimeType:'image/png',size:120},meta:{role:'reference'}};
  assert.deepEqual(mediaSchema.parse(file),file);
  const url={type:'image',source:{type:'url',url:'https://router-files.neta.art/picture/test.webp'}};
  assert.deepEqual(mediaSchema.parse(url),url);
  assert.deepEqual(patchSchema.parse({prompt:'test',media:[file,url],parameters:{size:'1536x1024',nested:[1,true,null,{x:'y'}]}}).media,[file,url]);
  for(const patch of [{id:randomUUID()},{spaceId},{revision:2},{status:'submitted'},{taskRunId:randomUUID()},{prompt:undefined,extra:1}])assert.throws(()=>patchSchema.parse(patch));
  for(const invalid of [
    {...url,source:{type:'url',url:'http://example.com/image.png'}},
    {...url,source:{type:'url',url:'https://user:pass@example.com/image.png'}},
    {...url,source:{type:'url',url:'file:///private/example.png'}},
    {...file,source:{...file.source,path:'/private/example.png'}},
    {...file,source:{...file.source,size:0}},
  ])assert.throws(()=>mediaSchema.parse(invalid));
  assert.equal(mediaSchema.safeParse({...url,source:{type:'url',url:'not a URL'}}).success,false);
});

test('limits and non-JSON data fail explicitly without replacing a saved record',async t=>{
  const {directory,store}=await setup(t),draft=await store.create({spaceId});
  const media={type:'image',source:{type:'url',url:'https://example.com/image.png'}};
  for(const patch of [{prompt:'x'.repeat(100001)},{media:Array(31).fill(media)},{parameters:{bad:Infinity}},{meta:{bad:undefined}},{parameters:{large:'x'.repeat(2*1024*1024)}}]) {
    await assert.rejects(store.mutate(draft.id,1,current=>({...current,...patch})));
    assert.deepEqual(await store.get(draft.id),draft);
  }
  await assert.rejects(store.create({spaceId,prompt:'x'.repeat(100001)}));
  assert.deepEqual(await readdir(directory),[`${draft.id}.json`]);
});

test('a submitted draft requires a receipt; every other state rejects one before saving',async t=>{
  const {directory,store}=await setup(t),draft=await store.create({spaceId});
  const taskRunId=randomUUID();
  const invalid=[{status:'submitted'},...['draft','submitting','unknown'].map(status=>({status,taskRunId}))];
  for(const state of invalid) {
    assert.equal(draftSchema.safeParse({...draft,...state}).success,false);
    await assert.rejects(store.create({spaceId,...state}));
    await assert.rejects(store.mutate(draft.id,1,current=>({...current,...state})));
    assert.deepEqual(await store.get(draft.id),draft);
  }
  assert.deepEqual(await readdir(directory),[`${draft.id}.json`]);
  for(const status of ['draft','submitting','unknown'])assert.equal(draftSchema.safeParse({...draft,status}).success,true);
  const submitted=await store.mutate(draft.id,1,current=>({...current,status:'submitted',taskRunId}));
  assert.equal(submitted.status,'submitted');assert.equal(submitted.taskRunId,taskRunId);
  assert.deepEqual(await store.get(draft.id),submitted);
});

test('bad stored state/receipt combinations remain unreadable and cannot be silently repaired',async t=>{
  const {directory,store}=await setup(t),draft=await store.create({spaceId});
  const file=path.join(directory,`${draft.id}.json`),taskRunId=randomUUID();
  for(const state of [{status:'submitted'},...['draft','submitting','unknown'].map(status=>({status,taskRunId}))]) {
    const damaged=JSON.stringify({...draft,...state});await writeFile(file,damaged);
    await assert.rejects(store.get(draft.id));
    let ran=false;
    await assert.rejects(store.mutate(draft.id,1,current=>{ran=true;return {...current,status:'submitted',taskRunId};}));
    assert.equal(ran,false);
    assert.equal(await readFile(file,'utf8'),damaged);
    assert.deepEqual(await readdir(directory),[`${draft.id}.json`]);
  }
});
