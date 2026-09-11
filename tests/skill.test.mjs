import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const editions = ['skills/cohub/', 'zh-CN/skills/cohub/'];
const read = file => readFileSync(new URL(file, root), 'utf8');
const sources = text => [...text.matchAll(/\| `([a-f0-9-]{36})` \| `([^`]+)` \|/g)].map(m => [m[1], m[2]]);

function checkLinks(url, text) {
  for (const [, target] of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (!/^https?:/.test(target)) assert(existsSync(new URL(target, url)), `Broken link: ${url} -> ${target}`);
  }
}

test('both editions route directly to the same five unique source entries', () => {
  const [en, zh] = editions.map(dir => sources(read(dir + 'SKILL.md')));
  assert.equal(en.length, 5);
  assert.equal(new Set(en.map(([id]) => id)).size, 5);
  assert.deepEqual(en, zh);
  assert(en.some(([id, entry]) => id === 'a94237d0-a290-445a-955f-ad2b54045d36' && entry === '.agents/skills/character-traits/SKILL.md'));
  for (const [, entry] of en) {
    assert(!entry.startsWith('/') && !entry.split('/').includes('..'));
  }
});

test('repository Markdown links resolve and no old directory dependency remains', () => {
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
      if (entry.isDirectory()) walk(url);
      else if (entry.name.endsWith('.md')) {
        const text = readFileSync(url, 'utf8');
        checkLinks(url, text);
        assert(!text.includes('965d7601-25d8-4fd7-a006-7d4f38085bdf'));
        assert(!text.includes('check-capabilities.mjs'));
      }
    }
  }
  walk(root);
});

test('init cleanup preserves all source rows and ongoing workflows', () => {
  for (const dir of editions) {
    const original = read(dir + 'SKILL.md');
    const block = /<!-- COHUB_INIT_START -->[\s\S]*?<!-- COHUB_INIT_END -->/g;
    assert.equal([...original.matchAll(block)].length, 1);
    const cleaned = original.replace(block, '');
    assert(!cleaned.includes('references/init.md'));
    assert(cleaned.includes('cohub auth whoami --json'));
    assert.deepEqual(sources(cleaned), sources(original));
    const referenceTargets = text => [...text.matchAll(/\]\((references\/[^)]+)\)/g)]
      .map(([, target]) => target).filter(target => target !== 'references/init.md');
    assert.deepEqual(referenceTargets(cleaned), referenceTargets(original));
    checkLinks(new URL(dir + 'SKILL.md', root), cleaned);
  }
});

test('both catalogs use the game package with direct genre routes', () => {
  const catalogs = [
    ...editions.map(dir => dir + 'SKILL.md'),
  ];
  for (const file of catalogs) {
    const text = read(file);
    assert(!text.includes('94623e65-f47e-49a5-bb09-7a84b367fd77'));
    assert(sources(text).some(([id, entry]) =>
      id === '07f109e8-1052-41b0-b819-61fe1eb4ac9e' &&
      entry === '.agents/skills/game-maker/SKILL.md'));
    for (const name of ['create-avg', 'city-builder-engine', 'brawl-creator', 'game-maker']) {
      assert(text.includes('.agents/skills/' + name + '/SKILL.md'));
    }
  }
});

test('one self-contained entry per language with matching version and locale', () => {
  const packages = editions.map(dir => JSON.parse(read(dir + 'version.json')));
  assert.equal(packages[0].version, packages[1].version);
  for (const [i, dir] of editions.entries()) {
    assert.deepEqual(readdirSync(new URL(dir.startsWith('zh-CN') ? 'zh-CN/skills/' : 'skills/', root))
      .filter(name => readdirSync(new URL((dir.startsWith('zh-CN') ? 'zh-CN/skills/' : 'skills/') + name + '/', root)).includes('SKILL.md')), ['cohub']);
    assert.equal(packages[i].language, i ? 'zh-CN' : 'en');
    assert(read(dir + 'SKILL.md').includes('version: "' + packages[i].version + '"'));
    assert(read(dir + 'SKILL.md').includes('language: "' + packages[i].language + '"'));
    assert.equal(read(dir + 'scripts/update-check.mjs'), read('scripts/update-check.mjs'));
  }
});

test('stable pointers are independent of candidate package versions', () => {
  const manifest = JSON.parse(read('versions.json'));
  for (const [name, release] of Object.entries(manifest.skills)) {
    assert.equal(release.released, true);
    assert.equal(release.tag, name + '-v' + release.version);
    assert.match(release.commit, /^[a-f0-9]{40}$/);
  }
  const candidate = JSON.parse(read(editions[0] + 'version.json'));
  assert.match(candidate.version, /^\d+\.\d+\.\d+$/);
});
