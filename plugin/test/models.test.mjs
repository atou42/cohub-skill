import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createModelCatalog,validateDraft,limitationsFor} from '../src/models.mjs';
const models=JSON.parse(readFileSync(new URL('./fixtures/models.json',import.meta.url)));
const model=id=>models.find(m=>m.model===id);
const draft=(id,extra={})=>({model:id,prompt:'A calm landscape with bright clouds',media:[],parameters:{},meta:{},...extra});
const media=(type,role)=>({type,source:{type:'url',url:'https://example.com/ref'},...(role?{meta:{role}}:{})});
const check=(id,extra)=>validateDraft(draft(id,extra),model(id)).errors;
test('cold catalog uses one listing and no unrelated model detail requests',async()=>{
 const rows=models.map(({model,title,description,pricing})=>({model,title,description,pricing}));const calls=[];
 const catalog=createModelCatalog(async args=>{calls.push(args);if(args[1]==='ls')return {models:rows};throw Error('unrelated Gemini detail timeout');});
 const result=await catalog.list();assert.deepEqual(result,rows);assert.equal(result.length,18);assert.equal(result.find(m=>m.model==='higgs-tts').category,undefined);
 result[0].title='changed';assert.deepEqual(await catalog.list(),rows);assert.deepEqual(calls,[['models','ls','--model-type','multimodal','--json']]);
});
test('catalog preserves optional category and rejects bad fields, prices and duplicate IDs',async()=>{
 const row={model:'some-model',title:'Some model',description:'Description',category:'audio',pricing:{unit:'request',amount:0.1}};
 assert.deepEqual(await createModelCatalog(async()=>({models:[row]})).list(),[row]);
 for(const patch of [{model:''},{title:3},{description:null},{category:'invented'},{pricing:{unit:'image',amount:-1}},{pricing:{unit:'image',amount:1,min:0,max:2}}])await assert.rejects(createModelCatalog(async()=>({models:[{...row,...patch}]})).list());
 await assert.rejects(createModelCatalog(async()=>({models:[row,row]})).list(),/duplicate/);
});
test('fresh fetch failure is exposed; corrupt schemas are rejected',async()=>{
 let broken=false;const c=createModelCatalog(async()=>{if(broken)throw Error('network');return model('noobxl')});await c.get('noobxl');broken=true;await assert.rejects(c.get('noobxl',{fresh:true}),/network/);
 for(const value of [{}, {...model('noobxl'),model:'other'}, {...model('noobxl'),parameters:{x:{type:'array'}}}])await assert.rejects(createModelCatalog(async()=>value).get('noobxl'));
});
test('image, video, speech and music valid drafts retain object metadata',()=>{
 for(const id of ['noobxl','minimax-h3-max-turbo','higgs-tts','qwen-audio-3.0-tts-plus','suno_music_chirp_fenix'])assert.deepEqual(check(id,{}),[]);
 const d=draft('suno_music_chirp_fenix',{meta:{metadata:{a:[1,true]},make_instrumental:true}});assert.deepEqual(validateDraft(d,model(d.model)).errors,[]);assert.deepEqual(d.meta.metadata,{a:[1,true]});
});
test('types, ranges, enums, unknown fields and dimensions are validated',()=>{
 for(const parameters of [{seed:'1'},{seed:-1},{seed:1.5},{size:'tiny'},{invented:2}])assert.ok(check('noobxl',{parameters}).length);
 assert.ok(check('suno_music_chirp_fenix',{meta:{metadata:'{}'}}).length);assert.ok(check('suno_music_chirp_fenix',{meta:{unknown:true}}).length);
 const m={...model('noobxl'),parameters:{size:{type:'string',dimensions:{separator:'x',min:64,max:1024,multipleOf:8}}}};
 assert.ok(validateDraft(draft(m.model,{parameters:{size:'65x64'}}),m).errors.length);assert.deepEqual(validateDraft(draft(m.model,{parameters:{size:'128x64'}}),m).errors,[]);
});
test('media capability, roles, counts and sources are enforced',()=>{
 assert.ok(check('krea2',{media:[media('image')]}).length);assert.ok(check('noobxl',{media:[media('image'),media('image')]}).length);
 assert.ok(check('minimax-h3-max-turbo',{media:[media('image')]}).length);
 assert.deepEqual(check('minimax-h3-max-turbo',{media:[media('image','first_frame')]}),[]);
 assert.ok(check('seedance-2-0-fast',{media:[media('audio','reference_audio')]}).length);
 assert.ok(check('seedance-2-0-fast',{media:[media('image','first_frame'),media('audio','reference_audio')]}).length);
 assert.ok(check('minimax-h3-max-turbo',{media:[media('image','first_frame'),media('image','first_frame')]}).length);
 assert.ok(check('noobxl',{media:[{...media('image'),source:{type:'url',url:'javascript:alert(1)'}}]}).length);
});
test('TTS conflicts and unsupported block metadata are explicit',()=>{
 assert.ok(check('qwen-audio-3.0-tts-plus',{prompt:'短句'}).length);
 assert.ok(check('qwen-audio-3.0-tts-plus',{media:[media('audio')],meta:{voice_prompt:'warm'}}).length);
 assert.deepEqual(check('higgs-tts',{media:[media('audio')]}),[]);
 assert.ok(check('higgs-tts',{media:[media('audio'),media('audio')]}).length);
 assert.ok(check('higgs-tts',{media:[{...media('audio'),meta:{weight:1}}]}).length);
 assert.ok(limitationsFor(model('higgs-tts')).some(x=>x.includes('CLI')));
});
test('missing data and invalid defaults are not silently fixed',()=>{
 const d=draft('noobxl',{prompt:'',parameters:{seed:null}});assert.ok(validateDraft(d,model('noobxl')).errors.length>=2);assert.equal(d.parameters.seed,null);
 assert.ok(validateDraft({...draft('noobxl'),unknown:1},model('noobxl')).errors.length);
 assert.deepEqual(check('birefnet-general',{prompt:'',media:[media('image')]}),[]);
});
test('rejects corrupt display fields, descriptor bounds, and malformed role/source declarations',async()=>{
 for(const patch of [{title:12},{description:null},{parameters:{seed:{type:'integer',min:9,max:1}}},{content:{input:[{type:'image',roleRequired:true}]}},{pricing:{unit:'image',amount:1,min:0,max:2}}])await assert.rejects(createModelCatalog(async()=>({...model('noobxl'),...patch})).get('noobxl'));
});
test('auto size is accepted only when explicitly declared, while arbitrary valid dimensions remain accepted',()=>{
 assert.deepEqual(check('gpt-image-2',{parameters:{size:'auto'}}),[]);
 assert.ok(check('gpt-image-2.5',{parameters:{size:'auto'}}).length);
 assert.deepEqual(check('gpt-image-2',{parameters:{size:'1200x1200'}}),[]);
 assert.ok(check('gpt-image-2',{parameters:{size:'501x501'}}).length);
});
test('all official request examples pass except explicitly unsupported weighted audio',()=>{
 for(const m of models)for(const ex of m.examples??[]){
  const r=ex.request;const d=draft(m.model,{prompt:r.content.filter(c=>c.type==='text').map(c=>c.text).join('\n'),media:r.content.filter(c=>c.type!=='text'),parameters:r.parameters??{},meta:r.meta??{}});
  const errors=validateDraft(d,m).errors;
  if(d.media.some(c=>c.meta?.weight!==undefined)){assert.ok(errors.some(e=>e.path.endsWith('.weight')),`${m.model}: ${ex.title}`);}
  else assert.deepEqual(errors,[],`${m.model}: ${ex.title}`);
 }
});
test('missing inputs are marked as still needed, while invalid values stay plain errors',()=>{
 assert.deepEqual(check('noobxl',{prompt:''}),[{path:'prompt',message:'请输入生成内容',kind:'missing'}]);
 assert.ok(check('minimax-h3-max-turbo',{media:[media('image')]}).some(e=>e.path==='media.0.meta.role'&&e.kind==='missing'));
 assert.ok(check('birefnet-general',{prompt:''}).some(e=>e.path==='media'&&e.kind==='missing'));
 const invalid=check('noobxl',{parameters:{size:'tiny'}});
 assert.ok(invalid.length);assert.ok(invalid.every(e=>e.kind===undefined));
});
test('an empty speech draft only asks for text; a short non-empty text is still rejected',()=>{
 assert.deepEqual(check('qwen-audio-3.0-tts-plus',{prompt:''}),[{path:'prompt',message:'请输入生成内容',kind:'missing'}]);
 assert.ok(check('qwen-audio-3.0-tts-plus',{prompt:'短句'}).some(e=>e.message.includes('15')&&e.kind===undefined));
});
