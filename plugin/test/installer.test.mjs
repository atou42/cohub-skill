import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,cp,chmod,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {install as actualInstall,parseArguments,runCommand} from '../scripts/install.mjs';
import {skillDigest} from '../scripts/install-lib.mjs';
const legacyReleases=JSON.parse(await readFile(new URL('./fixtures/legacy-releases.json',import.meta.url),'utf8'));
const install=(options,run)=>actualInstall(options,async(command,args,settings)=>{
  if(settings.capture&&args[1]==='marketplace'&&args[2]==='list')return JSON.stringify(options.marketplaceResponse??{marketplaces:[]});
  return run(command,args,settings);
});

async function fixture(t){
  const root=await mkdtemp(join(tmpdir(),'cohub-installer-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const repo=join(root,'repo'),bin=join(root,'bin'),roots=[join(root,'skills')];
  await mkdir(bin,{recursive:true});await mkdir(roots[0]);
  for(const tool of ['node','npm','git','codex','cohub']){await writeFile(join(bin,tool),'#!/bin/sh\nexit 0\n');await chmod(join(bin,tool),0o755);}
  for(const language of ['en','zh-CN']){
    const path=join(repo,language==='en'?'skills/cohub':'zh-CN/skills/cohub');
    await mkdir(join(path,'references'),{recursive:true});
    await writeFile(join(path,'SKILL.md'),'---\nname: cohub\ndescription: Cohub\n---\nUse Cohub.\n');
    await writeFile(join(path,'version.json'),JSON.stringify({schemaVersion:1,name:'cohub',language,version:'2.3.0'}));
    await writeFile(join(path,'references/plugin.md'),'Cohub plugin guidance.\n');
  }
  const plugin=join(repo,'plugin');
  for(const path of ['src','dist','scripts','.codex-plugin'])await mkdir(join(plugin,path),{recursive:true});
  await writeFile(join(plugin,'src/server.mjs'),'// server');await writeFile(join(plugin,'dist/index.html'),'<html/>');
  await writeFile(join(plugin,'scripts/build.mjs'),'// build');
  await writeFile(join(plugin,'package.json'),JSON.stringify({name:'cohub-inline-plugin',version:'0.6.0',scripts:{build:'node scripts/build.mjs'}}));
  await writeFile(join(plugin,'package-lock.json'),'{}');
  await writeFile(join(plugin,'.mcp.json'),JSON.stringify({mcpServers:{cohub_cards:{command:'node',args:['src/server.mjs']}}}));
  await writeFile(join(plugin,'.codex-plugin/plugin.json'),JSON.stringify({name:'cohub-cards',version:'0.6.0',skills:'./skills/',mcpServers:'./.mcp.json'}));
  return {root,repo,roots,env:{...process.env,PATH:bin},plugin};
}
const options=f=>({repositoryRoot:f.repo,roots:f.roots,env:f.env,language:'en',log:()=>{}});

test('arguments retain values and reject unknown, repeated, missing and invalid values',()=>{
  assert.deepEqual(parseArguments(['--language','zh-CN','--skill-mode','external','--skill-path','/x with spaces','--check']),{language:'zh-CN',mode:'external',skillPath:'/x with spaces',check:true});
  for(const args of [['--typo'],['--language'],['--language','en','--language','en'],['--check','--check'],['--language','fr'],['--skill-mode','unknown'],['--check','value']])assert.throws(()=>parseArguments(args));
});
test('check reads and reports scope but performs no installation commands or package writes',async t=>{
  const f=await fixture(t),calls=[],messages=[];
  const result=await install({...options(f),check:true,log:x=>messages.push(x)},async(...args)=>calls.push(args));
  assert.equal(result.mode,'bundled');assert.equal(result.language,'en');assert.deepEqual(calls,[]);
  assert(!((await readdir(f.plugin)).includes('.packages')));
  assert(messages.join('\n').includes(f.roots[0]));assert(messages.join('\n').includes('bundled'));
});
test('preflight rejects customized existing skill without commands or package writes',async t=>{
  const f=await fixture(t),target=join(f.roots[0],'cohub'),calls=[];
  await cp(join(f.repo,'skills/cohub'),target,{recursive:true});await writeFile(join(target,'custom.md'),'Keep me.');
  await assert.rejects(install(options(f),async(...args)=>calls.push(args)),/customized/);
  assert.deepEqual(calls,[]);assert.equal(await readFile(join(target,'custom.md'),'utf8'),'Keep me.');
  assert(!((await readdir(f.plugin)).includes('.packages')));
});
test('existing standalone language is preserved and registered only externally',async t=>{
  const f=await fixture(t);await cp(join(f.repo,'zh-CN/skills/cohub'),join(f.roots[0],'cohub'),{recursive:true});
  const result=await install({...options(f),language:undefined,check:true},()=>assert.fail('standalone language avoids commands'));
  assert.equal(result.language,'zh-CN');assert.equal(result.mode,'external');
});
test('bad metadata and missing prerequisites stop before any external commands',async t=>{
  const f=await fixture(t),calls=[];await cp(join(f.repo,'skills/cohub'),join(f.roots[0],'cohub'),{recursive:true});
  await writeFile(join(f.roots[0],'cohub/version.json'),'{broken');
  await assert.rejects(install(options(f),async(...args)=>calls.push(args)));
  await rm(join(f.roots[0],'cohub'),{recursive:true});await rm(join(f.env.PATH,'git'));
  await assert.rejects(install(options(f),async(...args)=>calls.push(args)),/git/);assert.deepEqual(calls,[]);
});
test('old Node and invalid install options fail before commands',async t=>{
  const f=await fixture(t),run=()=>assert.fail('must not execute');
  await assert.rejects(install({...options(f),nodeVersion:'22.1.0'},run),/Node.js 24/);
  await assert.rejects(install({...options(f),language:'bad'},run),/Language/);
  await assert.rejects(install({...options(f),mode:'typo'},run),/mode/);
});
test('npm failure preserves error and never registers a marketplace',async t=>{
  const f=await fixture(t),calls=[],failure=Object.assign(new Error('npm failed'),{exitCode:37});
  await assert.rejects(install(options(f),async(command,args,config)=>{calls.push({command,args,config});throw failure;}),error=>error===failure);
  assert.equal(calls.length,1);assert.equal(calls[0].command,'npm');assert.deepEqual(calls[0].args,['ci','--ignore-scripts']);
  assert(!((await readdir(f.plugin)).includes('.packages')));
});
test('successful install uses new package and registers only after runtime dependencies',async t=>{
  const f=await fixture(t),calls=[],messages=[];
  const result=await install({...options(f),log:x=>messages.push(x)},async(command,args,config)=>calls.push({command,args,config}));
  assert.deepEqual(calls.map(({command,args})=>[command,...args]),[
    ['npm','ci','--ignore-scripts'],['npm','run','build'],['npm','ci','--omit=dev','--ignore-scripts'],
    ['codex','plugin','marketplace','add',result.output],['codex','plugin','add','cohub-cards@cohub-cards-local'],
  ]);
  assert.equal(calls[0].config.cwd,f.plugin);assert.equal(calls[2].config.cwd,result.release);
  assert.deepEqual(await readdir(join(result.release,'skills')),['cohub']);
  assert(messages.at(-1).includes('Restart'));
});
test('codex failure is not swallowed or followed by success; failed package is retained',async t=>{
  const f=await fixture(t),calls=[],messages=[],failure=Object.assign(new Error('marketplace conflict'),{exitCode:19});
  await assert.rejects(install({...options(f),log:x=>messages.push(x)},async(command,args)=>{calls.push([command,...args]);if(command==='codex')throw failure;}),error=>error===failure);
  assert.equal(calls.length,4);assert.equal((await readdir(join(f.plugin,'.packages'))).length,1);
  assert(!messages.some(x=>x.includes('Restart')));
});
test('runtime dependency failure retains the package and makes no registration calls',async t=>{
  const f=await fixture(t),calls=[],failure=Object.assign(new Error('runtime dependency failed'),{exitCode:43});
  await assert.rejects(install(options(f),async(command,args)=>{calls.push([command,...args]);if(args.includes('--omit=dev'))throw failure;}),error=>error===failure);
  assert.equal(calls.length,3);assert(calls.every(call=>call[0]==='npm'));
  assert.equal((await readdir(join(f.plugin,'.packages'))).length,1);
});
test('plugin add failure is returned without a success message or marketplace removal',async t=>{
  const f=await fixture(t),calls=[],messages=[],failure=Object.assign(new Error('plugin failed'),{exitCode:23});
  await assert.rejects(install({...options(f),log:x=>messages.push(x)},async(command,args)=>{calls.push([command,...args]);if(command==='codex'&&args[1]==='add')throw failure;}),error=>error===failure);
  assert.equal(calls.length,5);assert(!calls.flat().includes('remove'));assert(!messages.some(x=>x.includes('Restart')));
});
test('command runner captures read output and preserves nonzero process exit code',async()=>{
  const argument='literal spaces; $(not-executed)';
  assert.equal(await runCommand(process.execPath,['-e','process.stdout.write(process.argv[1])',argument],{capture:true}),argument);
  await assert.rejects(runCommand(process.execPath,['-e','process.exit(29)'],{capture:true}),error=>error.exitCode===29);
});

 test('no standalone language reads only the selected marketplace and preserves installed language',async t=>{
  const f=await fixture(t),old=await oldInstallation(f);
  const calls=[];
  const result=await install({...options(f),...old,language:undefined,check:true},async(command,args,settings)=>{
    calls.push([command,...args]);assert.equal(settings.capture,true);
    return JSON.stringify(old.listing);
  });
  assert.equal(result.language,'zh-CN');assert.deepEqual(calls,[['codex','plugin','list','--marketplace','cohub-cards-local','--available','--json']]);
  assert(!((await readdir(f.plugin)).includes('.packages')));
 });
 test('empty installed list defaults to en; invalid state never does',async t=>{
  const f=await fixture(t),old=await oldInstallation(f);
  const result=await install({...options(f),...old,language:undefined,check:true},async()=>JSON.stringify({installed:[],available:[]}));
  assert.equal(result.language,'en');
  for(const text of ['broken','{}',JSON.stringify({installed:[{pluginId:'cohub-cards@cohub-cards-local'},{pluginId:'cohub-cards@cohub-cards-local'}]})]){
    await assert.rejects(install({...options(f),...old,language:undefined,check:true},async()=>text));
  }
 });
 test('unknown package without reliable language metadata blocks even explicit selection',async t=>{
  const f=await fixture(t),old=await oldInstallation(f);
  await rm(join(old.output,'package-info.json'));
  await assert.rejects(install({...options(f),...old,check:true},async()=>JSON.stringify(old.listing)),/metadata/);
 });

async function oldInstallation(f){
  const output=join(f.root,'old-package'),release=join(output,'release');
  await mkdir(join(release,'.codex-plugin'),{recursive:true});
  await writeFile(join(release,'.codex-plugin/plugin.json'),JSON.stringify({name:'cohub-cards',version:'0.6.0',skills:'./skills/',mcpServers:'./.mcp.json'}));
  await mkdir(join(output,'.agents/plugins'),{recursive:true});
  await writeFile(join(output,'.agents/plugins/marketplace.json'),JSON.stringify({name:'cohub-cards-local',plugins:[{name:'cohub-cards',source:{source:'local',path:'./release'}}]}));
  await cp(join(f.repo,'zh-CN/skills/cohub'),join(release,'skills/cohub'),{recursive:true});
  await writeFile(join(output,'package-info.json'),JSON.stringify({schemaVersion:1,pluginVersion:'0.6.0',skillVersion:'2.3.0',skillDigest:await skillDigest(join(release,'skills/cohub')),language:'zh-CN',skillMode:'bundled'}));
  return {output,release,marketplaceResponse:{marketplaces:[{name:'cohub-cards-local',root:output,marketplaceSource:{sourceType:'local',source:output}}]},listing:{installed:[{pluginId:'cohub-cards@cohub-cards-local',version:'0.6.0',installed:true,enabled:true,source:{source:'local',path:release}}],available:[]}};
}
test('upgrade replaces only the dedicated marketplace after all dependencies are ready',async t=>{
  const f=await fixture(t),old=await oldInstallation(f),mutations=[];
  const result=await install({...options(f),...old},async(command,args,{capture})=>{
    if(capture)return JSON.stringify(old.listing);
    mutations.push([command,...args]);
  });
  assert.deepEqual(mutations.slice(3),[
    ['codex','plugin','marketplace','remove','cohub-cards-local'],
    ['codex','plugin','marketplace','add',result.output],
    ['codex','plugin','add','cohub-cards@cohub-cards-local'],
  ]);
});
test('failed upgrade restores old marketplace and plugin and returns original error',async t=>{
  const f=await fixture(t),old=await oldInstallation(f),mutations=[],failure=Object.assign(new Error('new plugin rejected'),{exitCode:31});
  let additions=0;
  await assert.rejects(install({...options(f),...old},async(command,args,{capture})=>{
    if(capture)return JSON.stringify(old.listing);
    mutations.push([command,...args]);
    if(command==='codex'&&args[1]==='add'&&++additions===1)throw failure;
  }),error=>error===failure);
  assert.deepEqual(mutations.slice(-3),[
    ['codex','plugin','marketplace','remove','cohub-cards-local'],
    ['codex','plugin','marketplace','add',old.output],
    ['codex','plugin','add','cohub-cards@cohub-cards-local'],
  ]);
});
test('disabled plugin and shared marketplace cannot be changed even with explicit language',async t=>{
  const f=await fixture(t),old=await oldInstallation(f),mutations=[];
  old.listing.installed[0].enabled=false;
  await assert.rejects(install({...options(f),...old},async(command,args,{capture})=>{if(capture)return JSON.stringify(old.listing);mutations.push([command,...args]);}),/disabled/);
  assert.deepEqual(mutations,[]);
  old.listing.installed[0].enabled=true;old.listing.available.push({pluginId:'another@cohub-cards-local'});
  await assert.rejects(install({...options(f),...old},async(command,args,{capture})=>{if(capture)return JSON.stringify(old.listing);mutations.push([command,...args]);}),/exclusive|dedicated|another/);
  assert.deepEqual(mutations,[]);
});
test('modified bundled skill blocks upgrades even with an explicit language and preserves the file',async t=>{
  const f=await fixture(t),old=await oldInstallation(f),mutations=[];
  const skill=join(old.release,'skills/cohub/SKILL.md'),original=await readFile(skill,'utf8');
  const run=async(command,args,{capture})=>{if(capture)return JSON.stringify(old.listing);mutations.push([command,...args]);};
  await install({...options(f),...old,check:true},run);
  await writeFile(skill,original+'X');
  await assert.rejects(install({...options(f),...old,check:true},run),/digest|modified|customized/);
  assert.equal(await readFile(skill,'utf8'),original+'X');assert.deepEqual(mutations,[]);
});
test('external packages verify their unregistered skill and require an empty registration directory',async t=>{
  const f=await fixture(t),old=await oldInstallation(f),mutations=[];
  await cp(join(old.release,'skills/cohub'),join(old.release,'bundled-skills/cohub'),{recursive:true});
  await rm(join(old.release,'skills/cohub'),{recursive:true});
  const infoPath=join(old.output,'package-info.json'),metadata=JSON.parse(await readFile(infoPath,'utf8'));
  metadata.skillMode='external';await writeFile(infoPath,JSON.stringify(metadata));
  const run=async(command,args,{capture})=>{if(capture)return JSON.stringify(old.listing);mutations.push([command,...args]);};
  await install({...options(f),...old,check:true},run);
  await mkdir(join(old.release,'skills/unexpected'));
  await assert.rejects(install({...options(f),...old,check:true},run),/registration directory/);
  await rm(join(old.release,'skills/unexpected'),{recursive:true});
  const skill=join(old.release,'bundled-skills/cohub/SKILL.md');
  const changed=(await readFile(skill,'utf8'))+'X';await writeFile(skill,changed);
  await assert.rejects(install({...options(f),...old,check:true},run),/digest/);
  assert.equal(await readFile(skill,'utf8'),changed);assert.deepEqual(mutations,[]);
});
test('package-declared skill version and language must agree with actual skill metadata',async t=>{
  const f=await fixture(t),old=await oldInstallation(f),infoPath=join(old.output,'package-info.json');
  const metadata=JSON.parse(await readFile(infoPath,'utf8'));
  const run=async(_command,_args,{capture})=>{assert(capture);return JSON.stringify(old.listing);};
  for(const change of [{skillVersion:'2.4.0'},{language:'en'},{skillDigest:'invalid'}]){
    await writeFile(infoPath,JSON.stringify({...metadata,...change}));
    await assert.rejects(install({...options(f),...old,check:true},run),/metadata/);
  }
});

// Exact public 0.5.0 fixture from aa16dc3a9d365f8ffb0c2e8c4be72133fbc9bf44.
test('published 0.5.0 keeps Chinese language without new metadata; tampering always blocks',async t=>{
  const f=await fixture(t),old=await oldInstallation(f);
  await rm(join(old.output,'package-info.json'));
  await mkdir(join(old.release,'skills/cohub-cards'),{recursive:true});
  await writeFile(join(old.release,'skills/cohub-cards/SKILL.md'),legacyReleases['0.5.0'].skill);
  await writeFile(join(old.release,'.codex-plugin/plugin.json'),legacyReleases['0.5.0'].manifest);
  old.listing.installed[0].version='0.5.0';
  const run=async(_command,_args,{capture})=>{assert(capture);return JSON.stringify(old.listing);};
  const result=await install({...options(f),...old,language:undefined,check:true},run);
  assert.equal(result.language,'zh-CN');
  await writeFile(join(old.release,'skills/cohub-cards/SKILL.md'),legacyReleases['0.5.0'].skill+'\ncustomized');
  await assert.rejects(install({...options(f),...old,check:true},run),/differ from the published/);
  assert((await readFile(join(old.release,'skills/cohub-cards/SKILL.md'),'utf8')).endsWith('customized'));
});
test('recovery failure exposes both errors and the original exit code',async t=>{
  const f=await fixture(t),old=await oldInstallation(f),original=Object.assign(new Error('new plugin rejected'),{exitCode:31});
  await assert.rejects(install({...options(f),...old},async(command,args,{capture})=>{
    if(capture)return JSON.stringify(old.listing);
    if(command==='codex'&&args[1]==='add')throw original;
    if(command==='codex'&&args[1]==='marketplace'&&args[2]==='add'&&args[3]===old.output)throw new Error('old source unavailable');
  }),error=>error instanceof AggregateError&&error.errors[0]===original&&error.message.includes('old source unavailable')&&error.exitCode===31);
});
for(const [version,legacy] of Object.entries(legacyReleases)){
  test(`published ${version} preserves its language; changed release files block upgrades`,async t=>{
    const f=await fixture(t),old=await oldInstallation(f);
    await rm(join(old.output,'package-info.json'));
    await mkdir(join(old.release,'skills/cohub-cards'),{recursive:true});
    const manifestPath=join(old.release,'.codex-plugin/plugin.json'),skillPath=join(old.release,'skills/cohub-cards/SKILL.md');
    await writeFile(manifestPath,legacy.manifest);await writeFile(skillPath,legacy.skill);
    old.listing.installed[0].version=version;
    const mutations=[];
    const run=async(command,args,{capture})=>{if(capture)return JSON.stringify(old.listing);mutations.push([command,...args]);};
    const result=await install({...options(f),...old,language:undefined},run);
    assert.equal(result.language,'zh-CN');
    const packagedMetadata=JSON.parse(await readFile(join(result.release,'skills/cohub/version.json'),'utf8'));
    assert.equal(packagedMetadata.language,'zh-CN');
    assert.deepEqual(mutations.slice(-3),[
      ['codex','plugin','marketplace','remove','cohub-cards-local'],
      ['codex','plugin','marketplace','add',result.output],
      ['codex','plugin','add','cohub-cards@cohub-cards-local'],
    ]);
    mutations.length=0;
    await writeFile(skillPath,legacy.skill+'\ncustomization');
    await assert.rejects(install({...options(f),...old,check:true},run),/differ from the published/);
    await writeFile(skillPath,legacy.skill);await writeFile(manifestPath,legacy.manifest+'\n');
    await assert.rejects(install({...options(f),...old,check:true},run),/differ from the published/);
    assert.deepEqual(mutations,[]);
  });
}
