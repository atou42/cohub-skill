import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer,UI_URI } from '../src/server.mjs';
async function connect(reader) {
  const server=createServer(reader),client=new Client({name:'test',version:'1'});
  const [a,b]=InMemoryTransport.createLinkedPair();await server.connect(a);await client.connect(b);
  return {client,close:()=>Promise.all([client.close(),server.close()])};
}
test('presentation has UI; refresh is app-only; tool output preserves the real record',async()=>{
  const seen=[],card={kind:'generation',status:'running',id:'22222222-2222-4222-8222-222222222222',spaceId:'11111111-1111-4111-8111-111111111111',media:[]};
  const {client,close}=await connect(async args=>{seen.push(args);return card;});
  try {
    const {tools}=await client.listTools();
    assert.deepEqual(tools.map(t=>t.name),['show_generation','show_publication','read_card','prepare_generation','read_generation_draft','update_generation_draft','submit_generation','confirm_generation','cancel_generation','add_generation_reference']);
    for(const name of ['confirm_generation','cancel_generation'])assert.deepEqual(tools.find(t=>t.name===name)._meta.ui.visibility,['app']);
    assert.equal(tools[0]._meta.ui.resourceUri,UI_URI);assert.deepEqual(tools[2]._meta.ui.visibility,['app']);
    assert.equal(tools[2]._meta.ui.resourceUri,undefined);
    assert.equal(tools[3]._meta.ui.resourceUri,UI_URI);
    for(const tool of tools.slice(4))assert.equal(tool._meta.ui.resourceUri,undefined);
    assert.equal(tools[6].annotations.readOnlyHint,false);
    assert.equal(tools[6].annotations.idempotentHint,true);
    const result=await client.callTool({name:'show_generation',arguments:{spaceId:card.spaceId,id:card.id}});
    assert.deepEqual(result.structuredContent,card);assert.deepEqual(seen,[{kind:'generation',spaceId:card.spaceId,id:card.id}]);
  } finally {await close();}
});
test('CLI failure is an MCP error, not a successful empty card',async()=>{
  const {client,close}=await connect(async()=>{throw new Error('Cohub unavailable');});
  try {
    const result=await client.callTool({name:'show_publication',arguments:{spaceId:'11111111-1111-4111-8111-111111111111',id:'22222222-2222-4222-8222-222222222222'}});
    assert.equal(result.isError,true);assert.equal(result.structuredContent,undefined);assert.equal(result.content[0].text,'Cohub unavailable');
  } finally {await close();}
});
test('resource policy includes the official hosts used by real App covers',async()=>{
  const {client,close}=await connect(async()=>{});
  try {
    const {contents}=await client.readResource({uri:UI_URI});
    assert.equal(contents[0].mimeType,'text/html;profile=mcp-app');
    const domains=contents[0]._meta.ui.csp.resourceDomains;
    for(const domain of ['https://router-files.neta.art','https://works.cohub.live','https://public.cohub.live'])assert.ok(domains.includes(domain),domain);
  } finally {await close();}
});
