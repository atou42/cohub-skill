import {runCohub} from './cli.mjs';
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const mediaTypes=['image','video','audio'];
const fail=message=>{throw new Error(`Invalid Cohub model declaration: ${message}`)};
function descriptors(fields,allowObject=false){
 if(!object(fields))fail('fields must be an object');
 for(const [key,s] of Object.entries(fields)){
  if(!object(s)||!['string','number','integer','boolean',...(allowObject?['object']:[])].includes(s.type))fail(`invalid descriptor ${key}`);
  if(s.optional!==undefined&&typeof s.optional!=='boolean')fail(`invalid optional ${key}`);
  if(s.description!==undefined&&typeof s.description!=='string')fail(`invalid description ${key}`);
  for(const k of ['min','max'])if(s[k]!==undefined&&(!Number.isFinite(s[k])||!['number','integer'].includes(s.type)))fail(`invalid ${key}.${k}`);
  if(s.min!==undefined&&s.max!==undefined&&s.min>s.max)fail(`invalid bounds ${key}`);
  if(s.enum!==undefined&&(!Array.isArray(s.enum)||!s.enum.length||s.type!=='string'||s.enum.some(v=>typeof v!=='string')))fail(`invalid enum ${key}`);
  if(s.dimensions!==undefined){const d=s.dimensions;if(s.type!=='string'||!object(d)||(d.separator!==undefined&&!['x','*'].includes(d.separator)))fail(`invalid dimensions ${key}`);for(const k of ['min','max','multipleOf'])if(d[k]!==undefined&&(!Number.isInteger(d[k])||d[k]<=0))fail(`invalid dimensions ${key}.${k}`);}
  if(s.default!==undefined&&fieldErrors(s.default,s).length)fail(`invalid default ${key}`);
 }
}
function declaration(m,id){
 if(!object(m)||m.schema!=='neta.generation.model.v1'||m.model!==id||typeof id!=='string'||!id.trim())fail('schema or model identity mismatch');
 for(const key of ['title','description'])if(m[key]!==undefined&&typeof m[key]!=='string')fail(`invalid ${key}`);
 if(!object(m.content)||!Array.isArray(m.content.input)||!m.content.input.length)fail('missing content.input');
 const seen=new Set();for(const s of m.content.input){
  if(!object(s)||!['text',...mediaTypes].includes(s.type)||seen.has(s.type))fail('invalid content descriptor');seen.add(s.type);
  for(const k of ['min','max'])if(s[k]!==undefined&&(!Number.isInteger(s[k])||s[k]<0))fail(`invalid content.${k}`);
  if(s.min!==undefined&&s.max!==undefined&&s.min>s.max)fail('content min exceeds max');
  for(const k of ['required','roleRequired'])if(s[k]!==undefined&&typeof s[k]!=='boolean')fail(`invalid content.${k}`);
  if(s.sources!==undefined&&(!Array.isArray(s.sources)||!s.sources.length||s.sources.some(x=>!['url','base64'].includes(x))))fail('invalid sources');
  if(s.roles!==undefined&&(!Array.isArray(s.roles)||!s.roles.length||s.roles.some(x=>typeof x!=='string'||!x)))fail('invalid roles');
  if(s.roleRequired&&!s.roles?.length)fail('required roles missing');
 }
 if(m.parameters!==undefined)descriptors(m.parameters);
 if(m.meta!==undefined){if(!object(m.meta))fail('invalid meta');if(m.meta.fields!==undefined)descriptors(m.meta.fields,true);}
 if(m.category!==undefined&&!['image','video','audio','speech','music'].includes(m.category))fail('unknown category');
 if(m.pricing!==undefined){const p=m.pricing;if(!object(p)||typeof p.unit!=='string'||!p.unit||!(Number.isFinite(p.amount)&&p.amount>=0&&p.min===undefined&&p.max===undefined||p.amount===undefined&&Number.isFinite(p.min)&&Number.isFinite(p.max)&&p.min>=0&&p.max>=p.min))fail('invalid pricing');}
 return m;
}
function catalogEntry(m){
 if(!object(m)||typeof m.model!=='string'||!m.model.trim())fail('catalog model id');
 for(const key of ['title','description'])if(m[key]!==undefined&&typeof m[key]!=='string')fail(`invalid ${key}`);
 if(m.category!==undefined&&!['image','video','audio','speech','music'].includes(m.category))fail('unknown category');
 if(m.pricing!==undefined){const p=m.pricing;if(!object(p)||typeof p.unit!=='string'||!p.unit||!(Number.isFinite(p.amount)&&p.amount>=0&&p.min===undefined&&p.max===undefined||p.amount===undefined&&Number.isFinite(p.min)&&Number.isFinite(p.max)&&p.min>=0&&p.max>=p.min)||p.note!==undefined&&typeof p.note!=='string')fail('invalid pricing');}
 return Object.fromEntries(['model','title','description','pricing','category'].filter(key=>m[key]!==undefined).map(key=>[key,m[key]]));
}
export function createModelCatalog(execute=runCohub){
 const cache=new Map();let listing;const ttl=300000;
 async function get(id,{fresh=false}={}){const c=cache.get(id);if(!fresh&&c&&Date.now()-c.time<ttl)return structuredClone(c.value);const value=declaration(await execute(['models','show',id,'--json']),id);cache.set(id,{value:structuredClone(value),time:Date.now()});return structuredClone(value);}
 async function list(){
  if(listing&&Date.now()-listing.time<ttl)return structuredClone(listing.value);
  const raw=await execute(['models','ls','--model-type','multimodal','--json']);if(!object(raw)||!Array.isArray(raw.models))fail('catalog missing models');
  const value=raw.models.map(catalogEntry);const ids=value.map(m=>m.model);if(new Set(ids).size!==ids.length)fail('duplicate catalog model');
  listing={value:structuredClone(value),time:Date.now()};return structuredClone(value);
 }
 return {list,get};
}
function fieldErrors(v,s){
 const errors=[];if(s.type==='object'){if(!object(v))errors.push('必须为对象');return errors;}
 if(s.type==='integer'? !Number.isInteger(v):s.type==='number'? typeof v!=='number'||!Number.isFinite(v):typeof v!==s.type){return ['字段类型错误'];}
 if(s.enum&&!s.enum.includes(v))errors.push('不在允许的选项中');
 if(s.min!==undefined&&v<s.min)errors.push(`不得小于 ${s.min}`);if(s.max!==undefined&&v>s.max)errors.push(`不得大于 ${s.max}`);
 // `auto` is a documented sentinel for some dimension fields, not a global size option.
 // Examples remain examples: other valid dimensions do not need to appear in them.
 if(s.dimensions&&!(v==='auto'&&Array.isArray(s.examples)&&s.examples.includes('auto'))){const d=s.dimensions;const parts=v.split(d.separator??'x');if(parts.length!==2||parts.some(x=>!/^\d+$/.test(x)))errors.push('尺寸格式错误');else if(parts.map(Number).some(n=>n<=0||d.min!==undefined&&n<d.min||d.max!==undefined&&n>d.max||d.multipleOf!==undefined&&n%d.multipleOf!==0))errors.push('尺寸不符合范围或步长');}
 return errors;
}
export function validateDraft(draft,model){
 declaration(model,model?.model);const errors=[];const add=(path,message)=>errors.push({path,message});
 // Missing input is a next step for the person, not a broken value.
 const need=(path,message)=>errors.push({path,message,kind:'missing'});
 if(!object(draft))return {errors:[{path:'draft',message:'草稿必须为对象'}]};
 for(const key of Object.keys(draft))if(!['model','prompt','media','parameters','meta'].includes(key))add(key,'不支持的草稿字段');
 if(draft.model!==model.model)add('model','模型不匹配');if(typeof draft.prompt!=='string')add('prompt','请输入文字');
 const inputs=model.content.input;const text=inputs.find(s=>s.type==='text');if(text?.required&&(typeof draft.prompt!=='string'||!draft.prompt.trim()))need('prompt','请输入生成内容');
 if(!text&&draft.prompt)add('prompt','此模型不接受文字');
 const media=Array.isArray(draft.media)?draft.media:[];if(!Array.isArray(draft.media))add('media','素材列表缺失');
 for(const spec of inputs.filter(s=>s.type!=='text')){const count=media.filter(m=>m?.type===spec.type).length;const min=spec.min??(spec.required?1:0);if(count<min)need('media',`${spec.type} 至少需要 ${min} 个`);if(spec.max!==undefined&&count>spec.max)add('media',`${spec.type} 最多 ${spec.max} 个`);}
 media.forEach((m,i)=>{
  const path=`media.${i}`;if(!object(m)){add(path,'素材格式错误');return;}
  for(const key of Object.keys(m))if(!['type','source','meta'].includes(key))add(`${path}.${key}`,'不支持的素材字段');
  const spec=inputs.find(s=>s.type===m.type&&mediaTypes.includes(m.type));if(!spec)add(path,'模型不支持此类素材');
  const s=m.source;if(!object(s))add(`${path}.source`,'素材来源缺失');else if(s.type==='url'){
   for(const key of Object.keys(s))if(!['type','url'].includes(key))add(`${path}.source.${key}`,'不支持的来源字段');
   try{const u=new URL(s.url);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error();}catch{add(`${path}.source.url`,'请提供有效的 HTTP(S) 素材链接');}
   if(spec?.sources&&!spec.sources.includes('url'))add(`${path}.source`,'模型不接受链接素材');
  }else if(s.type==='file'){
   for(const key of Object.keys(s))if(!['type','id','name','mimeType','size'].includes(key))add(`${path}.source.${key}`,'不支持的文件字段');
   for(const key of ['id','name','mimeType'])if(typeof s[key]!=='string'||!s[key].trim())add(`${path}.source.${key}`,'文件信息缺失');
   if(!Number.isInteger(s.size)||s.size<=0)add(`${path}.source.size`,'文件大小无效');
   if(typeof s.mimeType==='string'&&!s.mimeType.startsWith(`${m.type}/`))add(`${path}.source.mimeType`,'文件类型与素材类型不一致');
  }else add(`${path}.source.type`,'只支持上传文件或链接');
  if(m.meta!==undefined&&!object(m.meta))add(`${path}.meta`,'素材设置必须为对象');
  if(object(m.meta))for(const key of Object.keys(m.meta))if(key!=='role')add(`${path}.meta.${key}`,'当前官方 CLI 不支持此素材字段，不能提交');
  const role=m.meta?.role;if(spec?.roleRequired&&!role)need(`${path}.meta.role`,'请选择素材用途');if(role!==undefined&&(!spec?.roles?.includes(role)||typeof role!=='string'))add(`${path}.meta.role`,'模型不支持此素材用途');
 });
 for(const [section,specs] of [['parameters',model.parameters??{}],['meta',model.meta?.fields??{}]]){
  const value=draft[section];if(!object(value)){add(section,'字段必须为对象');continue;}
  for(const [key,v] of Object.entries(value)){const spec=specs[key];if(!spec){add(`${section}.${key}`,'模型未声明此字段');continue;}for(const message of fieldErrors(v,spec))add(`${section}.${key}`,message);}
  for(const [key,spec] of Object.entries(specs))if(spec.optional!==true&&spec.default===undefined&&value[key]===undefined)need(`${section}.${key}`,'必填字段缺失');
 }
 const roles=media.map(m=>m?.meta?.role);const frame=roles.some(r=>['first_frame','last_frame'].includes(r));const reference=roles.some(r=>['reference_image','reference_video','reference_audio'].includes(r));
 if(frame&&reference)add('media','首尾帧不能与参考素材混用');for(const role of ['first_frame','last_frame'])if(roles.filter(r=>r===role).length>1)add('media',`${role} 只能有一个`);
 if(['seedance-2-0','seedance-2-0-fast'].includes(model.model)&&media.some(m=>m?.type==='audio')&&!media.some(m=>['image','video'].includes(m?.type)))add('media','此模型的参考音频还需要图片或视频');
 if(model.model.startsWith('seedance-')&&(frame||media.some(m=>m?.type==='video'))){const ratio=draft.parameters?.ratio??model.parameters?.ratio?.default;if(ratio!==undefined&&ratio!=='adaptive')add('parameters.ratio','首尾帧或参考视频需要 adaptive 比例');}
 if(model.model==='qwen-audio-3.0-tts-plus'){if(typeof draft.prompt==='string'&&draft.prompt.trim()&&[...draft.prompt].length<15)add('prompt','语音文本至少需要 15 个字符');if(media.some(m=>m?.type==='audio')&&draft.meta?.voice_prompt!==undefined)add('meta.voice_prompt','参考音频和声音描述不能同时使用');}
 if(model.model==='higgs-tts'&&media.filter(m=>m?.type==='audio').length>1)add('media','多音色混合需要权重，当前官方 CLI 暂不支持；可使用默认音色或一条参考音频');
 return {errors};
}
export function limitationsFor(model){return model.model==='higgs-tts'?['支持默认音色或单条参考音频；多音色混合需官方 CLI 支持素材权重后才能提交。']:[];}
