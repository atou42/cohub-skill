import {createHash} from 'node:crypto';
import {z} from 'zod';
import {createDraftStore,mediaSchema,patchSchema,briefSchema,continuationIdsSchema} from './drafts.mjs';
import {createModelCatalog,validateDraft,limitationsFor} from './models.mjs';
import {createReader} from './cards.mjs';
import {runCohub} from './cli.mjs';
import {MAX_REFERENCE_BYTES,stageReference,uploadReference} from './references.mjs';

const jsonObject=z.record(z.string(),z.json());
export const prepareSchema=z.object({
  spaceId:z.uuid(),title:z.string().max(200).optional(),model:z.string().min(1).nullable().optional(),
  prompt:z.string().max(100000).optional(),media:z.array(mediaSchema).max(30).optional(),
  parameters:jsonObject.optional(),meta:jsonObject.optional(),brief:briefSchema.optional(),continuationDraftIds:continuationIdsSchema.optional(),
}).strict();
export const readDraftSchema=z.object({draftId:z.uuid()}).strict();
export const revisionSchema=readDraftSchema.extend({baseRevision:z.number().int().positive()}).strict();
const reviewedRevisionSchema=revisionSchema.extend({reviewToken:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export const confirmGenerationSchema=reviewedRevisionSchema.extend({continuations:z.array(reviewedRevisionSchema).max(19).optional(),budgetUsd:z.number().positive().optional()}).strict();
export const updateDraftSchema=revisionSchema.extend({patch:patchSchema}).strict();
export const addReferenceSchema=revisionSchema.extend({
  type:z.enum(['image','video','audio']),url:z.string().optional(),filePath:z.string().optional(),
  name:z.string().max(240).optional(),mimeType:z.string().max(100).optional(),
  base64:z.string().max(Math.ceil(MAX_REFERENCE_BYTES/3)*4).optional(),role:z.string().max(80).optional(),
}).strict();

function editable(draft) {
  if(draft.status!=='draft')throw new Error('这份草稿已经提交；继续修改请创建新草稿，原任务仍可查看。');
}
function fields(draft) {
  return {model:draft.model,prompt:draft.prompt,media:draft.media,parameters:draft.parameters,meta:draft.meta};
}
export function generationArgs(draft,media=draft.media) {
  const args=['-s',draft.spaceId,'generate','--model',draft.model,'--async','--json'];
  for(const item of media) {
    if(item.source.type!=='url')throw new Error('本地素材尚未完成上传');
    const extra=Object.keys(item.meta||{}).filter(key=>key!=='role');
    if(extra.length)throw new Error(`官方 CLI 不支持素材字段：${extra.join(', ')}`);
    args.push(`--${item.type}`,`${item.meta?.role?item.meta.role+'=':''}${item.source.url}`);
  }
  if(Object.keys(draft.parameters).length)args.push('--parameters',JSON.stringify(draft.parameters));
  if(Object.keys(draft.meta).length)args.push('--meta',JSON.stringify(draft.meta));
  args.push('--',draft.prompt);
  return args;
}
function stableJSON(value) {
  if(Array.isArray(value))return '['+value.map(stableJSON).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().filter(key=>value[key]!==undefined).map(key=>JSON.stringify(key)+':'+stableJSON(value[key])).join(',')+'}';
  return JSON.stringify(value);
}
export function reviewToken(draft,model){return createHash('sha256').update(stableJSON({draft,model})).digest('hex');}
export function estimateCost(draft,model) {
  const no=costReason=>({cost:null,costReason});
  if(model?.pricing===undefined)return no('模型未提供费用');
  const p=model.pricing;
  const validAmount=p&&Number.isFinite(p.amount)&&p.amount>=0&&p.min===undefined&&p.max===undefined;
  const validRange=p&&p.amount===undefined&&Number.isFinite(p.min)&&Number.isFinite(p.max)&&p.min>=0&&p.max>=p.min;
  if(!p||typeof p!=='object'||Array.isArray(p)||typeof p.unit!=='string'||!p.unit.trim()||!(validAmount||validRange))throw new Error('模型定价数据无效，请检查官方模型声明');
  if(p.currency!==undefined&&p.currency!=='USD')return no('费用币种不受支持');
  if(p.amount===undefined||!Number.isFinite(p.amount)||p.amount<0||p.min!==undefined||p.max!==undefined)return no('范围或不完整定价无法确定费用');
  if(Object.keys(p).some(k=>!['unit','amount','currency','note'].includes(k)))return no('存在未支持的定价条件');
  let quantity;
  if(p.unit==='request')quantity=1;
  else if(p.unit==='image'){
    quantity=draft.parameters.n??model.parameters?.n?.default;
    if(!Number.isInteger(quantity)||quantity<=0)return no('图片数量未知，无法估算费用');
  }else if(p.unit==='second'){
    quantity=draft.parameters.duration??model.parameters?.duration?.default;
    if(!Number.isFinite(quantity)||quantity<=0)return no('时长未知，无法估算费用');
  }else return no('此计费单位暂不支持费用估算');
  const amount=p.amount*quantity;
  if(!Number.isFinite(amount))return no('费用计算超出有效范围');
  return {cost:{minUsd:amount,maxUsd:amount},costReason:'按模型公布价格估算；实际收费以 Cohub 为准'};
}
export function createGenerationService({execute=runCohub,store=createDraftStore(),catalog=createModelCatalog(execute),readCard=createReader(execute),directory=store.directory}={}) {
  async function view(draft) {
    const [models,model,generation]=await Promise.all([
      catalog.list(),draft.model?catalog.get(draft.model):null,
      draft.taskRunId?readCard({kind:'generation',spaceId:draft.spaceId,id:draft.taskRunId}):null,
    ]);
    const continuations=await Promise.all((draft.continuationDraftIds??[]).map(async id=>{const child=await store.get(id);if(child.spaceId!==draft.spaceId)throw new Error('后续草稿必须属于同一 Space');const m=child.model?await catalog.get(child.model):null;return {draft:child,model:m,reviewToken:reviewToken(child,m),...estimateCost(child,m),validation:m?validateDraft(fields(child),m):{errors:[{path:'model',message:'请选择模型'}]},generation:child.taskRunId?await readCard({kind:'generation',spaceId:child.spaceId,id:child.taskRunId}):null};}));
    return {kind:'composer',draft,model,catalog:models,generation,review:{token:reviewToken(draft,model),...estimateCost(draft,model),continuations},
      validation:model?validateDraft(fields(draft),model):{errors:[{path:'model',message:'请选择生成模型',kind:'missing'}]},
      limitations:model?limitationsFor(model):[]};
  }
  async function validateContinuations(spaceId,ids,rootId) {
    for(const id of ids??[]){
      if(id===rootId)throw new Error('草稿不能将自己作为后续任务');
      const child=await store.get(id);
      if(child.spaceId!==spaceId)throw new Error('后续草稿必须属于同一 Space');
    }
  }
  async function prepare(input) {
    const args=prepareSchema.parse(input);
    if(args.model)await catalog.get(args.model);
    await validateContinuations(args.spaceId,args.continuationDraftIds);
    return view(await store.create(args));
  }
  async function read(input) {
    const {draftId}=readDraftSchema.parse(input);
    return view(await store.get(draftId));
  }
  async function update(input) {
    const {draftId,baseRevision,patch}=updateDraftSchema.parse(input);
    if(patch.model)await catalog.get(patch.model);
    return view(await store.mutate(draftId,baseRevision,async draft=>{editable(draft);await validateContinuations(draft.spaceId,patch.continuationDraftIds,draftId);return {...draft,...patch};}));
  }
  async function addReference(input) {
    const args=addReferenceSchema.parse(input);
    if([args.url,args.filePath,args.base64].filter(value=>value!==undefined).length!==1)throw new Error('请选择一个素材链接或文件');
    const saved=await store.mutate(args.draftId,args.baseRevision,async draft=>{
      editable(draft);
      const source=args.url?{type:'url',url:args.url}:await stageReference(directory,args);
      const item=mediaSchema.parse({type:args.type,source,...(args.role?{meta:{role:args.role}}:{})});
      return {...draft,media:[...draft.media,item]};
    });
    return view(saved);
  }
  async function submit(input) {
    const {draftId,baseRevision}=revisionSchema.parse(input);
    const current=await store.get(draftId);
    if(current.reviewPaused)throw new Error('草稿已暂停，请在卡片中明确确认后继续。');
    if(current.status==='submitted')return view(current);
    if(current.status==='submitting')return view(current);
    if(current.status==='unknown')throw new Error(`此前提交结果未确认，不能重复生成。请先查询 Cohub 任务。${current.error||''}`);
    if(!current.model)throw new Error('请选择生成模型');
    const model=await catalog.get(current.model,{fresh:true});
    const validation=validateDraft(fields(current),model);
    if(validation.errors.length)throw new Error(validation.errors.map(error=>`${error.path}：${error.message}`).join('\n'));
    const started=await store.mutate(draftId,baseRevision,draft=>{editable(draft);const next={...draft,status:'submitting'};delete next.error;return next;});
    return runStarted(started);
  }
  async function runStarted(started) {
    const draftId=started.id;
    let media;
    try {
      media=[];
      for(const item of started.media)media.push(item.source.type==='file'?await uploadReference(execute,directory,draftId,started.spaceId,item):item);
    } catch(error) {
      await store.mutate(draftId,started.revision,draft=>({...draft,status:'draft',error:`素材上传失败，尚未提交生成：${error.message}`}));
      throw error;
    }
    let receipt;
    try {
      const result=await execute(generationArgs(started,media),{timeoutMs:120000});
      receipt=z.object({taskRunId:z.uuid()}).parse(result);
    } catch(error) {
      await store.mutate(draftId,started.revision,draft=>({...draft,status:'unknown',error:`提交结果未确认：${error.message}`}));
      throw error;
    }
    let saved;
    try {
      saved=await store.mutate(draftId,started.revision,draft=>({...draft,status:'submitted',taskRunId:receipt.taskRunId}));
    } catch(error) {
      throw new Error(`任务已提交，编号 ${receipt.taskRunId}；保存回执失败，不能重新提交：${error.message}`);
    }
    return view(saved);
  }
  async function cancel(input) {
    const {draftId,baseRevision}=revisionSchema.parse(input);
    return view(await store.mutate(draftId,baseRevision,draft=>{editable(draft);return {...draft,reviewPaused:true};}));
  }
  async function confirm(input) {
    const args=confirmGenerationSchema.parse(input),selected=args.continuations??[];
    const ids=[args.draftId,...selected.map(x=>x.draftId)];
    if(new Set(ids).size!==ids.length)throw new Error('不能重复选择草稿');
    let started,existing;
    await store.transaction(ids,async tx=>{
      const root=await tx.get(args.draftId);
      if(root.batchReview){
        if(root.batchReview.status==='stopped')throw new Error(`此前批次已停止，不能重试或继续。${root.batchReview.error??''}`);
        existing=root;return;
      }
      if(root.status==='submitted'||root.status==='submitting'){existing=root;return;}
      const requests=[{draftId:args.draftId,baseRevision:args.baseRevision,reviewToken:args.reviewToken},...selected];
      let total=0;const drafts=[];
      for(const item of requests){
        const draft=await tx.get(item.draftId);
        if(draft.revision!==item.baseRevision)throw Object.assign(new Error('草稿已更新，请重新查看方案'),{code:'REVISION_CONFLICT',current:draft});
        editable(draft);
        if(draft.batchReview)throw new Error('后续草稿已属于一个批次');
        if(draft.id!==root.id&&draft.reviewPaused)throw new Error('后续草稿已暂停，请分别确认后再选择');
        if(draft.spaceId!==root.spaceId)throw new Error('后续草稿必须属于同一 Space');
        if(draft.id!==root.id&&!root.continuationDraftIds?.includes(draft.id))throw new Error('后续草稿不在已展示的方案中');
        if(!draft.model)throw new Error('请选择生成模型');
        const model=await catalog.get(draft.model,{fresh:true});
        if(reviewToken(draft,model)!==item.reviewToken)throw Object.assign(new Error('方案、模型设置或费用已变化，请查看更新后的方案再确认'),{code:'REVIEW_CHANGED'});
        const validation=validateDraft(fields(draft),model);
        if(validation.errors.length)throw new Error(validation.errors.map(e=>`${e.path}：${e.message}`).join('\n'));
        if(selected.length){const estimate=estimateCost(draft,model);if(!estimate.cost)throw new Error(`无法确认批次费用：${estimate.costReason}`);total+=estimate.cost.maxUsd;}
        drafts.push(draft);
      }
      if(selected.length&&(!args.budgetUsd||!Number.isFinite(total)||total>args.budgetUsd+Number.EPSILON))throw new Error('预计费用超过预算，或尚未填写预算');
      started=[];
      for(const draft of drafts)started.push(await tx.mutate(draft.id,draft.revision,d=>({...d,reviewPaused:false,status:'submitting',...(selected.length&&draft.id===root.id?{batchReview:{status:'submitting',items:requests.map(({draftId,baseRevision})=>({draftId,baseRevision})),budgetUsd:args.budgetUsd,estimatedCostUsd:total}}:{})})));
    });
    if(existing)return view(existing);
    if(!selected.length)return runStarted(started[0]);
    const attempted=new Set();
    try {
      for(const draft of started){attempted.add(draft.id);await runStarted(draft);}
      const latest=await store.get(args.draftId);
      return view(await store.mutate(latest.id,latest.revision,d=>({...d,batchReview:{...d.batchReview,status:'submitted'}})));
    }catch(error){
      // Preserve every receipt and pause every unsubmitted selection; a stopped batch is never resumed.
      for(const planned of started){const d=await store.get(planned.id);if(d.status!=='submitted')await store.mutate(d.id,d.revision,current=>({...current,...(!attempted.has(planned.id)?{status:'draft'}:{}),reviewPaused:true}));}
      const latest=await store.get(args.draftId);
      await store.mutate(latest.id,latest.revision,d=>({...d,batchReview:{...d.batchReview,status:'stopped',error:error.message}}));
      throw new Error(`批次已停止：${error.message}。已完成的回执已保留；请读取草稿查看进度，不能重试本批次。`);
    }
  }
  return {prepare,read,update,addReference,submit,confirm,cancel,store};
}
