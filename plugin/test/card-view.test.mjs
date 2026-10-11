import test from 'node:test';
import assert from 'node:assert/strict';
import { mountCard, readCardResult } from '../web/card.js';

const base = {
  kind: 'generation', spaceId: '11111111-1111-4111-8111-111111111111',
  id: '22222222-2222-4222-8222-222222222222', title: 'A coast',
  status: 'completed', media: [], checkedAt: '2026-10-09T15:00:00.000Z',
};
const result = (changes = {}) => ({ structuredContent: { ...base, ...changes } });
const inline = (type, mimeType, data = 'AA==') => ({ type, mimeType, url: `data:${mimeType};base64,${data}` });

test('view accepts supported image, video and audio base64 outputs without changing their sources', () => {
  for (const [type, mimes] of Object.entries({
    image: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    video: ['video/mp4', 'video/webm', 'video/ogg'],
    audio: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/flac'],
  })) {
    for (const mime of mimes) {
      const media = inline(type, mime);
      assert.deepEqual(readCardResult(result({ media: [media] })).media, [media]);
    }
  }
});

test('view rejects active documents, mismatched media types and malformed inline payloads', () => {
  const badMedia = [
    inline('image', 'image/svg+xml'), inline('image', 'text/html'),
    inline('image', 'application/xhtml+xml'), inline('video', 'image/png'),
    { ...inline('image', 'image/png'), mimeType: 'image/jpeg' },
    ...['', 'A', 'AAAA=', 'AB==', 'AA==junk', '%%%=', 'AA==\n'].map(data => inline('image', 'image/png', data)),
    { type: 'image', url: 'data:image/png,unencoded' },
    { type: 'image', url: 'data:image/png;name=cover;base64,AA==' },
  ];
  for (const media of badMedia) {
    assert.throws(() => readCardResult(result({ media: [media] })), /素材/);
  }
  assert.throws(() => readCardResult(result({ url: 'data:text/html;base64,PGgxPkhlbGxvPC9oMT4=' })), /作品地址/);
});

// Only the DOM surface used by the view is supplied. No browser/framework dependency.
class Element {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName; this.ownerDocument = ownerDocument;
    this.children = []; this.dataset = {}; this.className = ''; this.value = ''; this.paused = true; this.listeners = new Map();
    this.style = { setProperty() {}, removeProperty() {} };
    const names = () => this.className.split(/\s+/).filter(Boolean);
    this.classList = {
      add: (...added) => { this.className = [...new Set([...names(), ...added])].join(' '); },
      remove: (...removed) => { this.className = names().filter(name => !removed.includes(name)).join(' '); },
      toggle: (name, force = !names().includes(name)) => { if (force) this.classList.add(name); else this.classList.remove(name); return force; },
      contains: name => names().includes(name),
    };
  }
  set innerHTML(html) {
    this.children = [...html.matchAll(/<([a-z0-9]+)\b[^>]*class="([^"]+)"[^>]*>/g)].map(([, tag, classes]) => {
      const node = new Element(tag, this.ownerDocument); node.className = classes; return node;
    });
  }
  set textContent(value) { this.value = value; this.children = []; }
  get textContent() { return this.value + this.children.map(child => child.textContent).join(''); }
  append(...nodes) { this.children.push(...nodes); }
  prepend(...nodes) { this.children.unshift(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute() {}
  removeAttribute() {}
  addEventListener(name, listener) { this.listeners.set(name, [...(this.listeners.get(name) || []), listener]); }
  removeEventListener(name, listener) { this.listeners.set(name, (this.listeners.get(name) || []).filter(item => item !== listener)); }
  dispatch(name) { for (const listener of this.listeners.get(name) || []) listener({ preventDefault() {}, stopPropagation() {} }); }
  click() { if (!this.disabled) this.dispatch('click'); }
  insertAdjacentHTML() {}
  play() { this.paused = false; this.dispatch('play'); return Promise.resolve(); }
  pause() { this.paused = true; this.dispatch('pause'); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) {
    const matches = node => selector.split(',').some(part => {
      part = part.trim();
      return part.startsWith('.') ? node.className.split(/\s+/).includes(part.slice(1)) : node.tagName === part;
    });
    return this.children.flatMap(node => [...(matches(node) ? [node] : []), ...node.querySelectorAll(selector)]);
  }
}

function mount(callTool) {
  const listeners = new Map();
  const doc = {
    hidden: false,
    createElement: tag => new Element(tag, doc),
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: name => listeners.delete(name),
  };
  const root = new Element('main', doc);
  return {
    view: mountCard(root, { callTool, sendMessage: async () => ({}), openLink: async () => ({}) }), root, listeners,
    setHidden(hidden) { doc.hidden = hidden; listeners.get('visibilitychange')?.(); },
  };
}

test('inline media is shown without printing the base64 payload in details; prompt stays in details', () => {
  const { view, root } = mount(async () => result());
  const media = inline('image', 'image/png', 'aGVsbG8=');
  const prompt = 'A quiet coast at sunrise, with distant houses and soft morning light.';
  view.render(result({ title: '生成作品', prompt, media: [media] }));
  assert.equal(root.querySelector('.work-media')?.src, media.url);
  assert.equal(root.querySelector('.card-title').textContent, '生成作品');
  assert.match(root.querySelector('.details-content').textContent, /A quiet coast at sunrise/);
  assert.doesNotMatch(root.querySelector('.details-content').textContent, /aGVsbG8=/);
  view.destroy();
});

test('completed and failed cards never schedule a background read', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const { view, root } = mount(async (...args) => calls.push(args));
  for (const status of ['completed', 'failed']) {
    view.render(result({ status }));
    assert.equal(root.querySelector('.cohub-card').dataset.status, status);
    t.mock.timers.tick(30000);
  }
  assert.deepEqual(calls, []);
  view.destroy();
});

