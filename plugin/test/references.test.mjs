import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {stageReference,uploadReference,referencePath} from '../src/references.mjs';
const data='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBfcAAAAASUVORK5CYII=';
const draftId='22222222-2222-4222-8222-222222222222',spaceId='11111111-1111-4111-8111-111111111111';
async function directory(t){const dir=await mkdtemp(join(tmpdir(),'cohub-media-test-'));t.after(()=>rm(dir,{recursive:true,force:true}));return dir;}
test('a selected file is staged locally and official upload returns the exact remote URL',async t=>{
 const dir=await directory(t),source=await stageReference(dir,{type:'image',name:'coast.png',mimeType:'image/png',base64:data});
 assert.equal((await readFile(referencePath(dir,source))).toString('base64'),data);
 const calls=[];
 const execute=async args=>{calls.push(args);const path=args.at(-1);return {destination:path,urlPrefix:'https://public.cohub.live/home/',files:[{path,size:source.size,mimeType:source.mimeType}]};};
 const result=await uploadReference(execute,dir,draftId,spaceId,{type:'image',source,meta:{role:'first_frame'}});
 assert.deepEqual(calls[0].slice(0,5),['--json','-s',spaceId,'public','upload']);
 assert.equal(result.source.url,`https://public.cohub.live/home/cohub-card-inputs/${draftId}/${source.id}.png`);
 assert.equal(result.meta.role,'first_frame');
});
test('bad base64, active documents and mismatched files are rejected before staging',async t=>{
 const dir=await directory(t);
 for(const input of [
   {type:'image',mimeType:'image/png',base64:'%%%='},
   {type:'image',mimeType:'image/svg+xml',base64:Buffer.from('<svg/>').toString('base64')},
   {type:'image',mimeType:'image/png',base64:Buffer.from('secret text').toString('base64')},
   {type:'audio',mimeType:'image/png',base64:data},
 ])await assert.rejects(()=>stageReference(dir,input));
});
test('upload failure and mismatched receipt are explicit and never replaced with inline data',async t=>{
 const dir=await directory(t),source=await stageReference(dir,{type:'image',name:'coast.png',mimeType:'image/png',base64:data});
 const item={type:'image',source};
 await assert.rejects(()=>uploadReference(async()=>{throw Error('upload offline')},dir,draftId,spaceId,item),/upload offline/);
 await assert.rejects(()=>uploadReference(async()=>({destination:'other',files:[],urlPrefix:'https://public.cohub.live/'}),dir,draftId,spaceId,item));
});
test('retrying this same staged reference can replace its own isolated upload without a duplicate-file error',async t=>{
 const dir=await directory(t),source=await stageReference(dir,{type:'image',name:'coast.png',mimeType:'image/png',base64:data});
 const uploaded=new Set();
 const execute=async args=>{
  const path=args.at(-1);
  if(uploaded.has(path)&&!args.includes('--overwrite'))throw Error('already exists. Use --overwrite.');
  uploaded.add(path);
  return {destination:path,urlPrefix:'https://public.cohub.live/home/',files:[{path,size:source.size,mimeType:source.mimeType}]};
 };
 const first=await uploadReference(execute,dir,draftId,spaceId,{type:'image',source});
 const second=await uploadReference(execute,dir,draftId,spaceId,{type:'image',source});
 assert.equal(second.source.url,first.source.url);assert.equal(uploaded.size,1);
});
