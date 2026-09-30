import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { checkUpdate, runCheck } from '../scripts/update-check.mjs';

const local = { schemaVersion: 1, name: 'cohub', version: '1.9.0', language: 'zh-CN' };
const release = { version: '1.10.0', released: true, tag: 'cohub-v1.10.0', commit: 'a'.repeat(40), notes: { en: 'English', 'zh-CN': '中文' } };
const manifest = item => ({ schemaVersion: 1, skills: { cohub: item } });

test('numeric comparison preserves selected language and immutable tag link', () => {
  const result = checkUpdate(local, manifest(release));
  assert.equal(result.status, 'available');
  assert.equal(result.note, '中文');
  assert.equal(result.url, 'https://github.com/atou42/cohub-skill/tree/cohub-v1.10.0/zh-CN/skills/cohub');
  assert.equal(checkUpdate({ ...local, language: 'en' }, manifest(release)).note, 'English');
});
test('unreleased candidates never become upgrade notices', () => {
  assert.equal(checkUpdate(local, manifest({ ...release, released: false })).status, 'unreleased');
});
test('equal and locally newer versions do not prompt downgrade', () => {
  assert.equal(checkUpdate({ ...local, version: '1.10.0' }, manifest(release)).status, 'current');
  assert.equal(checkUpdate({ ...local, version: '2.0.0' }, manifest(release)).status, 'local-newer');
});
test('invalid metadata fails closed', () => {
  for (const invalid of ['1.2', '1.2.3-beta', '01.2.3', '99999999999999999999.0.0']) {
    assert.throws(() => checkUpdate({ ...local, version: invalid }, manifest(release)));
  }
  assert.throws(() => checkUpdate({ ...local, language: undefined }, manifest(release)));
  assert.throws(() => checkUpdate(local, manifest({ ...release, tag: 'main' })));
  assert.throws(() => checkUpdate(local, manifest({ ...release, commit: 'main' })));
  assert.throws(() => checkUpdate(local, manifest({ ...release, notes: {} })));
  assert.throws(() => checkUpdate(local, manifest(undefined)));
});
test('HTTP failures and bad JSON are unavailable, with one attempt and no writes', async () => {
  const url = new URL('../skills/cohub/version.json', import.meta.url);
  for (const fail of [
    async () => { throw new Error('network unavailable'); },
    async () => ({ ok: false, status: 403 }),
    async () => ({ ok: true, json: async () => { throw new Error('bad JSON'); } }),
  ]) {
    let calls = 0;
    const result = await runCheck(url, async (endpoint, options) => {
      calls++;
      assert.equal(endpoint, 'https://raw.githubusercontent.com/atou42/cohub-skill/main/versions.json');
      assert.equal(options.credentials, 'omit');
      assert.equal(options.redirect, 'error');
      assert(!options.body && !options.headers);
      return fail();
    });
    assert.equal(calls, 1);
    assert.equal(result.status, 'unavailable');
  }
});
test('missing local version is unavailable without making a network request', async () => {
  const result = await runCheck(new URL('./missing-version.json', import.meta.url), () => assert.fail('Unexpected request'));
  assert.equal(result.status, 'unavailable');
});

test('packaged checkers run through direct, directory and chained symlink entries', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'cohub-checker-'));
  try {
    const latest = manifest({ ...release, version: '99.0.0', tag: 'cohub-v99.0.0' });
    const fixture = join(temporary, 'fetch-fixture.mjs');
    writeFileSync(fixture, `
      import assert from 'node:assert/strict';
      let calls = 0;
      globalThis.fetch = async (url, options) => {
        assert.equal(++calls, 1);
        assert.equal(url, 'https://raw.githubusercontent.com/atou42/cohub-skill/main/versions.json');
        assert.equal(options.credentials, 'omit');
        assert.equal(options.redirect, 'error');
        assert(!options.body && !options.headers);
        return new Response(${JSON.stringify(JSON.stringify(latest))});
      };
    `);
    for (const directory of ['skills/cohub/', 'zh-CN/skills/cohub/']) {
      const edition = directory.startsWith('zh-CN') ? 'zh-CN' : 'en';
      const installed = join(temporary, edition, 'installed');
      cpSync(new URL('../' + directory, import.meta.url), installed, { recursive: true });
      const mount = join(temporary, edition, 'mounted skill');
      const chained = join(temporary, edition, 'second-mount');
      symlinkSync(installed, mount, 'dir');
      symlinkSync(mount, chained, 'dir');
      const fileMount = join(temporary, edition, 'checker.mjs');
      symlinkSync(join(installed, 'scripts/update-check.mjs'), fileMount, 'file');
      const metadata = JSON.parse(readFileSync(join(installed, 'version.json'), 'utf8'));
      for (const entry of [realpathSync(installed), mount, chained].map(path => join(path, 'scripts/update-check.mjs')).concat(fileMount)) {
        const result = spawnSync(process.execPath, ['--import', fixture, entry], { cwd: temporary, encoding: 'utf8', timeout: 10000 });
        assert.ifError(result.error);
        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.stderr, '');
        assert.notEqual(result.stdout.trim(), '', `No result from ${entry}`);
        assert.deepEqual(JSON.parse(result.stdout), checkUpdate(metadata, latest));
      }
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test('symlink entry reports missing local metadata without fetching or recreating it', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'cohub-checker-missing-'));
  try {
    const scripts = join(temporary, 'installed', 'scripts');
    mkdirSync(scripts, { recursive: true });
    cpSync(new URL('../scripts/update-check.mjs', import.meta.url), join(scripts, 'update-check.mjs'));
    const mount = join(temporary, 'mounted');
    symlinkSync(join(temporary, 'installed'), mount, 'dir');
    const fixture = join(temporary, 'no-fetch.mjs');
    writeFileSync(fixture, 'globalThis.fetch = () => { process.stderr.write("Unexpected request"); process.exit(9); };');
    const result = spawnSync(process.execPath, ['--import', pathToFileURL(fixture).href, join(mount, 'scripts/update-check.mjs')], { cwd: temporary, encoding: 'utf8', timeout: 10000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    assert.notEqual(result.stdout.trim(), '', 'Missing metadata must not produce silent success');
    const output = JSON.parse(result.stdout);
    assert.equal(output.status, 'unavailable');
    assert.match(output.reason, /ENOENT/);
    assert.throws(() => readFileSync(join(mount, 'version.json')), { code: 'ENOENT' });
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
