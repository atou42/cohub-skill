import {cp,mkdir,readFile,writeFile,lstat,realpath} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {skillSource,skillMetadata,skillDigest,fileTree} from './install-lib.mjs';

export async function packagePlugin({repositoryRoot,output,language='en',skillMode='bundled'}) {
  if(!['bundled','external'].includes(skillMode))throw new Error('Skill mode must be bundled or external.');
  const canonical=skillSource(repositoryRoot,language), metadata=await skillMetadata(canonical);
  await readFile(join(canonical,'references/plugin.md'));
  const digest=await skillDigest(canonical), plugin=join(repositoryRoot,'plugin');
  const manifest=JSON.parse(await readFile(join(plugin,'.codex-plugin/plugin.json'),'utf8'));
  if(manifest.name!=='cohub-cards'||manifest.skills!=='./skills/')throw new Error('Unexpected plugin identity or skill registration path.');
  const packageInfo=JSON.parse(await readFile(join(plugin,'package.json'),'utf8'));
  if(packageInfo.version!==manifest.version)throw new Error('Plugin package and manifest versions differ.');
  const sources=['src','dist','.mcp.json','package.json','package-lock.json'];
  for(const name of sources){
    const info=await lstat(join(plugin,name));
    if(info.isSymbolicLink())throw new Error(`Unexpected package source link: ${name}`);
    if(info.isDirectory())await fileTree(join(plugin,name));
  }
  // A package is immutable. Never copy on top of a previous release or user directory.
  await mkdir(dirname(output),{recursive:true});
  await mkdir(output);
  const release=join(output,'release'); await mkdir(release);
  for(const name of sources)await cp(join(plugin,name),join(release,name),{recursive:true,errorOnExist:true,force:false});
  await mkdir(join(release,'.codex-plugin'));
  await writeFile(join(release,'.codex-plugin/plugin.json'),JSON.stringify(manifest,null,2)+'\n');
  await mkdir(join(release,'skills'));
  const skillDir=skillMode==='bundled'?'skills/cohub':'bundled-skills/cohub';
  await cp(canonical,join(release,skillDir),{recursive:true,errorOnExist:true,force:false});
  await mkdir(join(output,'.agents/plugins'),{recursive:true});
  await writeFile(join(output,'.agents/plugins/marketplace.json'),JSON.stringify({
    name:'cohub-cards-local',interface:{displayName:'Cohub'},plugins:[{
      name:'cohub-cards',source:{source:'local',path:'./release'},
      policy:{installation:'AVAILABLE',authentication:'ON_INSTALL'},category:'Creativity',
    }],
  },null,2)+'\n');
  const info={schemaVersion:1,pluginVersion:manifest.version,skillVersion:metadata.version,language,skillMode,skillDigest:digest};
  await writeFile(join(output,'package-info.json'),JSON.stringify(info,null,2)+'\n');
  return {output,release,...info};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(await realpath(process.argv[1])).href){
  try{
    const options={repositoryRoot:fileURLToPath(new URL('../../',import.meta.url))};
    const keys={'--output':'output','--language':'language','--skill-mode':'skillMode'};
    for(let i=2;i<process.argv.length;i+=2){
      const key=keys[process.argv[i]],value=process.argv[i+1];
      if(!key||!value||value.startsWith('--'))throw new Error('Usage: package.mjs --output NEW_DIRECTORY [--language en|zh-CN] [--skill-mode bundled|external]');
      options[key]=value;
    }
    if(!options.output)throw new Error('--output must name a new package directory.');
    options.output=resolve(options.output);
    console.log(JSON.stringify(await packagePlugin(options)));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
