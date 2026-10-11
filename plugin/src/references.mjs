import {randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {basename,extname,join} from 'node:path';
import {z} from 'zod';

export const MAX_REFERENCE_BYTES=20*1024*1024;
const extensions={
  'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','image/gif':'.gif','image/avif':'.avif',
  'video/mp4':'.mp4','video/webm':'.webm','video/quicktime':'.mov','video/ogg':'.ogv',
  'audio/mpeg':'.mp3','audio/wav':'.wav','audio/ogg':'.ogg','audio/mp4':'.m4a','audio/aac':'.aac',
};
function validHeader(bytes,mime) {
  const head=bytes.subarray(0,12),text=head.toString('ascii');
  if(mime==='image/png')return head.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
  if(mime==='image/jpeg')return head[0]===255&&head[1]===216&&head[2]===255;
  if(mime==='image/gif')return ['GIF87a','GIF89a'].includes(text.slice(0,6));
  if(mime==='image/webp')return text.startsWith('RIFF')&&text.slice(8)==='WEBP';
  if(mime==='audio/wav')return text.startsWith('RIFF')&&text.slice(8)==='WAVE';
  if(mime.endsWith('/ogg'))return text.startsWith('OggS');
  if(mime==='audio/mpeg')return text.startsWith('ID3')||head[0]===255&&(head[1]&224)===224;
  if(mime==='audio/aac')return head[0]===255&&(head[1]&246)===240;
  if(mime.endsWith('/webm'))return head.subarray(0,4).equals(Buffer.from('1a45dfa3','hex'));
  if(mime==='image/avif')return text.slice(4,8)==='ftyp'&&['avif','avis'].includes(text.slice(8,12));
  return ['video/mp4','video/quicktime','audio/mp4'].includes(mime)&&text.slice(4,8)==='ftyp';
}
export function validateReferenceBytes(bytes,type,mime) {
  if(!extensions[mime]||!mime.startsWith(`${type}/`))throw new Error('不支持或不匹配的素材类型');
  if(bytes.length===0||bytes.length>MAX_REFERENCE_BYTES)throw new Error('素材必须非空且不超过 20 MB');
  if(!validHeader(bytes,mime))throw new Error('文件内容与声明的媒体格式不符');
}
export function referencePath(directory,source) {
  z.uuid().parse(source.id);
  const extension=extensions[source.mimeType];
  if(!extension)throw new Error('不支持的素材格式');
  return join(directory,'references',source.id+extension);
}
export async function stageReference(directory,input) {
  let bytes,mime=input.mimeType,name=input.name;
  if(input.filePath) {
    const info=await stat(input.filePath);
    if(!info.isFile()||info.size>MAX_REFERENCE_BYTES)throw new Error('请选择不超过 20 MB 的媒体文件');
    bytes=await readFile(input.filePath);
    const ext=extname(input.filePath).toLowerCase();
    mime??=Object.entries(extensions).find(([,extension])=>extension===ext)?.[0];
    if(ext==='.jpeg')mime??='image/jpeg';
    name??=basename(input.filePath);
  } else {
    if(typeof input.base64!=='string')throw new Error('缺少所选文件');
    bytes=Buffer.from(input.base64,'base64');
    if(bytes.toString('base64')!==input.base64)throw new Error('文件编码损坏');
  }
  validateReferenceBytes(bytes,input.type,mime);
  const source={type:'file',id:randomUUID(),name:basename(name||`reference${extensions[mime]}`),mimeType:mime,size:bytes.length};
  await mkdir(join(directory,'references'),{recursive:true,mode:0o700});
  await writeFile(referencePath(directory,source),bytes,{flag:'wx',mode:0o600});
  return source;
}
export async function uploadReference(execute,directory,draftId,spaceId,item) {
  const path=referencePath(directory,item.source);
  const bytes=await readFile(path);
  validateReferenceBytes(bytes,item.type,item.source.mimeType);
  if(bytes.length!==item.source.size)throw new Error('已保存素材的大小发生变化，请重新选择');
  const destination=`cohub-card-inputs/${draftId}/${item.source.id}${extensions[item.source.mimeType]}`;
  // This UUID path belongs only to this staged reference. Repeating its upload
  // after a partial upload failure must not create or overwrite another asset.
  const result=await execute(['--json','-s',spaceId,'public','upload','--overwrite',path,destination],{timeoutMs:120000});
  const parsed=z.object({destination:z.literal(destination),urlPrefix:z.url(),files:z.array(z.object({path:z.literal(destination),size:z.literal(bytes.length),mimeType:z.literal(item.source.mimeType)})).length(1)}).parse(result);
  const url=new URL(destination.split('/').map(encodeURIComponent).join('/'),parsed.urlPrefix.endsWith('/')?parsed.urlPrefix:parsed.urlPrefix+'/');
  if(url.protocol!=='https:'||url.username||url.password)throw new Error('Cohub 返回了无效的上传地址');
  return {...item,source:{type:'url',url:url.href}};
}
