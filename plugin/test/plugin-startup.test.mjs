import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

test('installed-format manifest starts the server without an unexpanded plugin-root placeholder',async()=>{
  const root=new URL('../',import.meta.url).pathname;
  const config=JSON.parse(await readFile(new URL('../.mcp.json',import.meta.url),'utf8')).mcpServers.cohub_cards;
  const transport=new StdioClientTransport({command:config.command,args:config.args,cwd:resolve(root,config.cwd),stderr:'pipe'});
  const client=new Client({name:'manifest-check',version:'1'});
  try {
    await client.connect(transport);
    const {tools}=await client.listTools();assert.ok(tools.some(tool=>tool.name==='prepare_generation'));
    const {contents}=await client.readResource({uri:'ui://cohub-cards/result.html'});
    assert.ok(contents[0].text.includes('<script type="module">'));
  } finally {await client.close();}
});
