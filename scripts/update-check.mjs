import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const version = value => {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) throw new Error('Invalid version');
  const parts = value.split('.').map(Number);
  if (!parts.every(Number.isSafeInteger)) throw new Error('Invalid version');
  return parts;
};
export function checkUpdate(local, manifest) {
  if (local?.schemaVersion !== 1 || manifest?.schemaVersion !== 1 ||
      local.name !== 'cohub' || !['en', 'zh-CN'].includes(local.language)) throw new Error('Unknown installation metadata');
  const current = version(local.version);
  const release = manifest.skills?.[local.name];
  if (!release) throw new Error('Missing release');
  const latest = version(release.version);
  if (release.released === false) return { status: 'unreleased', installed: local.version };
  if (release.released !== true) throw new Error('Missing release status');
  if (release.tag !== 'cohub-v' + release.version || !/^[a-f0-9]{40}$/.test(release.commit ?? '')) throw new Error('Invalid release pointer');
  const delta = latest.map((part, i) => part - current[i]).find(part => part !== 0) ?? 0;
  if (delta <= 0) return { status: delta < 0 ? 'local-newer' : 'current', installed: local.version, latest: release.version };
  const note = release.notes?.[local.language];
  if (typeof note !== 'string') throw new Error('Missing language notes');
  const directory = local.language === 'zh-CN' ? 'zh-CN/skills/cohub' : 'skills/cohub';
  return {
    status: 'available', installed: local.version, latest: release.version,
    language: local.language, note, tag: release.tag, commit: release.commit,
    url: 'https://github.com/atou42/cohub-skill/tree/' + release.tag + '/' + directory
  };
}
export async function runCheck(localUrl, fetcher = fetch) {
  try {
    const local = JSON.parse(await readFile(localUrl, 'utf8'));
    const response = await fetcher('https://raw.githubusercontent.com/atou42/cohub-skill/main/versions.json', {
      signal: AbortSignal.timeout(8000), credentials: 'omit', redirect: 'error'
    });
    if (!response.ok) throw new Error('Manifest HTTP ' + response.status);
    return checkUpdate(local, await response.json());
  } catch (error) {
    return { status: 'unavailable', reason: error.message };
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await runCheck(new URL('../version.json', import.meta.url))));
}
