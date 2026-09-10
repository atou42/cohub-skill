import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { SPACE_ID, validateCatalog, validateGuide } from '../scripts/check-capabilities.mjs';

const root = new URL('../', import.meta.url);
const fixture = () => ({
  schemaVersion: 1, version: 'test.1', spaceId: SPACE_ID,
  capabilities: [{
    id: 'sample', guide: 'guides/sample.md', sourceStatus: 'restricted-source',
    name: { en: 'Sample', zh: '示例' }, description: { en: 'Test only', zh: '仅测试' },
  }],
});

test('accepts a bilingual catalog without treating restricted sources as ready', () => {
  assert.equal(validateCatalog(fixture()).capabilities[0].sourceStatus, 'restricted-source');
});

for (const [name, change] of [
  ['wrong Space', c => { c.spaceId = 'another-space'; }],
  ['unsupported schema', c => { c.schemaVersion = 2; }],
  ['empty catalog', c => { c.capabilities = []; }],
  ['duplicate IDs', c => { c.capabilities.push(c.capabilities[0]); }],
  ['path traversal', c => { c.capabilities[0].guide = '../secret.md'; }],
  ['remote URL', c => { c.capabilities[0].guide = 'https://example.com/run.sh'; }],
  ['shell injection', c => { c.capabilities[0].id = 'sample;whoami'; }],
  ['missing translation', c => { delete c.capabilities[0].name.zh; }],
  ['unknown status', c => { c.capabilities[0].sourceStatus = 'ready-for-everyone'; }],
  ['missing version', c => { delete c.version; }],
]) {
  test(`rejects ${name}`, () => {
    const catalog = fixture(); change(catalog);
    assert.throws(() => validateCatalog(catalog));
  });
}

test('rejects login HTML, malformed JSON, and inconsistent guide versions', () => {
  assert.throws(() => JSON.parse('<html>Login</html>'));
  assert.throws(() => JSON.parse('{"capabilities":'));
  assert.throws(() => validateCatalog(null));
  assert.throws(() => validateGuide('<html>Login</html>', 'test.1'));
  assert.throws(() => validateGuide('# Sample\nDirectory release: `old`.', 'test.1'));
  validateGuide('# Sample\nDirectory release: `test.1`.', 'test.1');
});

function checkLinks(file, text) {
  for (const [, target] of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^https?:/.test(target)) continue;
    assert(existsSync(new URL(target, file)), `Broken link in ${file}: ${target}`);
  }
}

test('all repository Markdown links resolve locally', () => {
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
      if (entry.isDirectory()) walk(url);
      else if (entry.name.endsWith('.md')) checkLinks(url, readFileSync(url, 'utf8'));
    }
  }
  walk(root);
});

test('both editions survive init cleanup without losing capability, generate, or publish routes', () => {
  for (const directory of ['skills/cohub/', 'zh-CN/skills/cohub/']) {
    const file = new URL(directory + 'SKILL.md', root);
    const original = readFileSync(file, 'utf8');
    const block = /<!-- COHUB_INIT_START -->[\s\S]*?<!-- COHUB_INIT_END -->/g;
    assert.equal([...original.matchAll(block)].length, 1);
    const clean = original.replace(block, '');
    assert(!clean.includes('references/init.md'));
    assert(clean.includes('cohub auth whoami --json'));
    assert.equal([...clean.matchAll(/\]\(references\//g)].length, 3);
    checkLinks(file, clean);
  }
});

test('bilingual capability guides have identical shell examples', () => {
  const commands = file => [...readFileSync(new URL(file, root), 'utf8').matchAll(/```bash\n([\s\S]*?)```/g)].map(m => m[1]);
  assert.deepEqual(commands('skills/cohub/references/capabilities.md'), commands('zh-CN/skills/cohub/references/创作能力.md'));
});
