import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,cp,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {discoverSkills,selectSkillMode} from '../scripts/install-lib.mjs';

async function fixture(t){
  const root=await mkdtemp(join(tmpdir(),'cohub-select-')); t.after(()=>rm(root,{recursive:true,force:true}));
  const canonical=join(root,'source'), skillsRoot=join(root,'user-skills');
  await mkdir(join(canonical,'references'),{recursive:true}); await mkdir(skillsRoot);
  await writeFile(join(canonical,'SKILL.md'),'---\nname: cohub\ndescription: Cohub\n---\nCommon\n<!-- COHUB_INIT_START -->\nInit\n<!-- COHUB_INIT_END -->\n');
  await writeFile(join(canonical,'version.json'),JSON.stringify({schemaVersion:1,name:'cohub',version:'2.3.0',language:'en'}));
  await writeFile(join(canonical,'references/plugin.md'),'Shared draft instructions');
  await writeFile(join(canonical,'references/init.md'),'Init only');
  return {root,canonical,skillsRoot};
}

test('fresh installation selects bundled, existing exact skill selects external without changes',async t=>{
  const {root,canonical,skillsRoot}=await fixture(t);
  assert.equal((await selectSkillMode({canonical,roots:[skillsRoot]})).mode,'bundled');
  const existing=join(skillsRoot,'cohub'); await cp(canonical,existing,{recursive:true});
  const before=await readFile(join(existing,'SKILL.md'),'utf8');
  const plan=await selectSkillMode({canonical,roots:[skillsRoot]});
  assert.equal(plan.mode,'external');assert.equal(plan.skillPath,existing);
  assert.equal(await readFile(join(existing,'SKILL.md'),'utf8'),before);
  await assert.rejects(selectSkillMode({canonical,roots:[skillsRoot],mode:'bundled'}),/duplicate/i);
});

test('symlink duplicates resolve to one skill and authorized init cleanup stays compatible',async t=>{
  const {root,canonical,skillsRoot}=await fixture(t), installed=join(root,'installed');
  await cp(canonical,installed,{recursive:true});
  await symlink(installed,join(skillsRoot,'cohub'));
  await symlink(installed,join(skillsRoot,'same-cohub'));
  assert.equal((await discoverSkills([skillsRoot])).length,1);
  await rm(join(installed,'references/init.md'));
  await writeFile(join(installed,'SKILL.md'),'---\nname: cohub\ndescription: Cohub\n---\nCommon\n');
  assert.equal((await selectSkillMode({canonical,roots:[skillsRoot]})).mode,'external');
});

test('outdated, customized, damaged and competing entries stop without changing originals',async t=>{
  const {canonical,skillsRoot}=await fixture(t), installed=join(skillsRoot,'cohub');
  await cp(canonical,installed,{recursive:true});
  const metadata=join(installed,'version.json');
  for(const content of ['{broken',JSON.stringify({schemaVersion:1,name:'cohub',version:'2.2.1',language:'en'})]){
    await writeFile(metadata,content);
    await assert.rejects(selectSkillMode({canonical,roots:[skillsRoot]}));
    assert.equal(await readFile(metadata,'utf8'),content);
  }
  await cp(join(canonical,'version.json'),metadata);
  await writeFile(join(installed,'references/plugin.md'),'my custom rules');
  await assert.rejects(selectSkillMode({canonical,roots:[skillsRoot]}),/different|custom/i);
  assert.equal(await readFile(join(installed,'references/plugin.md'),'utf8'),'my custom rules');
  await cp(join(canonical,'references/plugin.md'),join(installed,'references/plugin.md'));
  await cp(canonical,join(skillsRoot,'second'),{recursive:true});
  await assert.rejects(selectSkillMode({canonical,roots:[skillsRoot]}),/multiple/i);
  await rm(join(skillsRoot,'second'),{recursive:true});
  await rm(join(installed,'references/plugin.md'));
  await assert.rejects(selectSkillMode({canonical,roots:[skillsRoot]}));
});

test('external requires a discovered existing entry and malformed candidate cannot disappear',async t=>{
  const {root,canonical,skillsRoot}=await fixture(t);
  await assert.rejects(selectSkillMode({canonical,roots:[skillsRoot],mode:'external'}),/existing/i);
  await symlink(join(root,'gone'),join(skillsRoot,'cohub'));
  await assert.rejects(discoverSkills([skillsRoot]));
});

test('project-only skill cannot suppress the plugin entry for every other project',async t=>{
  const {root,canonical,skillsRoot}=await fixture(t), projectRoot=join(root,'project/.agents/skills');
  await mkdir(projectRoot,{recursive:true});
  await cp(canonical,join(projectRoot,'cohub'),{recursive:true});
  await assert.rejects(selectSkillMode({canonical,roots:[skillsRoot,projectRoot],globalRoots:[skillsRoot]}),/project|global/i);
  assert.equal(await readFile(join(projectRoot,'cohub/SKILL.md'),'utf8'),await readFile(join(canonical,'SKILL.md'),'utf8'));
});
