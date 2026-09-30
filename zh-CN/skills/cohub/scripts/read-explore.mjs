import { readFile, realpath } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { publicUrl, validateCatalog, selectWorks } from './explore-catalog.mjs';

export async function fetchCatalog(source, fetcher = fetch) {
  if (source?.schemaVersion !== 1 || !Object.hasOwn(source, 'catalogUrl')) throw new Error('Invalid Explore source configuration');
  if (source.catalogUrl === null) return { status: 'unpublished', reason: 'The public Explore catalog has not been configured. Do not invent a collection link.' };
  const url = publicUrl(source.catalogUrl, 'catalog URL');
  const response = await fetcher(url, { signal: AbortSignal.timeout(8000), credentials: 'omit', redirect: 'error', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Explore HTTP ${response.status}`);
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 262144) throw new Error('Explore response exceeds 256 KiB');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const catalog = validateCatalog(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  if (catalog.collectionUrl === null) throw new Error('Public catalog has no collection URL');
  return { status: 'available', catalog };
}

export async function runExplore({ sourceFile, catalogFile, capability, limit = 3 }, fetcher = fetch) {
  try {
    let result;
    if (catalogFile) result = { status: 'local', catalog: validateCatalog(JSON.parse(await readFile(catalogFile, 'utf8'))) };
    else result = await fetchCatalog(JSON.parse(await readFile(sourceFile, 'utf8')), fetcher);
    if (!result.catalog) return result;
    const { catalog } = result;
    const works = selectWorks(catalog, capability, limit);
    return { status: result.status, collectionUrl: catalog.collectionUrl, updatedAt: catalog.updatedAt, capabilities: catalog.capabilities, works, matched: works.length, total: catalog.works.length };
  } catch (error) {
    return { status: 'unavailable', reason: error.message };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(process.argv[1])).href) {
  try {
    const options = { sourceFile: new URL('../references/explore-source.json', import.meta.url) };
    for (let i = 2; i < process.argv.length; i++) {
      const flag = process.argv[i];
      if (!['--catalog', '--capability', '--limit'].includes(flag) || !process.argv[i + 1] || process.argv[i + 1].startsWith('--')) throw new Error('Usage: read-explore.mjs [--catalog <local.json>] [--capability <id>] [--limit <1-20>]');
      const value = process.argv[++i];
      options[flag === '--catalog' ? 'catalogFile' : flag.slice(2)] = flag === '--limit' ? Number(value) : value;
    }
    const result = await runExplore(options);
    console.log(JSON.stringify(result));
    if (result.status === 'unavailable') process.exitCode = 1;
  } catch (error) {
    console.log(JSON.stringify({ status: 'unavailable', reason: error.message }));
    process.exitCode = 1;
  }
}
