import {cp,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('release/',root);
await mkdir(out,{recursive:true});
for(const path of ['src','dist','skills','.codex-plugin','.mcp.json','package.json','package-lock.json'])await cp(new URL(path,root),new URL(path,out),{recursive:true});
console.log('Copied only runtime source, UI, skill and dependency manifest. Run npm ci --omit=dev --ignore-scripts in release/.');
