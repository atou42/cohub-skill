import {lstat, readdir, realpath, readFile} from 'node:fs/promises';
import {join, resolve, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';

const names = new Set(['cohub','cohub-cards','cohub-app-developer']);
async function optionalStat(path) {
  try { return await lstat(path); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
}
export function skillSource(root, language) {
  if (!['en','zh-CN'].includes(language)) throw new Error('Language must be en or zh-CN.');
  return join(root, language === 'en' ? 'skills/cohub' : 'zh-CN/skills/cohub');
}
export async function skillMetadata(path) {
  const value = JSON.parse(await readFile(join(path,'version.json'),'utf8'));
  if (value.schemaVersion !== 1 || value.name !== 'cohub' || !['en','zh-CN'].includes(value.language) || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value.version)) {
    throw new Error(`Invalid Cohub skill metadata: ${path}`);
  }
  const text = await readFile(join(path,'SKILL.md'),'utf8');
  if (!/^---\r?\n[\s\S]*?^name:\s*cohub\s*$/m.test(text)) throw new Error(`Invalid Cohub entry: ${path}`);
  return value;
}
export async function fileTree(path) {
  const files = new Map();
  async function walk(relative = '') {
    for (const entry of await readdir(join(path,relative),{withFileTypes:true})) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Unexpected link inside skill package: ${join(path,name)}`);
      if (entry.isDirectory()) await walk(name);
      else if (entry.isFile()) files.set(name,await readFile(join(path,name)));
      else throw new Error(`Unsupported package file: ${join(path,name)}`);
    }
  }
  await walk();
  return files;
}
export async function skillDigest(path) {
  const tree=await fileTree(path), hash=createHash('sha256');
  for (const name of [...tree.keys()].sort()) hash.update(name).update('\0').update(createHash('sha256').update(tree.get(name)).digest());
  return hash.digest('hex');
}
export async function discoverSkills(roots) {
  const seen=new Set(), found=[];
  async function walk(path) {
    const actual=await realpath(path);
    if(seen.has(actual))return;
    seen.add(actual);
    const entry=join(actual,'SKILL.md'), info=await optionalStat(entry);
    if(info){
      const text=await readFile(entry,'utf8');
      const name=text.match(/^---\r?\n[\s\S]*?^name:\s*([^\r\n]+)[\s\S]*?^---\s*$/m)?.[1]?.trim().replace(/^['"]|['"]$/g,'');
      if(names.has(name))found.push({path,realPath:actual,name});
      else if(names.has(path.split('/').at(-1)))throw new Error(`Malformed Cohub skill: ${path}`);
      return;
    }
    if(names.has(path.split('/').at(-1)))throw new Error(`Missing SKILL.md in ${path}`);
    for(const entry of await readdir(actual,{withFileTypes:true})){
      if(entry.name.startsWith('.'))continue;
      if(entry.isDirectory()||entry.isSymbolicLink())await walk(join(path,entry.name));
    }
  }
  for(const path of roots){if(await optionalStat(path))await walk(resolve(path));}
  return found;
}
export function userSkillRoots({home=homedir(),codexHome=process.env.CODEX_HOME || join(home,'.codex')}={}) {
  return [join(codexHome,'skills'),join(home,'.agents/skills')];
}
export function defaultSkillRoots({home=homedir(),codexHome=process.env.CODEX_HOME || join(home,'.codex'),cwd=process.cwd()}={}) {
  const roots=userSkillRoots({home,codexHome});
  for(let dir=resolve(cwd);;dir=dirname(dir)){
    roots.push(join(dir,'.agents/skills'),join(dir,'.codex/skills'));
    if(dirname(dir)===dir)break;
  }
  return [...new Set(roots)];
}
export async function assertSameSkill(canonical, installed) {
  const expected=await skillMetadata(canonical),actual=await skillMetadata(installed);
  if(expected.version!==actual.version || expected.language!==actual.language){
    throw new Error(`Existing Cohub is ${actual.version} (${actual.language}); this plugin includes ${expected.version} (${expected.language}). Update the independent skill first, preserving customizations: ${installed}`);
  }
  const source=await fileTree(canonical),target=await fileTree(installed);
  // The published skill permits deleting only its marked first-run block and init file.
  if(!target.has('references/init.md') && source.has('references/init.md')){
    source.delete('references/init.md');
    source.set('SKILL.md',Buffer.from(source.get('SKILL.md').toString('utf8').replace(/<!-- COHUB_INIT_START -->[\s\S]*?<!-- COHUB_INIT_END -->\r?\n?/g,'')));
    if(target.get('SKILL.md').includes('<!-- COHUB_INIT_START -->'))throw new Error(`Incomplete Init cleanup in ${installed}`);
  }
  const differences=[...new Set([...source.keys(),...target.keys()])].filter(name=>!source.has(name)||!target.has(name)||!source.get(name).equals(target.get(name))).sort();
  if(differences.length)throw new Error(`Existing skill has different or customized files; preserve and reconcile them before installing: ${installed}\n${differences.join('\n')}`);
}
export async function selectSkillMode({canonical,roots,globalRoots=roots,mode='auto',skillPath}) {
  if(!['auto','bundled','external'].includes(mode))throw new Error('Skill mode must be auto, bundled or external.');
  const discovered=await discoverSkills(roots);
  if(discovered.length>1)throw new Error(`Multiple Cohub entries found; resolve them before installation:\n${discovered.map(item=>item.path).join('\n')}`);
  if(skillPath && (!discovered.length || await realpath(skillPath)!==discovered[0].realPath))throw new Error('The specified skill path must be an existing entry in the inspected skill directories.');
  if(mode==='bundled'&&discovered.length)throw new Error(`Installing bundled would create a duplicate Cohub entry: ${discovered[0].path}`);
  if(!discovered.length){
    if(mode==='external')throw new Error('External mode requires an existing Cohub skill.');
    return {mode:'bundled',roots};
  }
  if(discovered[0].name!=='cohub')throw new Error(`Migrate the legacy ${discovered[0].name} entry before installing: ${discovered[0].path}`);
  const global=await discoverSkills(globalRoots);
  if(!global.some(item=>item.realPath===discovered[0].realPath))throw new Error(`A project-only Cohub skill cannot replace the plugin entry globally. Reconcile its scope before installation: ${discovered[0].path}`);
  await assertSameSkill(canonical,discovered[0].realPath);
  return {mode:'external',skillPath:discovered[0].path,realPath:discovered[0].realPath,roots};
}
