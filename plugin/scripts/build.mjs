import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {build} from 'esbuild';
const root=new URL('../',import.meta.url);
await mkdir(new URL('dist/',root),{recursive:true});
const result=await build({entryPoints:[new URL('web/app.js',root).pathname],bundle:true,write:false,format:'esm',target:'es2022',minify:true});
const html=await readFile(new URL('web/card.html',root),'utf8');
// Geist and Geist Mono (OFL-1.1, Vercel) are embedded as Latin subsets so the card does not fetch fonts.
const fonts=[
  ['Geist','node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2'],
  ['Geist Mono','node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2'],
];
const faces=(await Promise.all(fonts.map(async([family,path])=>{
  const data=(await readFile(new URL(path,root))).toString('base64');
  return `@font-face{font-family:"${family}";font-style:normal;font-display:swap;font-weight:100 900;src:url(data:font/woff2;base64,${data}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}`;
}))).join('');
const tokens=await readFile(new URL('web/tokens.css',root),'utf8');
if(!tokens.includes('/*COHUB_FONTS*/'))throw new Error('Font marker missing in tokens.css');
const css=[tokens.replace('/*COHUB_FONTS*/',()=>faces),...await Promise.all(['web/card.css','web/composer.css'].map(path=>readFile(new URL(path,root),'utf8')))].join('\n');
if(!html.includes('<!--CARD_STYLE-->') || !html.includes('<!--CARD_SCRIPT-->'))throw new Error('Card build markers missing');
// Callback replacements preserve literal $& and $` strings inside the bundled SDK.
const output=html.replace('<!--CARD_STYLE-->',()=>`<style>${css}</style>`).replace('<!--CARD_SCRIPT-->',()=>`<script type="module">${result.outputFiles[0].text.replaceAll('</script','<\\/script')}</script>`);
if(output.includes('<!--CARD_'))throw new Error('Unresolved card build markers');
await writeFile(new URL('dist/card.html',root),output);
console.log('Built dist/card.html');
