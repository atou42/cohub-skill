import test from 'node:test';
import assert from 'node:assert/strict';
import { generationCard, publicationCard, createReader } from '../src/cards.mjs';
const spaceId='11111111-1111-4111-8111-111111111111';
const id='22222222-2222-4222-8222-222222222222';
const query={spaceId,id};
const run={id,spaceId,taskType:'generation',status:'running',payload:{data:{model:'example',content:[{type:'text',text:'A coast'}]}},result:null};

test('running task retains exact identity, no invented media, percent, or zero charge',()=>{
  const card=generationCard({run},query);
  assert.equal(card.id,id);assert.equal(card.status,'running');assert.deepEqual(card.media,[]);
  assert.equal(card.billing,undefined);assert.equal(card.progress,undefined);
});
test('rejects cross-space, wrong identity, malformed state, and empty completed payload',()=>{
  for(const changed of [{spaceId:'other'},{id:'other'},{status:'unknown'},{status:'completed',result:null}])
    assert.throws(()=>generationCard({run:{...run,...changed}},query));
});
test('completed task returns the actual media and effective charge only with billing status',()=>{
  const result={model:'example',output:[{type:'image',source:{type:'url',url:'https://cdn.example.org/image.png'}}],cost:0.1,billing:{amountUsd:0.04,status:'recorded'}};
  const card=generationCard({run:{...run,status:'completed',result}},query);
  assert.deepEqual(card.media,[{type:'image',url:'https://cdn.example.org/image.png'}]);
  assert.deepEqual(card.billing,{amountUsd:0.04,status:'recorded'});
  assert.throws(()=>generationCard({run:{...run,status:'completed',result:{...result,output:[]}}},query));
});
test('failed task retains actual service error',()=>{
  assert.equal(generationCard({run:{...run,status:'failed',errorMessage:'provider refused'}},query).error,'provider refused');
});
test('inline output accepts a supported MIME and rejects executable or broken media',()=>{
  const make=(mediaType,data='aGVsbG8=')=>({run:{...run,status:'completed',result:{model:'example',output:[{type:'image',source:{type:'base64',mediaType,data}}]}}});
  assert.equal(generationCard(make('image/png'),query).media[0].url,'data:image/png;base64,aGVsbG8=');
  assert.throws(()=>generationCard(make('image/svg+xml'),query));
  assert.throws(()=>generationCard(make('image/png','A'),query));
  assert.throws(()=>generationCard(make('video/mp4'),query));
});
const app={id,spaceId,status:'published',visibility:'space',slug:'coast',latestVersion:2,meta:{title:'Coast',image:'https://cdn.example.org/cover.png'}};
test('publication uses server link, exact version and visibility, never assumes verification',()=>{
  const card=publicationCard({app,publicUrl:'https://cohub.live/example/demo/w/coast',version:{version:2}},query);
  assert.equal(card.url,'https://cohub.live/example/demo/w/coast');assert.equal(card.version,2);assert.equal(card.visibility,'space');
  assert.equal(card.verified,undefined);assert.equal(card.media[0].url,app.meta.image);
});
test('missing link or unsafe media is explicit, never fabricated',()=>{
  assert.throws(()=>publicationCard({app,publicUrl:null},query));
  assert.throws(()=>publicationCard({app:{...app,meta:{image:'javascript:alert(1)'}},publicUrl:'https://cohub.live/a'},query));
});
test('an unpublished disabled App has no invented version or access link',()=>{
  const card=publicationCard({app:{...app,status:'disabled',latestVersion:0},publicUrl:null},query);
  assert.equal(card.status,'disabled');assert.equal(card.version,undefined);assert.equal(card.url,undefined);
});
test('reader uses CLI argument arrays and read operations only',async()=>{
  const calls=[];const reader=createReader(async args=>{calls.push(args);return {run};});
  await reader({kind:'generation',...query});await reader({kind:'generation',...query});
  assert.deepEqual(calls,[['-s',spaceId,'tasks','get',id,'--json'],['-s',spaceId,'tasks','get',id,'--json']]);
  await assert.rejects(()=>reader({kind:'generation',id:'--help',spaceId}));
});
test('upstream network and JSON errors propagate without becoming empty successful cards',async()=>{
  const cause=new Error('CLI failed');const reader=createReader(async()=>{throw cause;});
  await assert.rejects(()=>reader({kind:'generation',...query}),error=>error===cause);
});
test('task times pass through only when they are real dates',()=>{
  const card=generationCard({run:{...run,createdAt:'2026-10-09T15:07:38.730Z',startedAt:'2026-10-09T15:07:38.735Z',finishedAt:null}},query);
  assert.equal(card.createdAt,'2026-10-09T15:07:38.730Z');assert.equal(card.startedAt,'2026-10-09T15:07:38.735Z');assert.equal(card.finishedAt,undefined);
  assert.equal(generationCard({run},query).startedAt,undefined);
  assert.throws(()=>generationCard({run:{...run,startedAt:'yesterday'}},query));
});
