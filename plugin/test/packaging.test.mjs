import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, cp, readdir, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const exec = promisify(execFile);
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'cohub-package-'));
  t.after(() => rm(root, {recursive:true, force:true}));
  const put = async (path, value) => {await mkdir(join(root,path,'..'),{recursive:true}); await writeFile(join(root,path),value);};
  await cp(new URL('../scripts/',import.meta.url),join(root,'plugin/scripts'),{recursive:true});
  for (const language of ['en','zh-CN']) {
    const dir = language === 'en' ? 'skills/cohub' : 'zh-CN/skills/cohub';
    await put(`${dir}/SKILL.md`, `---\nname: cohub\ndescription: Cohub\n---\n${language}\n`);
    await put(`${dir}/version.json`, JSON.stringify({schemaVersion:1,name:'cohub',version:'2.3.0',language}));
    await put(`${dir}/references/plugin.md`, `${language} complete plugin instructions`);
  }
  await put('plugin/src/server.mjs','// server');
  await put('plugin/dist/card.html','<html>card</html>');
  await put('plugin/.mcp.json','{"mcpServers":{"cohub_cards":{"command":"node","args":["src/server.mjs"],"cwd":"."}}}');
  await put('plugin/.codex-plugin/plugin.json',JSON.stringify({name:'cohub-cards',version:'0.6.0',skills:'./skills/',mcpServers:'./.mcp.json',interface:{displayName:'Cohub'}}));
  await put('plugin/package.json','{"name":"cohub-inline-plugin","version":"0.6.0"}');
  await put('plugin/package-lock.json','{"name":"cohub-inline-plugin","version":"0.6.0"}');
  await put('plugin/skills/cohub-cards/SKILL.md','obsolete competing instructions');
  await put('plugin/release/skills/cohub-cards/SKILL.md','old installed entry');
  return {root,put};
}

test('package contains only the selected canonical Cohub skill and leaves old output intact', async t => {
  const {root} = await fixture(t);
  const output = join(root,'package');
  await exec(process.execPath,[join(root,'plugin/scripts/package.mjs'),'--output',output,'--language','zh-CN']);
  assert.deepEqual(await readdir(join(output,'release/skills')),['cohub']);
  assert.equal(await readFile(join(output,'release/skills/cohub/SKILL.md'),'utf8'),await readFile(join(root,'zh-CN/skills/cohub/SKILL.md'),'utf8'));
  assert.equal(await readFile(join(output,'release/skills/cohub/references/plugin.md'),'utf8'),'zh-CN complete plugin instructions');
  assert.equal(await readFile(join(root,'plugin/release/skills/cohub-cards/SKILL.md'),'utf8'),'old installed entry');
  const marketplace=JSON.parse(await readFile(join(output,'.agents/plugins/marketplace.json'),'utf8'));
  assert.equal(marketplace.name,'cohub-cards-local');
  assert.equal(marketplace.plugins[0].name,'cohub-cards');
  assert.equal(marketplace.plugins[0].source.path,'./release');
});

test('external package carries the identical skill without registering a second entry', async t => {
  const {root}=await fixture(t), output=join(root,'external');
  await exec(process.execPath,[join(root,'plugin/scripts/package.mjs'),'--output',output,'--skill-mode','external']);
  assert.deepEqual(await readdir(join(output,'release/skills')),[]);
  assert.equal(await readFile(join(output,'release/bundled-skills/cohub/SKILL.md'),'utf8'),await readFile(join(root,'skills/cohub/SKILL.md'),'utf8'));
  const metadata=JSON.parse(await readFile(join(output,'package-info.json'),'utf8'));
  assert.equal(metadata.skillMode,'external');
  assert.equal(metadata.skillVersion,'2.3.0');
  assert.equal(metadata.language,'en');
});

test('packaging rejects existing output, invalid modes and missing source without overwriting evidence',async t=>{
  const {root,put}=await fixture(t), output=join(root,'occupied');
  await put('occupied/user-note.txt','keep me');
  await assert.rejects(exec(process.execPath,[join(root,'plugin/scripts/package.mjs'),'--output',output]));
  assert.equal(await readFile(join(output,'user-note.txt'),'utf8'),'keep me');
  for(const args of [['--skill-mode','broken'],['--language','fr'],['--unknown','value']]){
    await assert.rejects(exec(process.execPath,[join(root,'plugin/scripts/package.mjs'),'--output',join(root,'invalid'),...args]));
  }
  await rm(join(root,'skills/cohub/version.json'));
  await assert.rejects(exec(process.execPath,[join(root,'plugin/scripts/package.mjs'),'--output',join(root,'missing')]));
  await assert.rejects(readFile(join(root,'missing/package-info.json')), {code:'ENOENT'});
});
