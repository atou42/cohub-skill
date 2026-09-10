import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const SPACE_ID = '965d7601-25d8-4fd7-a006-7d4f38085bdf';

export function validateCatalog(value) {
  assert(value && typeof value === 'object' && !Array.isArray(value), 'Expected a catalog object');
  assert.equal(value.schemaVersion, 1, 'Unsupported schema version');
  assert.equal(value.spaceId, SPACE_ID, 'Wrong directory Space');
  assert(typeof value.version === 'string' && value.version.trim(), 'Missing release version');
  assert(Array.isArray(value.capabilities) && value.capabilities.length, 'Empty capability list');
  const ids = new Set();
  for (const entry of value.capabilities) {
    assert(entry && typeof entry === 'object', 'Invalid entry');
    assert(typeof entry.id === 'string' && /^[a-z]+(?:-[a-z]+)*$/.test(entry.id), 'Invalid capability ID');
    assert(!ids.has(entry.id), 'Duplicate capability ID');
    ids.add(entry.id);
    assert.equal(entry.guide, `guides/${entry.id}.md`, 'Invalid guide path');
    assert(['current-account-readable', 'restricted-source'].includes(entry.sourceStatus), 'Unknown source status');
    for (const field of ['name', 'description']) {
      for (const language of ['en', 'zh']) {
        assert(typeof entry[field]?.[language] === 'string' && entry[field][language].trim(), `Missing ${field}.${language}`);
      }
    }
  }
  return value;
}

export function validateGuide(text, version) {
  assert(typeof text === 'string' && text.startsWith('# '), 'Not a Markdown guide');
  assert(text.includes(`Directory release: \`${version}\`.`), 'Guide/catalog version mismatch');
}

export function readDirectory(path) {
  return execFileSync('cohub', ['-s', SPACE_ID, 'spaces', 'files', 'cat', path], {
    encoding: 'utf8',
    env: { ...process.env, COHUB_CLI_AUTO_UPDATE: '0' },
    timeout: 60000,
    maxBuffer: 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function liveCheck() {
  const catalog = validateCatalog(JSON.parse(readDirectory('catalog.json')));
  assert(readDirectory('README.md').startsWith('# Cohub Creator Capabilities'), 'Wrong directory README');
  for (const entry of catalog.capabilities) {
    validateGuide(readDirectory(entry.guide), catalog.version);
    console.log(`PASS guide: ${entry.id} (${entry.sourceStatus})`);
  }
  const api = new URL(`/api/spaces/${SPACE_ID}/fs/file`, 'https://api.cohub.live');
  api.searchParams.set('path', 'catalog.json');
  // No token, cookies, or local CLI authentication is passed to these requests.
  const denied = await fetch(api, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  assert([401, 403, 404].includes(denied.status), `Anonymous API unexpectedly returned ${denied.status}`);
  const body = await denied.text();
  assert(!body.includes(catalog.version) && !body.includes('capabilities'), 'Anonymous API leaked catalog content');
  console.log(`PASS anonymous API denial: ${denied.status}`);
  const publicUrl = `https://public.cohub.run/s/${SPACE_ID}/catalog.json`;
  const cdn = await fetch(publicUrl, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  assert([401, 403, 404].includes(cdn.status), `Public CDN unexpectedly returned ${cdn.status}`);
  console.log(`PASS no public catalog mirror: ${cdn.status}`);
  console.log(`PASS live directory ${catalog.version}; non-owner access and end-to-end creation are separate checks.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.equal(process.argv[2], '--live', 'Usage: node scripts/check-capabilities.mjs --live');
  await liveCheck();
}
