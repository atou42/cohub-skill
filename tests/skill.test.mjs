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
    assert.equal([...cleaned.matchAll(/\]\(references\//g)].length, 2);
    checkLinks(new URL(dir + 'SKILL.md', root), cleaned);
  }
});
