import {readFile} from 'node:fs/promises';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {registerAppTool,registerAppResource} from '@modelcontextprotocol/ext-apps/server';
import {z} from 'zod';
import {createReader,querySchema} from './cards.mjs';
import {createGenerationService,prepareSchema,readDraftSchema,updateDraftSchema,revisionSchema,addReferenceSchema,confirmGenerationSchema} from './generation.mjs';
export const UI_URI='ui://cohub-cards/result.html';
export function createServer(reader=createReader(),generation=createGenerationService()) {
  const server=new McpServer({name:'cohub-cards',version:'0.5.0'});
  const annotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:true};
  const ui={resourceUri:UI_URI};
  registerAppResource(server,'cohub-result',UI_URI,{},async()=>({contents:[{
    uri:UI_URI,mimeType:'text/html;profile=mcp-app',text:await readFile(new URL('../dist/card.html',import.meta.url),'utf8'),
    _meta:{ui:{prefersBorder:false,csp:{resourceDomains:['https://router-files.neta.art','https://oss.talesofai.cn','https://sessions.cohub.live','https://cca.neta.art','https://works.cohub.live','https://public.cohub.live'],connectDomains:[]}},'openai/ui':{preferredDisplayMode:'inline',availableDisplayModes:['inline','fullscreen']}},
  }]}));
  async function respond(handler,args) {
    try {const card=await handler(args);return {structuredContent:card,content:[{type:'text',text:JSON.stringify(card),annotations:{audience:['assistant']}}]};}
    catch(error){return {isError:true,content:[{type:'text',text:error.code==='REVISION_CONFLICT'?'REVISION_CONFLICT: 内容已更新，请读取最新草稿后合并。':error.message}],...(error.code?{_meta:{code:error.code,currentRevision:error.current?.revision}}:{})};}
  }
  const identity=z.object({spaceId:z.uuid(),id:z.uuid()}).strict();
  registerAppTool(server,'show_generation',{title:'查看 Cohub 生成结果',description:'Show an existing Cohub generation as a large visual card. Read only. Use prepare_generation for a new shared editable draft.',inputSchema:identity,annotations,_meta:{ui}},args=>respond(reader,{kind:'generation',...args}));
  registerAppTool(server,'show_publication',{title:'查看 Cohub 发布结果',description:'Show a published Cohub App with its actual link and version. Read only; publish using the official Cohub CLI first.',inputSchema:identity,annotations,_meta:{ui}},args=>respond(reader,{kind:'publication',...args}));
  server.registerTool('read_card',{description:'Refresh this card from the same existing Cohub object without submitting any job.',inputSchema:querySchema,annotations,_meta:{ui:{visibility:['app']}}},args=>respond(reader,args));
  const edits={readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:false};
  registerAppTool(server,'prepare_generation',{
    title:'准备 Cohub 生成',description:'Prepare a shared draft and inline UI without generating or charging. Populate brief.summary and brief.output so the card displays the plan alongside exact prompt, all references and roles, output scope and grounded cost estimate (or unknown). User can confirm directly in the card without a chat message. Optional continuationDraftIds must reference already prepared independent drafts in the same Space; no dynamic future stages. Wait for approval before submission unless the user explicitly delegated approval within a stated scope. An initial creative request is not approval of an unseen brief. For edits read and update the same draftId.',
    inputSchema:prepareSchema,annotations:edits,_meta:{ui},
  },args=>respond(generation.prepare,args));
  server.registerTool('read_generation_draft',{
    title:'读取生成草稿',description:'Read the latest shared draft, its revision, live model fields and any submitted result. Read before editing; the user may have changed the UI.',
    inputSchema:readDraftSchema,annotations,_meta:{ui:{visibility:['model','app']}},
  },args=>respond(generation.read,args));
  server.registerTool('update_generation_draft',{
    title:'共同编辑生成内容',description:'Update the same user/agent draft using its current baseRevision. Only supplied fields change. Conflicts preserve existing work; read and merge instead of retrying an old copy. This tool updates the existing card, without submitting generation.',
    inputSchema:updateDraftSchema,annotations:edits,_meta:{ui:{visibility:['model','app']}},
  },args=>respond(generation.update,args));
  server.registerTool('submit_generation',{
    title:'开始 Cohub 生成',description:'Submit a saved draft and incur model charges only AFTER the user approves its displayed brief (plan, exact prompt, references, scope and costs), or under explicit user-delegated approval within its limits. A generic creation request, silence or approval of a previous stage is insufficient. Re-read and match the current draft to the approved brief; material changes require renewed approval. A user click on Generate confirms the current draft. Requires current revision. Never retry an unknown attempt. Local references are uploaded to accessible URLs in the selected Cohub Space.',
    inputSchema:revisionSchema,annotations:{...edits,idempotentHint:true,openWorldHint:true},_meta:{ui:{visibility:['model','app']}},
  },args=>respond(generation.submit,args));
  server.registerTool('confirm_generation',{
    title:'确认方案并生成',description:'User-click confirmation of the displayed saved revisions and required reviewToken for each selection. Tokens bind the exact draft and model declaration, including defaults and pricing; changed reviews must be displayed again. Optional independent prepared continuations require a positive estimated-cost budget; this is not a hard billing cap. Preflight and claim all selections before any submission. Stops on failure or uncertain outcome and never resumes a stopped batch.',
    inputSchema:confirmGenerationSchema,annotations:{...edits,idempotentHint:true,openWorldHint:true},_meta:{ui:{visibility:['app']}},
  },args=>respond(generation.confirm,args));
  server.registerTool('cancel_generation',{
    title:'取消并保留草稿',description:'Pause an unsubmitted draft and keep all content. Only explicit user confirmation in the card can resume; model edits do not clear this pause.',
    inputSchema:revisionSchema,annotations:edits,_meta:{ui:{visibility:['app']}},
  },args=>respond(generation.cancel,args));
  server.registerTool('add_generation_reference',{
    title:'添加生成素材',description:'Attach exactly one HTTPS URL or user-selected local media file to the shared draft. A file is staged locally, up to 20 MB; upload happens only at generation submission. Browser UIs pass base64; agents may pass an authorized local filePath. Preserves media type and declared role.',
    inputSchema:addReferenceSchema,annotations:edits,_meta:{ui:{visibility:['model','app']}},
  },args=>respond(generation.addReference,args));
  return server;
}
if(process.argv[1] && new URL(import.meta.url).pathname===process.argv[1])await createServer().connect(new StdioServerTransport());
