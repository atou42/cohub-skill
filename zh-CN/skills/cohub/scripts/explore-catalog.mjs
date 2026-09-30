const publicHosts = new Set(['cohub.live', 'cohub.run', 'public.cohub.live', 'public.cohub.run', 'works.cohub.live']);
const text = (value, label) => {
  if (typeof value !== 'string' || !value.trim() || value.length > 2000) throw new Error(`Invalid ${label}`);
  return value;
};
const date = (value, label) => {
  text(value, label);
  const milliseconds = Date.parse(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(milliseconds) || new Date(milliseconds).toISOString().slice(0, 10) !== value) throw new Error(`Invalid ${label}`);
};
export function publicUrl(value, label = 'URL') {
  const url = new URL(text(value, label));
  if (url.protocol !== 'https:' || !publicHosts.has(url.hostname) || url.username || url.password || url.port) throw new Error(`Invalid public Cohub ${label}`);
  return url.href;
}
export function validateCatalog(value) {
  if (value?.schemaVersion !== 1 || !Array.isArray(value.capabilities) || !value.capabilities.length || !Array.isArray(value.works)) throw new Error('Invalid Explore catalog structure');
  text(value.title, 'catalog title');
  date(value.updatedAt, 'catalog date');
  if (value.collectionUrl !== null) publicUrl(value.collectionUrl, 'collection URL');
  if (value.works.length > 200 || value.capabilities.length > 20) throw new Error('Explore catalog is too large');
  const capabilities = new Set();
  for (const capability of value.capabilities) {
    if (typeof capability.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(capability.id) || capabilities.has(capability.id)) throw new Error('Invalid or duplicate capability ID');
    text(capability.title, 'capability title');
    text(capability.description, 'capability description');
    capabilities.add(capability.id);
  }
  const ids = new Set();
  const urls = new Set();
  for (const work of value.works) {
    if (typeof work.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(work.id) || ids.has(work.id)) throw new Error('Invalid or duplicate work ID');
    ids.add(work.id);
    const url = new URL(publicUrl(work.url, 'work URL'));
    if (!['cohub.live', 'cohub.run'].includes(url.hostname) || !/^\/[^/]+\/[^/]+\/w\/[^/]+$/.test(url.pathname) || url.search || url.hash || urls.has(url.href)) throw new Error('Expected a unique canonical Cohub work URL');
    urls.add(url.href);
    for (const key of ['title', 'creator', 'summary', 'access', 'cost', 'reuse', 'verification']) text(work[key], `work ${key}`);
    if (!Array.isArray(work.capabilities) || !work.capabilities.length || work.capabilities.some(id => !capabilities.has(id))) throw new Error('Unknown or missing work capability');
    if (!Array.isArray(work.demonstrates) || !work.demonstrates.length) throw new Error('Missing capability evidence');
    for (const item of work.demonstrates) text(item, 'capability evidence');
    if (!/^assets\/[a-z0-9-]+\.jpg$/.test(work.preview)) throw new Error('Expected a local JPEG preview');
    date(work.verifiedAt, 'verification date');
  }
  return value;
}

export function selectWorks(catalog, capability, limit = 3) {
  validateCatalog(catalog);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20) throw new Error('Limit must be an integer from 1 to 20');
  if (capability && !catalog.capabilities.some(item => item.id === capability)) throw new Error('Unknown capability');
  const remaining = catalog.works.filter(work => !capability || work.capabilities.includes(capability));
  const selected = [];
  const covered = new Set();
  while (remaining.length && selected.length < limit) {
    let best = 0;
    if (!capability) {
      const score = work => work.capabilities.filter(id => !covered.has(id)).length;
      for (let i = 1; i < remaining.length; i++) if (score(remaining[i]) > score(remaining[best])) best = i;
    }
    const [work] = remaining.splice(best, 1);
    selected.push(work);
    work.capabilities.forEach(id => covered.add(id));
  }
  return selected;
}
