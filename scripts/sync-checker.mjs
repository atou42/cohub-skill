import { readFileSync, writeFileSync } from 'node:fs';
const source = readFileSync(new URL('./update-check.mjs', import.meta.url), 'utf8');
for (const directory of ['../skills/cohub/', '../zh-CN/skills/cohub/']) {
  const target = new URL(directory + 'scripts/update-check.mjs', import.meta.url);
  if (process.argv.includes('--check')) {
    if (readFileSync(target, 'utf8') !== source) throw new Error('Checker drift: ' + target);
  } else writeFileSync(target, source);
}
