import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { validateCatalog, selectWorks } from '../scripts/explore-catalog.mjs';
import { fetchCatalog, runExplore } from '../scripts/read-explore.mjs';
import { renderExplore } from '../scripts/build-explore.mjs';

const root = new URL('../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');
const catalog = () => JSON.parse(read('explore/catalog.json'));
const source = { schemaVersion: 1, catalogUrl: 'https://public.cohub.live/p/fixture/explore/catalog.json' };
const published = () => ({ ...catalog(), collectionUrl: 'https://cohub.live/curator/examples/w/explore' });
const unpublished = () => ({ ...catalog(), collectionUrl: null });

test('curated works have real Cohub links, complete conditions and local previews', () => {
  const data = validateCatalog(catalog());
  assert(data.works.length >= 3);
  for (const work of data.works) assert(readFileSync(new URL('explore/' + work.preview, root)).length > 1024);
});

test('missing, duplicate or foreign catalog data is rejected rather than defaulted', () => {
  const mutations = [
    data => { delete data.works[0].id; },
    data => { delete data.capabilities[0].id; },
    data => { delete data.works[0].access; },
    data => { delete data.collectionUrl; },
    data => { data.works.push(structuredClone(data.works[0])); },
    data => { data.works[0].capabilities = ['invented']; },
    data => { data.works[0].url = 'https://neta.art/explore/work/example'; },
    data => { data.works[0].url = 'https://cohub.live/spaces/private/session'; },
    data => { data.works[0].url = 'https://secret@cohub.live/a/b/w/c'; },
    data => { data.works[0].preview = '../private.jpg'; },
    data => { data.works[0].verifiedAt = '2026-02-31'; },
  ];
  for (const mutate of mutations) {
    const data = catalog();
    mutate(data);
    assert.throws(() => validateCatalog(data), String(mutate));
  }
});

test('selection filters by capability and defaults to capability diversity', () => {
  const data = catalog();
  const selected = selectWorks(data, undefined, 3);
  assert.equal(selected.length, 3);
  assert.equal(new Set(selected.flatMap(work => work.capabilities)).size, data.capabilities.length);
  assert(selectWorks(data, 'generation', 10).every(work => work.capabilities.includes('generation')));
  assert.throws(() => selectWorks(data, 'invented'));
  assert.throws(() => selectWorks(data, undefined, 0));
  assert.throws(() => selectWorks(data, undefined, NaN));
  assert.deepEqual(selectWorks({ ...data, works: [] }, 'generation'), []);
});

test('unpublished source does not fetch, authenticate or invent a public link', async () => {
  const result = await fetchCatalog({ schemaVersion: 1, catalogUrl: null }, () => assert.fail('Unexpected network request'));
  assert.equal(result.status, 'unpublished');
  assert(!Object.hasOwn(result, 'catalog'));
  await assert.rejects(() => fetchCatalog({ schemaVersion: 1 }, () => assert.fail('Unexpected request')));
});

test('public catalog is fetched once with no credentials or user task data', async () => {
  let calls = 0;
  const result = await fetchCatalog(source, async (url, options) => {
    calls++;
    assert.equal(url, source.catalogUrl);
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    assert.deepEqual(options.headers, { Accept: 'application/json' });
    assert(!options.body);
    return new Response(JSON.stringify(published()));
  });
  assert.equal(calls, 1);
  assert.equal(result.status, 'available');
  assert.equal(result.catalog.works.length, catalog().works.length);
});

test('HTTP, network, malformed and oversized responses remain errors without retries', async () => {
  for (const respond of [
    () => new Response('Unavailable', { status: 503 }),
    () => new Response('{broken'),
    () => new Response('{}'),
    () => new Response(JSON.stringify(unpublished())),
    () => new Response('x'.repeat(262145)),
    () => { throw new Error('Network unavailable'); },
  ]) {
    let calls = 0;
    await assert.rejects(() => fetchCatalog(source, async () => { calls++; return respond(); }));
    assert.equal(calls, 1);
  }
});

test('local preview is explicit and corrupt local files do not become empty catalogs', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cohub-explore-'));
  try {
    const file = join(dir, 'catalog.json');
    writeFileSync(file, JSON.stringify(unpublished()));
    const valid = await runExplore({ catalogFile: file, capability: 'generation' }, () => assert.fail('Unexpected fetch'));
    assert.equal(valid.status, 'local');
    assert.equal(valid.collectionUrl, null);
    assert(valid.works.length > 0);
    writeFileSync(file, '{broken');
    const broken = await runExplore({ catalogFile: file });
    assert.equal(broken.status, 'unavailable');
    assert(!Object.hasOwn(broken, 'works'));
    assert.equal(readFileSync(file, 'utf8'), '{broken');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('HTML and embedded JSON preserve data without executing catalog markup', () => {
  const data = catalog();
  data.works[0].summary = '</script><script>alert("injected")</script>';
  const html = renderExplore(data, '', '');
  assert(!html.includes(data.works[0].summary));
  assert(html.includes('&lt;/script&gt;'));
  const embedded = html.match(/<script id="catalog" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.deepEqual(JSON.parse(embedded), data);
  assert.equal((html.match(/class="work" id=/g) || []).length, data.works.length);
});

test('both skill editions ship the same self-contained reader and source', () => {
  for (const edition of ['skills/cohub/', 'zh-CN/skills/cohub/']) {
    for (const name of ['explore-catalog.mjs', 'read-explore.mjs']) assert.equal(read(edition + 'scripts/' + name), read('scripts/' + name));
    assert.equal(read(edition + 'references/explore-source.json'), read('explore/source.json'));
  }
});

test('generated page is current and consumes the same catalog as the reader', () => {
  assert.equal(read('explore/index.html'), renderExplore(catalog(), read('explore/style.css'), read('explore/browse.js')));
});
