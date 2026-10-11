import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGenerationService,generationArgs} from '../src/generation.mjs';
import {createDraftStore} from '../src/drafts.mjs';
const spaceId='11111111-1111-4111-8111-111111111111';
const taskRunId='22222222-2222-4222-8222-222222222222';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/models.json',import.meta.url),'utf8'));
const models=Array.isArray(fixtures)?fixtures:fixtures.models;
test('prompt text cannot be interpreted as CLI options',()=>{
  const args=generationArgs({spaceId,model:'qwen-image-2.1',prompt:'--help',media:[],parameters:{},meta:{}});
  assert.deepEqual(args.slice(-2),['--','--help']);
});
async function setup(t,execute){
  const directory=await mkdtemp(join(tmpdir(),'cohub-generation-test-'));t.after(()=>rm(directory,{recursive:true,force:true}));
  const store=createDraftStore({directory});
  const catalog={list:async()=>models.map(m=>({model:m.model,title:m.title,category:m.category||'speech'})),get:async id=>{const m=models.find(m=>m.model===id);assert.ok(m);return m;}};
  const service=createGenerationService({directory,store,catalog,execute,readCard:async q=>({kind:'generation',...q,status:'running',media:[],checkedAt:new Date().toISOString()})});
  return {service,store,directory};
}
test('agent and human changes are read from the same revision; stale edits cannot overwrite',async t=>{
  const {service}=await setup(t,async()=>{throw Error('unexpected CLI call')});
  const first=await service.prepare({spaceId,model:'qwen-image-2.1',prompt:'quiet coast'});
  const second=await service.update({draftId:first.draft.id,baseRevision:1,patch:{prompt:'quiet coast at dusk'}});
  assert.equal(second.draft.revision,2);assert.equal((await service.read({draftId:first.draft.id})).draft.prompt,'quiet coast at dusk');
  await assert.rejects(()=>service.update({draftId:first.draft.id,baseRevision:1,patch:{prompt:'lost edit'}}),e=>e.code==='REVISION_CONFLICT');
});
test('submission uses saved current fields once, persists task receipt, and survives a repeated call',async t=>{
  const calls=[];const {service,store}=await setup(t,async args=>{calls.push(args);return {taskRunId,status:'pending'};});
  const first=await service.prepare({spaceId,model:'suno_music_chirp_fenix',prompt:'coastal piano',meta:{title:'Coast',make_instrumental:true,metadata:{test:'kept'}}});
  const sent=await service.submit({draftId:first.draft.id,baseRevision:1});
  assert.equal(sent.draft.status,'submitted');assert.equal(sent.draft.taskRunId,taskRunId);
  assert.equal((await service.submit({draftId:first.draft.id,baseRevision:1})).draft.taskRunId,taskRunId);
  assert.equal(calls.length,1);assert.ok(calls[0].includes('--async'));
  assert.deepEqual(JSON.parse(calls[0][calls[0].indexOf('--meta')+1]),{title:'Coast',make_instrumental:true,metadata:{test:'kept'}});
  assert.equal((await store.get(first.draft.id)).taskRunId,taskRunId);
  await assert.rejects(()=>service.update({draftId:first.draft.id,baseRevision:sent.draft.revision,patch:{prompt:'different'}}),/新草稿/);
});
test('unknown CLI outcome is persisted and can never silently submit a second paid job',async t=>{
  let calls=0;const {service,store}=await setup(t,async()=>{calls++;throw Error('connection lost');});
  const first=await service.prepare({spaceId,model:'qwen-image-2.1',prompt:'coast'});
  await assert.rejects(()=>service.submit({draftId:first.draft.id,baseRevision:1}),/connection lost/);
  const saved=await store.get(first.draft.id);assert.equal(saved.status,'unknown');
  await assert.rejects(()=>service.submit({draftId:first.draft.id,baseRevision:saved.revision}),/未确认/);assert.equal(calls,1);
});
test('invalid typed parameters and unsupported media metadata never reach paid submission',async t=>{
  let calls=0;const {service}=await setup(t,async()=>{calls++;return {taskRunId};});
  const bad=await service.prepare({spaceId,model:'minimax-h3-max-turbo',prompt:'coast',parameters:{duration:'5'}});
  assert.ok(bad.validation.errors.length);await assert.rejects(()=>service.submit({draftId:bad.draft.id,baseRevision:1}),/duration/);assert.equal(calls,0);
});
test('missing task receipt after CLI success is an unknown attempt, not permission to retry',async t=>{
  let calls=0;const {service,store}=await setup(t,async()=>{calls++;return {status:'pending'};});
  const first=await service.prepare({spaceId,model:'qwen-image-2.1',prompt:'coast'});
  await assert.rejects(()=>service.submit({draftId:first.draft.id,baseRevision:1}));
  assert.equal((await store.get(first.draft.id)).status,'unknown');assert.equal(calls,1);
});
test('a failed reference upload cannot reach generation and preserves the draft for an explicit retry',async t=>{
 const calls=[];const {service,store}=await setup(t,async args=>{calls.push(args);throw Error('upload unavailable');});
 const first=await service.prepare({spaceId,model:'qwen-image-2.1',prompt:'coast'});
 const attached=await service.addReference({draftId:first.draft.id,baseRevision:1,type:'image',name:'coast.png',mimeType:'image/png',base64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBfcAAAAASUVORK5CYII='});
 await assert.rejects(()=>service.submit({draftId:first.draft.id,baseRevision:attached.draft.revision}),/upload unavailable/);
 assert.equal(calls.length,1);assert.ok(calls[0].includes('upload'));assert.ok(!calls[0].includes('generate'));
 const saved=await store.get(first.draft.id);assert.equal(saved.status,'draft');assert.match(saved.error,/尚未提交生成/);assert.equal(saved.media.length,1);
});