test('a completed refresh updates the card once and stops subsequent reads', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const { view, root } = mount(async (name, args) => { calls.push([name, args]); return result(); });
  view.render(result({ status: 'running' }));
  t.mock.timers.tick(4999); assert.equal(calls.length, 0);
  t.mock.timers.tick(1); await Promise.resolve();
  assert.deepEqual(calls, [['read_card', { kind: base.kind, spaceId: base.spaceId, id: base.id }]]);
  assert.equal(root.querySelector('.cohub-card').dataset.status, 'completed');
  t.mock.timers.tick(30000); assert.equal(calls.length, 1);
  view.destroy();
});

test('hiding a running card stops reads; showing it resumes; destroying it stops permanently', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const { view, setHidden, listeners } = mount(async () => { calls++; return result({ status: 'running' }); });
  view.render(result({ status: 'pending' }));
  setHidden(true); t.mock.timers.tick(30000); assert.equal(calls, 0);
  setHidden(false); t.mock.timers.tick(5000); await Promise.resolve(); assert.equal(calls, 1);
  view.destroy();
  assert.equal(listeners.has('visibilitychange'), false);
  setHidden(false); t.mock.timers.tick(30000); assert.equal(calls, 1);
});

test('reads never overlap and an outstanding response cannot update a destroyed card', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0, finish;
  const { view, root } = mount(() => { calls++; return new Promise(resolve => { finish = resolve; }); });
  view.render(result({ status: 'running' }));
  t.mock.timers.tick(5000); assert.equal(calls, 1);
  t.mock.timers.tick(30000); await view.refresh(); assert.equal(calls, 1);
  view.destroy(); finish(result()); await Promise.resolve();
  assert.equal(root.querySelector('.cohub-card').dataset.status, 'running');
  t.mock.timers.tick(30000); assert.equal(calls, 1);
});

test('a failed read keeps the same preview and exposes the refresh failure', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { view, root } = mount(async () => { throw new Error('Cohub is unavailable'); });
  view.render(result({ status: 'running', media: [{ type: 'image', url: 'https://cdn.example.org/work.png' }] }));
  const original = root.querySelector('.work-media');
  t.mock.timers.tick(5000); await Promise.resolve();
  assert.equal(root.querySelector('.work-media'), original);
  assert.match(root.querySelector('.card-notices').textContent, /Cohub is unavailable/);
  assert.equal(root.querySelector('.cohub-card').dataset.stale, 'true');
  view.destroy();
});

test('audio results get a play control, and starting one track pauses the other', () => {
  const { view, root } = mount(async () => result());
  view.render(result({ media: [{ type: 'audio', url: 'https://cdn.example.org/a.mp3' }, { type: 'audio', url: 'https://cdn.example.org/b.mp3' }] }));
  const players = root.querySelectorAll('.work-media'), toggles = root.querySelectorAll('.audio-toggle');
  assert.equal(players.length, 2);
  assert.equal(toggles.length, 2);
  toggles[0].click();
  assert.equal(players[0].paused, false);
  toggles[1].click();
  assert.equal(players[1].paused, false);
  assert.equal(players[0].paused, true);
  toggles[1].click();
  assert.equal(players[1].paused, true);
  view.destroy();
});

test('optional task times must be valid dates', () => {
  assert.equal(readCardResult(result({ startedAt: '2026-10-09T15:07:38.735Z', finishedAt: '2026-10-09T15:08:06.185Z' })).finishedAt, '2026-10-09T15:08:06.185Z');
  for (const startedAt of ['soon', '', 5]) assert.throws(() => readCardResult(result({ startedAt })), /时间/);
});

test('a finished generation shows how long it took', () => {
  const { view, root } = mount(async () => result());
  view.render(result({ startedAt: '2026-10-09T15:07:38.735Z', finishedAt: '2026-10-09T15:08:06.185Z', media: [{ type: 'image', url: 'https://cdn.example.org/work.png' }] }));
  assert.match(root.querySelector('.card-meta').textContent, /用时 27 秒/);
  view.destroy();
});
