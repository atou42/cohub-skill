import assert from 'node:assert/strict';
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
