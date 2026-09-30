import { readFileSync, writeFileSync } from 'node:fs';

for (const edition of ['../skills/cohub/', '../zh-CN/skills/cohub/']) {
  for (const [source, target] of [
    ['./read-explore.mjs', 'scripts/read-explore.mjs'],
    ['./explore-catalog.mjs', 'scripts/explore-catalog.mjs'],
    ['../explore/source.json', 'references/explore-source.json'],
  ]) {
    const bytes = readFileSync(new URL(source, import.meta.url));
    const output = new URL(edition + target, import.meta.url);
    if (process.argv.includes('--check')) {
      if (!readFileSync(output).equals(bytes)) throw new Error(`Explore helper drift: ${output}`);
    } else writeFileSync(output, bytes);
  }
}
