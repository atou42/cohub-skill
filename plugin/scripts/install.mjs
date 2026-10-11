import {access,readFile,readdir,realpath,stat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {join,resolve,delimiter,dirname,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {defaultSkillRoots,userSkillRoots,discoverSkills,skillSource,skillMetadata,skillDigest,selectSkillMode} from './install-lib.mjs';
import {packagePlugin} from './package.mjs';

export function parseArguments(args){
  const result={},seen=new Set();
  const fields={'--language':'language','--skill-mode':'mode','--skill-path':'skillPath'};
  for(let index=0;index<args.length;index++){
    const key=args[index];
    if(seen.has(key))throw new Error(`Repeated argument: ${key}`);
    seen.add(key);
    if(key==='--check'){result.check=true;continue;}
    if(!fields[key])throw new Error(`Unknown argument: ${key}`);
    const value=args[++index];
    if(!value||value.startsWith('--'))throw new Error(`Missing value for ${key}`);
    result[fields[key]]=value;
  }
  validateOptions(result);
  return result;
}
function validateOptions({language,mode,skillPath,check}){
  if(language!==undefined&&!['en','zh-CN'].includes(language))throw new Error('Language must be en or zh-CN.');
  if(mode!==undefined&&!['auto','bundled','external'].includes(mode))throw new Error('Skill mode must be auto, bundled or external.');
  if(skillPath!==undefined&&(typeof skillPath!=='string'||!skillPath.trim()))throw new Error('Skill path must be a nonempty path.');
  if(check!==undefined&&typeof check!=='boolean')throw new Error('Check must be a boolean.');
}
async function executable(command,env){
  for(const folder of (env.PATH??'').split(delimiter).filter(Boolean)){
    const candidate=resolve(folder,command);
    try{
      await access(candidate,constants.X_OK);
      if((await stat(candidate)).isFile())return candidate;
    }catch(error){if(!['ENOENT','ENOTDIR','EACCES'].includes(error.code))throw error;}
  }
  throw new Error(`Missing ${command}. Install the prerequisites before running the installer.`);
}
export async function runCommand(command,args,{cwd,env=process.env,capture=false}={}){
  return await new Promise((resolvePromise,reject)=>{
    let stdout='';
    const child=spawn(command,args,{cwd,env,stdio:capture?['ignore','pipe','inherit']:'inherit',shell:false});
    if(capture)child.stdout.on('data',chunk=>{stdout+=chunk.toString('utf8');});
    child.once('error',reject);
    child.once('close',(code,signal)=>{
      if(code===0)return resolvePromise(capture?stdout:undefined);
      const error=new Error(`${command} ${args.join(' ')} failed${signal?` (signal ${signal})`:` (exit ${code})`}.`);
      error.exitCode=code??1;error.signal=signal;reject(error);
    });
  });
}
const identity='cohub-cards@cohub-cards-local',marketplace='cohub-cards-local';
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
// Explicit public-release provenance and exact file digests; never infer a language from an unknown version.
const legacyReleases=JSON.parse(await readFile(new URL('./legacy-releases.json',import.meta.url),'utf8'));
if(legacyReleases.schemaVersion!==1||!legacyReleases.releases||typeof legacyReleases.releases!=='object')throw new Error('Invalid legacy Cohub release catalog.');
async function installedLanguage(entry){
  if(!entry)return undefined;
  let text;
  try{text=await readFile(join(dirname(entry.source.path),'package-info.json'),'utf8');}
  catch(error){
    if(error.code==='ENOENT'){
      const legacy=Object.hasOwn(legacyReleases.releases,entry.version)?legacyReleases.releases[entry.version]:undefined;
      if(legacy){
        if(!/^[a-f0-9]{40}$/.test(legacy.commit??'')||!['en','zh-CN'].includes(legacy.language)||!['manifestSha256','skillSha256'].every(key=>/^[a-f0-9]{64}$/.test(legacy[key]??'')))throw new Error('Invalid legacy Cohub release metadata.');
        const manifest=await readFile(join(entry.source.path,'.codex-plugin/plugin.json'));
        const skill=await readFile(join(entry.source.path,'skills/cohub-cards/SKILL.md'));
        if(sha256(manifest)===legacy.manifestSha256&&sha256(skill)===legacy.skillSha256)return legacy.language;
        throw new Error(`Existing Cohub ${entry.version} files differ from the published release. Preserve and reconcile customized or damaged files before upgrading.`);
      }
      throw new Error('The existing Cohub plugin has no reliable language metadata. Resolve the installation metadata before choosing --language.');
    }
    throw error;
  }
  const metadata=JSON.parse(text);
  if(metadata.schemaVersion!==1||metadata.pluginVersion!==entry.version||!['en','zh-CN'].includes(metadata.language)||!['bundled','external'].includes(metadata.skillMode))throw new Error('Invalid installed Cohub package metadata; do not replace it before resolving the inconsistency.');
  if(typeof metadata.skillVersion!=='string'||!/^[a-f0-9]{64}$/.test(metadata.skillDigest??''))throw new Error('Invalid installed Cohub skill version or digest metadata.');
  const manifest=JSON.parse(await readFile(join(entry.source.path,'.codex-plugin/plugin.json'),'utf8'));
  if(manifest.skills!=='./skills/'||manifest.mcpServers!=='./.mcp.json')throw new Error('Installed Cohub registration paths were modified; reconcile the customized package before upgrading.');
  const registered=(await readdir(join(entry.source.path,'skills'))).sort();
  const expected=metadata.skillMode==='bundled'?['cohub']:[];
  if(JSON.stringify(registered)!==JSON.stringify(expected))throw new Error('Installed Cohub skill mode and registration directory differ; reconcile the modified package before upgrading.');
  const skill=join(entry.source.path,metadata.skillMode==='bundled'?'skills/cohub':'bundled-skills/cohub');
  const actual=await skillMetadata(skill);
  if(actual.version!==metadata.skillVersion||actual.language!==metadata.language)throw new Error('Installed Cohub skill metadata differs from its package; preserve and reconcile the modified files before upgrading.');
  if(await skillDigest(skill)!==metadata.skillDigest)throw new Error('Installed Cohub skill digest differs; preserve and reconcile modified or customized files before upgrading.');
  return metadata.language;
}
async function marketplaceRecords(run,settings){
  const response=JSON.parse(await run('codex',['plugin','marketplace','list','--json'],{...settings,capture:true}));
  if(!response||!Array.isArray(response.marketplaces)||response.marketplaces.some(item=>!item||typeof item.name!=='string'))throw new Error('Invalid Codex marketplace listing.');
  const matching=response.marketplaces.filter(item=>item.name===marketplace);
  if(matching.length>1)throw new Error('Multiple Cohub marketplace records; resolve the conflicting state.');
  return matching[0];
}
async function inspectMarketplace(run,settings){
  const record=await marketplaceRecords(run,settings);
  if(!record)return undefined;
  const source=record.marketplaceSource;
  if(source?.sourceType!=='local'||typeof source.source!=='string'||!isAbsolute(source.source))throw new Error('The Cohub marketplace is not a recognized local source; it will not be replaced.');
  const response=JSON.parse(await run('codex',['plugin','list','--marketplace',marketplace,'--available','--json'],{...settings,capture:true}));
  if(!response||!Array.isArray(response.installed)||!Array.isArray(response.available))throw new Error('Invalid Codex plugin listing.');
  if([...response.installed,...response.available].some(item=>!item||item.pluginId!==identity))throw new Error('The Cohub marketplace is not dedicated exclusively to Cohub; it will not be replaced.');
  if(response.installed.length>1)throw new Error('Multiple installed Cohub plugin records.');
  const catalog=JSON.parse(await readFile(join(source.source,'.agents/plugins/marketplace.json'),'utf8'));
  if(catalog.name!==marketplace||!Array.isArray(catalog.plugins)||catalog.plugins.length!==1||catalog.plugins[0].name!=='cohub-cards')throw new Error('The local marketplace is not exclusively dedicated to Cohub.');
  const entry=response.installed[0];
  if(entry){
    if(entry.installed!==true||typeof entry.version!=='string'||typeof entry.enabled!=='boolean')throw new Error('Invalid installed Cohub plugin state.');
    if(!entry.enabled)throw new Error('The existing Cohub plugin is disabled. Enable it explicitly before upgrading; its disabled state has been preserved.');
    if(entry.source?.source!=='local'||typeof entry.source.path!=='string'||!isAbsolute(entry.source.path))throw new Error('Invalid installed Cohub local source.');
    const manifest=await readFile(join(entry.source.path,'.codex-plugin/plugin.json'));
    const parsed=JSON.parse(manifest);
    if(parsed.name!=='cohub-cards'||parsed.version!==entry.version)throw new Error('Installed Cohub source version does not match its registration.');
    return {source:source.source,entry,language:await installedLanguage(entry),manifestDigest:sha256(manifest)};
  }
  return {source:source.source};
}
async function registerPackage(run,settings,packaged,previous,log){
  if(!previous){
    await run('codex',['plugin','marketplace','add',packaged.output],settings);
    await run('codex',['plugin','add',identity],settings);
    return;
  }
  // Only the verified dedicated marketplace registration changes. Never remove plugin caches or user files.
  await run('codex',['plugin','marketplace','remove',marketplace],settings);
  let newAdded=false;
  try{
    await run('codex',['plugin','marketplace','add',packaged.output],settings);newAdded=true;
    await run('codex',['plugin','add',identity],settings);
  }catch(original){
    try{
      if(newAdded)await run('codex',['plugin','marketplace','remove',marketplace],settings);
      else{
        const current=await marketplaceRecords(run,settings);
        if(current){
          if(current.marketplaceSource?.source!==packaged.output)throw new Error('Marketplace changed unexpectedly during recovery; it was not removed.');
          await run('codex',['plugin','marketplace','remove',marketplace],settings);
        }
      }
      if(previous.entry&&sha256(await readFile(join(previous.entry.source.path,'.codex-plugin/plugin.json')))!==previous.manifestDigest)throw new Error('The previous plugin source changed; automatic restoration cannot safely continue.');
      if(previous.entry&&await installedLanguage(previous.entry)!==previous.language)throw new Error('The previous plugin language changed; automatic restoration cannot safely continue.');
      await run('codex',['plugin','marketplace','add',previous.source],settings);
      if(previous.entry)await run('codex',['plugin','add',identity],settings);
      const restored=await inspectMarketplace(run,settings);
      if(restored?.source!==previous.source||restored?.entry?.version!==previous.entry?.version||restored?.entry?.enabled!==previous.entry?.enabled)throw new Error('Restored Cohub state does not match the previous installation.');
      log('Upgrade failed; the previous Cohub marketplace and plugin state were restored.');
    }catch(recovery){
      const failure=new AggregateError([original,recovery],`${original.message}\nRestoring the previous Cohub installation also failed: ${recovery.message}`,{cause:original});
      failure.exitCode=original.exitCode??1;throw failure;
    }
    throw original;
  }
}
async function validateRepository(repositoryRoot,canonical){
  await skillMetadata(canonical);
  await readFile(join(canonical,'references/plugin.md'));
  const plugin=join(repositoryRoot,'plugin');
  const manifest=JSON.parse(await readFile(join(plugin,'.codex-plugin/plugin.json'),'utf8'));
  const metadata=JSON.parse(await readFile(join(plugin,'package.json'),'utf8'));
  if(manifest.name!=='cohub-cards'||manifest.skills!=='./skills/'||manifest.mcpServers!=='./.mcp.json')throw new Error('Unexpected plugin identity or component paths.');
  if(!metadata.version||metadata.version!==manifest.version)throw new Error('Plugin package and manifest versions differ.');
  if(metadata.scripts?.build!=='node scripts/build.mjs')throw new Error('Unexpected plugin build command.');
  JSON.parse(await readFile(join(plugin,'package-lock.json'),'utf8'));
  const mcp=JSON.parse(await readFile(join(plugin,'.mcp.json'),'utf8'));
  if(!mcp.mcpServers?.cohub_cards)throw new Error('Missing Cohub plugin server configuration.');
  await readFile(join(plugin,'scripts/build.mjs'));
  await readFile(join(plugin,'src/server.mjs'));
}

export async function install(options={},run=runCommand){
  validateOptions(options);
  const {repositoryRoot:providedRoot,language:requestedLanguage,mode='auto',skillPath,check=false,
    env=process.env,nodeVersion=process.versions.node,log=console.log}=options;
  if(!/^\d+\./.test(nodeVersion)||Number(nodeVersion.split('.')[0])<24)throw new Error('Node.js 24+ is required.');
  const repositoryRoot=resolve(providedRoot??fileURLToPath(new URL('../../',import.meta.url)));
  const roots=options.roots??defaultSkillRoots({home:options.home,codexHome:options.codexHome??env.CODEX_HOME,cwd:options.cwd});
  log(`Inspected skill directories:\n${roots.map(root=>`  ${root}`).join('\n')}`);
  const existing=await discoverSkills(roots);
  if(existing.length>1)throw new Error(`Multiple Cohub entries found; resolve them before installation:\n${existing.map(item=>item.path).join('\n')}`);
  if(existing.length===1&&existing[0].name!=='cohub')throw new Error(`Migrate the legacy ${existing[0].name} entry before installing: ${existing[0].path}`);
  // Validate discovered metadata even when the caller explicitly selected a language.
  let existingLanguage;
  if(existing.length===1&&existing[0].name==='cohub')existingLanguage=(await skillMetadata(existing[0].realPath)).language;
  for(const tool of ['node','npm','git','codex','cohub'])await executable(tool,env);
  const registrationSettings={cwd:repositoryRoot,env};
  const previous=await inspectMarketplace(run,registrationSettings);
  const previousLanguage=previous?.language;
  const language=requestedLanguage??existingLanguage??previousLanguage??'en';
  const canonical=skillSource(repositoryRoot,language);
  const globalRoots=options.globalRoots??(options.roots?options.roots:userSkillRoots({home:options.home,codexHome:options.codexHome??env.CODEX_HOME}));
  const selection=await selectSkillMode({canonical,roots,globalRoots,mode,skillPath});
  await validateRepository(repositoryRoot,canonical);
  log(`Cohub skill language: ${language}${!requestedLanguage&&!existingLanguage&&!previousLanguage?' (default; no previous installation detected)':''}. Skill mode: ${selection.mode}.`);
  if(selection.skillPath)log(`Using the existing Cohub entry: ${selection.skillPath}`);
  const preflight={...selection,language,repositoryRoot,check};
  if(check){log('Preflight passed. No dependency downloads, registration or settings changes were performed.');return preflight;}
  const plugin=join(repositoryRoot,'plugin'),settings={cwd:plugin,env};
  await run('npm',['ci','--ignore-scripts'],settings);
  await run('npm',['run','build'],settings);
  // Every attempt gets a fresh package; failed packages are retained for diagnosis.
  const output=join(plugin,'.packages',`cohub-${Date.now()}-${randomUUID()}`);
  log(`Preparing package: ${output}`);
  const packaged=await packagePlugin({repositoryRoot,output,language,skillMode:selection.mode});
  await run('npm',['ci','--omit=dev','--ignore-scripts'],{cwd:packaged.release,env});
  const current=await inspectMarketplace(run,registrationSettings);
  if(JSON.stringify(current)!==JSON.stringify(previous))throw new Error('The existing Cohub installation changed while preparing the package; registration was not modified.');
  await registerPackage(run,registrationSettings,packaged,previous,log);
  log('Cohub installed. Restart Codex to load the updated tools and skill.');
  return {...preflight,...packaged};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(await realpath(process.argv[1])).href){
  try{await install(parseArguments(process.argv.slice(2)));}
  catch(error){console.error(error.message);process.exitCode=Number.isInteger(error.exitCode)&&error.exitCode>0&&error.exitCode<256?error.exitCode:1;}
}
