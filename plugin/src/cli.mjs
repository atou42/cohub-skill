import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execute=promisify(execFile);

export async function runCohub(args,{timeoutMs=30000}={}) {
  const {stdout}=await execute(process.env.COHUB_CLI_PATH || 'cohub', args, {
    env:{...process.env,COHUB_CLI_AUTO_UPDATE:'0'},
    timeout:timeoutMs,maxBuffer:16*1024*1024,windowsHide:true,
  });
  return JSON.parse(stdout);
}
