import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { validateCatalog } from './explore-catalog.mjs';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export function renderExplore(catalog, css, javascript) {
  validateCatalog(catalog);
  const e = escapeHtml;
  const external = 'target="_blank" rel="noopener noreferrer"';
  const cards = catalog.works.map(work => `<article class="work" id="${e(work.id)}">
<a class="preview" href="${e(work.url)}" ${external} aria-label="Open ${e(work.title)}"><img src="${e(work.preview)}" alt="${e(work.title)}: actual public preview" width="1280" height="800" loading="lazy"></a>
<div class="work-body"><div class="work-heading"><div><h2><a href="${e(work.url)}" ${external}>${e(work.title)}</a></h2><p class="creator">by ${e(work.creator)}</p></div><a class="open-link" href="${e(work.url)}" ${external} aria-label="Open ${e(work.title)} in a new tab" title="Open original work"><img class="icon" src="assets/arrow-up-right.svg" alt=""></a></div>
<p class="description">${e(work.summary)}</p><div class="tags">${work.capabilities.map(id => `<span class="tag" data-kind="${e(id)}">${e(catalog.capabilities.find(item => item.id === id).title)}</span>`).join('')}</div>
<details class="details"><summary>Capabilities &amp; usage</summary><ul>${work.demonstrates.map(item => `<li>${e(item)}</li>`).join('')}</ul><dl><dt>Access</dt><dd>${e(work.access)}</dd><dt>Cost</dt><dd>${e(work.cost)}</dd><dt>Reuse</dt><dd>${e(work.reuse)}</dd></dl><p class="checked">Checked ${e(work.verifiedAt)}. ${e(work.verification)}</p></details></div></article>`).join('\n');
  const data = JSON.stringify(catalog).replaceAll('<', '\\u003c');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="A curated collection of real Cohub works: generation tools, creative workflows, published Boards and connected Spaces."><title>${e(catalog.title)}</title><link rel="icon" href="data:,"><style>${css}</style></head>
<body><header class="masthead"><div class="masthead-inner"><a class="brand" href="https://cohub.live" ${external}><span class="brand-mark" aria-hidden="true">C</span>Cohub</a><a class="top-link" href="https://cohub.live/docs" ${external}>Documentation<img src="assets/arrow-up-right.svg" alt="" class="icon"></a></div></header>
<main class="page"><section class="heading"><div><p class="eyebrow">The community collection</p><h1>Cohub Explore</h1><p class="heading-note">Generation studios, living workspaces and visual stories.</p></div><span class="edition">Curated / ${e(catalog.updatedAt)}</span></section>
<div class="toolbar"><div class="filters" role="group" aria-label="Filter by capability"><button class="filter" type="button" data-capability="all" aria-pressed="true">All works</button>${catalog.capabilities.map(item => `<button class="filter" type="button" data-capability="${e(item.id)}" aria-pressed="false">${e(item.title)}</button>`).join('')}</div><label class="search"><img class="icon" src="assets/search.svg" alt=""><span class="visually-hidden">Search works</span><input id="search" type="search" placeholder="Search works or capabilities" autocomplete="off"></label></div>
<div class="summary-bar"><p id="capability-note">A selection of public Cohub Apps, Boards and media.</p><span class="work-count" id="work-count" role="status" aria-live="polite">${catalog.works.length} works</span></div>
<section class="works" aria-label="Cohub works">${cards}<div class="empty" id="empty" hidden><h2>No matching works.</h2><button class="reset" type="button" id="reset">Reset filters</button></div></section></main>
<footer class="footer"><div class="footer-inner"><div>Independent selection. Original works belong to their creators.${catalog.collectionUrl === null ? '<span class="status">Local preview / not published</span>' : ''}</div><a href="catalog.json">Catalog JSON</a></div></footer>
<script id="catalog" type="application/json">${data}</script><script>${javascript}</script></body></html>\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const root = new URL('../explore/', import.meta.url);
  const catalog = validateCatalog(JSON.parse(readFileSync(new URL('catalog.json', root), 'utf8')));
  for (const file of [...catalog.works.map(work => work.preview), 'assets/search.svg', 'assets/arrow-up-right.svg']) if (!existsSync(new URL(file, root))) throw new Error(`Missing Explore asset: ${file}`);
  const output = renderExplore(catalog, readFileSync(new URL('style.css', root), 'utf8'), readFileSync(new URL('browse.js', root), 'utf8'));
  const target = new URL('index.html', root);
  if (process.argv.includes('--check')) {
    if (readFileSync(target, 'utf8') !== output) throw new Error('Explore HTML is stale; run node scripts/build-explore.mjs');
  } else writeFileSync(target, output);
  console.log(`Explore: ${catalog.works.length} works, ${catalog.capabilities.length} capabilities; ${process.argv.includes('--check') ? 'current' : 'built'}`);
}
