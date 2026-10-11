import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraftSession, fieldDefinitions, parseFieldValue, readComposerResult, readReferenceFile } from '../web/composer.js';
import * as composer from '../web/composer.js';

const model = { model: 'example-image', title: 'Example image', category: 'image', content: { input: [{ type: 'text', required: true }, { type: 'image', sources: ['url'], roles: ['first_frame', 'last_frame'] }] }, parameters: { duration: { type: 'integer', optional: true, min: 1, max: 15, default: 5 } }, meta: { fields: { lyrics: { type: 'string', optional: true }, settings: { type: 'object', optional: true } } } };
const initial = () => ({ kind: 'composer', draft: { id: 'draft-1', spaceId: 'space-1', revision: 1, title: '创作', model: model.model, prompt: 'Original', media: [], parameters: {}, meta: {}, status: 'draft' }, model, catalog: [{ model: model.model, title: model.title, category: 'image' }], generation: null, validation: { errors: [] }, limitations: [], review:{token:'a'.repeat(64),cost:null,costReason:'费用未知',continuations:[]} });
const TOKEN='a'.repeat(64);
const result = data => ({ structuredContent: structuredClone(data) });

test('confirmation never submits a draft changed after the person reviewed it', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const backend = server(), session = createDraftSession(backend); t.after(() => session.destroy());
  session.receive(result(backend.data));
  const changed = initial(); changed.draft.revision = 2; changed.draft.prompt = 'Unseen paid request'; backend.replace(changed);
  await assert.rejects(() => session.submit(), /方案已更新/);
  assert.equal(backend.calls.filter(([name]) => /^(submit|confirm)_generation$/.test(name)).length, 0);
  assert.equal(session.state().local.prompt, 'Unseen paid request');
});

test('review renders full prompt, plan, references, defaults and unknown cost without another chat turn', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const {view,find,backend}=mountComposerView({sendMessage:()=>assert.fail('confirmation must not send a prompt')}); t.after(()=>view.destroy());
  const data=initial(); data.draft.brief={summary:'清晨海岸，柔和自然光',output:'一张横版封面'};
  data.draft.revision=2;
  data.draft.media=[{type:'image',source:{type:'url',url:'https://example.com/coast.png'},meta:{role:'first_frame'}}];
  data.review={token:TOKEN,cost:null,costReason:'费用无法可靠估算',continuations:[]};
  backend.replace(data);view.render(result(data));
  const review=find('.composer-review');
  assert.match(review.textContent,/清晨海岸/);assert.match(review.textContent,/一张横版封面/);
  assert.match(review.textContent,/Original/);assert.match(review.textContent,/首帧/);
  assert.match(review.textContent,/https:\/\/example.com\/coast.png/);assert.match(review.textContent,/5 秒/);
  assert.match(review.textContent,/费用无法可靠估算/);assert.equal(find('.composer-generate-label').textContent,'确认并生成');
});

test('cancelling saves edits and pauses the existing draft without generating or sending a message', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  const backend=server();const session=createDraftSession(backend);t.after(()=>session.destroy());
  session.receive(result(backend.data));session.edit({prompt:'Keep my draft'});
  await session.cancel();
  assert.equal(backend.data.draft.prompt,'Keep my draft');assert.equal(backend.data.draft.reviewPaused,true);
  assert.equal(backend.calls.filter(([name])=>/^(submit|confirm)_generation$/.test(name)).length,0);
});

test('batch confirmation sends only selected reviewed revisions and the entered estimate budget', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  const backend=server(), data=initial();
  const next=initial();next.draft.id='next-draft';next.draft.revision=3;
  data.draft.continuationDraftIds=['next-draft'];
  data.review={token:TOKEN,cost:{minUsd:0.1,maxUsd:0.2},costReason:'',continuations:[{reviewToken:TOKEN,draft:next.draft,model:next.model,cost:{minUsd:0.2,maxUsd:0.4},costReason:'',validation:{errors:[]},generation:null}]};
  backend.replace(data);const session=createDraftSession(backend);t.after(()=>session.destroy());session.receive(result(data));
  await session.submit({continuations:[{draftId:'next-draft',baseRevision:3,reviewToken:TOKEN}],budgetUsd:1});
  assert.deepEqual(backend.calls.find(([name])=>name==='confirm_generation')[1],{draftId:'draft-1',baseRevision:1,reviewToken:TOKEN,continuations:[{draftId:'next-draft',baseRevision:3,reviewToken:TOKEN}],budgetUsd:1});
});

test('confirmation stays disabled while an edited brief is being saved', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  const {view,find,backend}=mountComposerView();t.after(()=>view.destroy());
  const input=find('.review-summary-input');input.value='New direction';input.fire('input');
  assert.equal(find('.composer-generate').disabled,true);
  find('.composer-generate').click();assert.equal(backend.calls.length,0);
  t.mock.timers.tick(650);await flush();
  assert.equal(backend.data.draft.brief.summary,'New direction');
  assert.equal(find('.composer-generate').disabled,false);
});

test('changed child plans clear batch selection and submitted batches do not report unready drafts', t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const {view,find,backend}=mountComposerView();t.after(()=>view.destroy());
  const data=initial(),child=initial().draft;data.draft.revision=2;child.id='child';
  data.review.continuations=[{draft:child,model,cost:{minUsd:.1,maxUsd:.1},costReason:'',reviewToken:TOKEN,validation:{errors:[]},generation:null}];
  data.review.cost={minUsd:.1,maxUsd:.1};backend.replace(data);view.render(result(data));
  const toggle=find('.review-auto');toggle.checked=true;toggle.fire('change');
  let check=find('.review-choice-input');check.checked=true;check.fire('change');
  const changed=structuredClone(data);changed.review.continuations[0].reviewToken='b'.repeat(64);changed.review.continuations[0].draft.revision=2;
  view.render(result(changed));assert.equal(find('.review-auto').checked,false);assert.equal(find('.review-choice-input').checked,false);
  const toggle2=find('.review-auto');toggle2.checked=true;toggle2.fire('change');
  check=find('.review-choice-input');check.checked=true;check.fire('change');
  const done=structuredClone(changed);done.draft.revision=3;done.draft.status='submitted';done.draft.taskRunId='task';done.review.continuations[0].draft.status='submitted';
  view.render(result(done));assert.equal(find('.review-batch-problem').textContent,'');
});

test('catalog entries can use their model ID when an optional display title is absent', () => {
  const data = initial(); data.catalog = [{ model: model.model }];
  assert.deepEqual(readComposerResult(result(data)).catalog, data.catalog);
  data.catalog[0].title = null;
  assert.throws(() => readComposerResult(result(data)), /模型列表格式/);
});
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function server() {
  let data = initial(); const calls = [];
  return {
    get data() { return data; }, calls,
    async callTool(name, args) {
      calls.push([name, structuredClone(args)]);
      if (name === 'read_generation_draft') return result(data);
      assert.equal(args.baseRevision, data.draft.revision, 'every mutation uses the latest revision');
      if (name === 'update_generation_draft') data = { ...data, draft: { ...data.draft, ...args.patch, revision: data.draft.revision + 1 } };
      else if (name === 'cancel_generation') data = { ...data, draft: { ...data.draft, reviewPaused:true, revision: data.draft.revision + 1 } };
      else if (name === 'confirm_generation') data = { ...data, draft: { ...data.draft, status: 'submitted', taskRunId: 'task-1', revision: data.draft.revision + 1 } };
      else throw new Error(`Unexpected tool ${name}`);
      return result(data);
    },
    replace(next) { data = structuredClone(next); },
  };
}

test('official fields retain their scopes and reject bad typed input', () => {
  assert.deepEqual(fieldDefinitions(model).map(({ scope, key }) => [scope, key]), [['parameters', 'duration'], ['meta', 'lyrics'], ['meta', 'settings']]);
  assert.equal(parseFieldValue(model.parameters.duration, ''), undefined);
  assert.equal(parseFieldValue(model.parameters.duration, '12'), 12);
  for (const value of ['0', '16', '2.5', 'oops']) assert.throws(() => parseFieldValue(model.parameters.duration, value));
  assert.deepEqual(parseFieldValue({ type: 'object' }, '{"speaker":{"weight":0.5}}'), { speaker: { weight: 0.5 } });
  for (const value of ['[1]', 'null', '{']) assert.throws(() => parseFieldValue({ type: 'object' }, value));
  assert.equal(parseFieldValue({ type: 'boolean' }, 'false'), false);
});

test('shared edits preserve local text and merge only explicitly retained fields against the newest revision', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const backend = server(), session = createDraftSession(backend); session.receive(result(backend.data));
  session.edit({ prompt: 'My unfinished input' });
  const remote = initial(); remote.draft.revision = 2; remote.draft.prompt = 'Agent edit'; remote.draft.parameters = { duration: 8 }; backend.replace(remote);
  session.receive(result(remote));
  assert.equal(session.state().local.prompt, 'My unfinished input');
  assert.equal(session.state().conflict.draft.revision, 2);
  await assert.rejects(() => session.submit(), /冲突/);
  assert.equal(backend.calls.filter(([name]) => name === 'confirm_generation').length, 0);
  session.resolveConflict('local'); await session.save();
  assert.equal(backend.data.draft.prompt, 'My unfinished input');
  assert.deepEqual(backend.data.draft.parameters, { duration: 8 });
  assert.deepEqual(backend.calls.at(-1), ['update_generation_draft', { draftId: 'draft-1', baseRevision: 2, patch: { prompt: 'My unfinished input' } }]);
  session.destroy();
});

test('typing during an outstanding save is saved again before the latest copy is submitted', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const backend = server(); let release, first = true;
  const session = createDraftSession({ callTool: async (name, args) => {
    if (name === 'update_generation_draft' && first) { first = false; await new Promise(resolve => { release = resolve; }); }
    return backend.callTool(name, args);
  } });
  session.receive(result(backend.data)); session.edit({ prompt: 'First input' }); const saving = session.save();
  session.edit({ prompt: 'Latest input' }); const submitting = session.submit(); release();
  await saving; await submitting;
  assert.equal(backend.data.draft.prompt, 'Latest input');
  assert.equal(backend.calls.filter(([name]) => name === 'update_generation_draft').length, 2);
  assert.equal(backend.calls.find(([name]) => name === 'confirm_generation')[1].baseRevision, 3);
  session.destroy();
});

test('failed saves preserve input and cannot fall through to submission', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [], session = createDraftSession({ callTool: async name => { calls.push(name); throw new Error('revision conflict'); } });
  session.receive(result(initial())); session.edit({ prompt: 'Keep this input' });
  await assert.rejects(() => session.submit(), /revision conflict/);
  assert.deepEqual(calls, ['update_generation_draft']);
  assert.equal(session.state().local.prompt, 'Keep this input');
  assert.deepEqual(session.state().dirty, ['prompt']); session.destroy();
});

test('double clicks create one submit request and submitted drafts cannot submit again', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const backend = server(); let release;
  const session = createDraftSession({ callTool: async (name, args) => {
    if (name === 'confirm_generation') await new Promise(resolve => { release = resolve; });
    return backend.callTool(name, args);
  } });
  session.receive(result(backend.data));
  const first = session.submit(), second = session.submit(); await flush(); release(); await Promise.all([first, second]);
  assert.equal(backend.calls.filter(([name]) => name === 'confirm_generation').length, 1);
  await assert.rejects(() => session.submit(), /不能再次生成/);
  assert.equal(backend.calls.filter(([name]) => name === 'confirm_generation').length, 1); session.destroy();
});

test('an unconfirmed submission blocks retries instead of risking a second charge', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let submits = 0;
  const session = createDraftSession({ callTool: async name => {
    if (name === 'read_generation_draft') return result(initial());
    submits++; throw new Error('connection lost after request');
  } });
  session.receive(result(initial())); await assert.rejects(() => session.submit(), /connection lost/);
  assert.equal(session.state().uncertain, true);
  await assert.rejects(() => session.submit(), /不能再次生成/); assert.equal(submits, 1); session.destroy();
});

test('closing the card before its final read completes prevents a later submit', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let release, submits = 0;
  const session = createDraftSession({ callTool: async name => {
    if (name === 'read_generation_draft') { await new Promise(resolve => { release = resolve; }); return result(initial()); }
    submits++; const data = initial(); data.draft.status = 'submitted'; data.draft.revision++; return result(data);
  } });
  session.receive(result(initial())); const pending = session.submit(); await flush(); session.destroy(); release();
  await assert.rejects(() => pending, /关闭/); assert.equal(submits, 0);
});

test('editing defers remote replacement, visibility pauses reads, and destroy stops them', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const backend = server(), session = createDraftSession(backend); session.receive(result(backend.data));
  session.setEditing(true); const remote = initial(); remote.draft.revision = 2; remote.draft.prompt = 'Remote newest';
  backend.replace(remote); session.receive(result(remote)); assert.equal(session.state().local.prompt, 'Original');
  session.setEditing(false); assert.equal(session.state().local.prompt, 'Remote newest');
  session.setVisible(false); t.mock.timers.tick(12000); assert.equal(backend.calls.length, 0);
  session.setVisible(true); t.mock.timers.tick(4000); await flush(); assert.equal(backend.calls.length, 1);
  session.destroy(); t.mock.timers.tick(12000); assert.equal(backend.calls.length, 1);
});

test('draft context is published only when supported and never starts a chat reply', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const notes = [], session = createDraftSession({ callTool: async () => result(initial()), updateModelContext: async note => { notes.push(JSON.parse(note)); return {}; } });
  session.receive(result(initial())); await flush(); assert.deepEqual(notes, []);
  session.setCapabilities({ callTool: true, updateModelContext: true }); await flush();
  assert.deepEqual(notes, [{ cohubDraft: 'draft-1', revision: 1, model: 'example-image', status: 'draft', reviewPaused:false, prompt: 'Original' }]);
  session.receive(result(initial())); await flush(); assert.equal(notes.length, 1); session.destroy();
});

test('host context failures do not undo a saved draft and are still reported', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const session = createDraftSession({ callTool: async () => result(initial()), updateModelContext: () => { throw new Error('host unavailable'); } });
  session.receive(result(initial()));
  assert.doesNotThrow(() => session.setCapabilities({ callTool: true, updateModelContext: true }));
  await flush(); assert.equal(session.state().data.draft.revision, 1);
  assert.match(session.state().contextError, /host unavailable/); session.destroy();
});

test('weighted media and explicit upstream limitations remain visible in the shared draft', () => {
  const data = initial(); data.draft.media = [{ type: 'audio', source: { type: 'url', url: 'https://example.org/voice.mp3' }, meta: { weight: 0.6 } }]; data.limitations = ['Weighted blend is unavailable through this CLI'];
  const received = readComposerResult(result(data));
  assert.equal(received.draft.media[0].meta.weight, 0.6);
  assert.deepEqual(received.limitations, data.limitations);
});

test('same-revision task progress replaces the result and a terminal result stops polling', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); let reads = 0;
  const session = createDraftSession({ callTool: async () => { reads++; throw new Error('unexpected read'); } });
  const data = initial(); data.draft.status = 'submitted'; data.draft.taskRunId = 'task-1';
  data.generation = { kind: 'generation', id: 'task-1', spaceId: 'space-1', title: '作品', status: 'running', media: [], checkedAt: '2026-10-10T01:00:00Z' };
  session.receive(result(data)); data.generation.status = 'completed'; data.generation.media = [{ type: 'image', url: 'https://example.org/result.png' }];
  session.receive(result(data)); assert.equal(session.state().data.generation.media[0].url, 'https://example.org/result.png');
  t.mock.timers.tick(16000); assert.equal(reads, 0); session.destroy();
});

test('browser files exceeding 20 MiB or unsafe media are rejected before reading', async () => {
  await assert.rejects(() => readReferenceFile({ size: 20 * 1024 * 1024 + 1, type: 'image/png', name: 'large.png' }, 'image'), /20 MiB/);
  await assert.rejects(() => readReferenceFile({ size: 10, type: 'image/svg+xml', name: 'active.svg' }, 'image'), /请选择/);
  await assert.rejects(() => readReferenceFile({ size: 0, type: 'audio/mpeg', name: 'empty.mp3' }, 'audio'), /空文件/);
});

// Minimal DOM for the actual view's mode controls; draft behavior is tested above.
class ViewElement {
  constructor(tagName, ownerDocument) {
    Object.assign(this, { tagName, ownerDocument, children: [], dataset: {}, attributes: {}, className: '', hidden: false, disabled: false, _text: '', _value: undefined, listeners: new Map(), style: { setProperty() {}, removeProperty() {} } });
    const names = () => this.className.split(/\s+/).filter(Boolean);
    this.classList = {
      add: (...added) => { this.className = [...new Set([...names(), ...added])].join(' '); },
      remove: (...removed) => { this.className = names().filter(name => !removed.includes(name)).join(' '); },
      toggle: (name, force = !names().includes(name)) => { if (force) this.classList.add(name); else this.classList.remove(name); return force; },
      contains: name => names().includes(name),
    };
  }
  set innerHTML(html) {
    this.replaceChildren(); const stack = [this];
    for (const token of html.matchAll(/<\/?([a-z0-9]+)\b([^>]*)>|([^<]+)/g)) {
      if (token[3]) { stack.at(-1)._text += token[3]; continue; }
      if (token[0].startsWith('</')) { stack.pop(); continue; }
      const node = new ViewElement(token[1], this.ownerDocument);
      for (const [, key, value] of token[2].matchAll(/([\w-]+)="([^"]*)"/g)) node.setAttribute(key, value);
      stack.at(-1).append(node);
      if (!['input', 'img', 'br'].includes(node.tagName) && !token[2].trim().endsWith('/')) stack.push(node);
    }
  }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(node => node.textContent).join(''); }
  set value(value) { this._value = value; }
  get value() { return this._value ?? (this.tagName === 'select' ? this.querySelector('option')?.value : undefined) ?? ''; }
  append(...nodes) { this.children.push(...nodes); }
  prepend(...nodes) { this.children.unshift(...nodes); }
  replaceChildren(...nodes) { this._text = ''; this.children = nodes; }
  setAttribute(key, value) { this.attributes[key] = value; if (key === 'class') this.className = value; }
  removeAttribute(key) { delete this.attributes[key]; }
  addEventListener(name, listener) { this.listeners.set(name, [...(this.listeners.get(name) || []), listener]); }
  removeEventListener(name, listener) { this.listeners.set(name, (this.listeners.get(name) || []).filter(item => item !== listener)); }
  fire(name, event = {}) { for (const listener of this.listeners.get(name) || []) listener({ preventDefault() {}, stopPropagation() {}, ...event }); }
  focus() {}
  click() { if (!this.disabled) return this.fire('click'); }
  contains(node) { return this === node || this.children.some(child => child.contains(node)); }
  matches(selector) { return selector.split(',').some(part => { part = part.trim(); return part.startsWith('.') ? this.className.split(/\s+/).includes(part.slice(1)) : this.tagName === part; }); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) { return this.children.flatMap(node => [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]); }
}
function mountComposerView(transport = {}) {
  const doc = { hidden: false, activeElement: null, createElement: tag => new ViewElement(tag, doc), addEventListener() {}, removeEventListener() {} };
  const root = new ViewElement('main', doc), backend = server();
  const view = composer.mountComposer(root, { callTool: (...args) => backend.callTool(...args), ...transport });
  view.setCapabilities({ callTool: true, expand: true }); view.render(result(initial()));
  return { view, root, backend, find: selector => root.querySelector(selector) };
}

test('layout follows actual host display mode, never available width', () => {
  assert.equal(composer.composerLayoutMode(), 'inline');
  assert.equal(composer.composerLayoutMode({ displayMode: 'inline', containerDimensions: { width: 1600 } }), 'inline');
  assert.equal(composer.composerLayoutMode({ displayMode: 'fullscreen', containerDimensions: { width: 320 } }), 'expanded');
  assert.equal(composer.composerLayoutMode({ displayMode: 'pip' }), 'inline');
});

test('default inline form is compact and host context switches the same inputs', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { view, find } = mountComposerView(); t.after(() => view.destroy());
  const prompt = find('.composer-prompt-input');
  assert.equal(find('.cohub-composer').dataset.layout, 'inline');
  assert.equal(prompt.rows, 2);
  for (const selector of ['.composer-common', '.composer-settings', '.composer-references']) assert.equal(find(selector).hidden, true);
  view.setHostContext({ displayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen'] });
  assert.equal(find('.cohub-composer').dataset.layout, 'expanded');
  assert.equal(find('.composer-prompt-input'), prompt);
  assert.equal(prompt.rows, 4);
  for (const selector of ['.composer-common', '.composer-settings', '.composer-references']) assert.equal(find(selector).hidden, false);
  assert.equal(find('.composer-display-mode').textContent, '返回聊天');
  view.setHostContext({ theme: 'dark' });
  assert.equal(find('.cohub-composer').dataset.layout, 'expanded', 'theme notifications do not reset display mode');
});

test('expansion waits for host confirmation and returning retains unsaved text in the same draft', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const requests = []; let release;
  const { view, find, backend } = mountComposerView({ requestDisplayMode: mode => { requests.push(mode); return new Promise(resolve => { release = resolve; }); } }); t.after(() => view.destroy());
  view.setHostContext({ displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] });
  const prompt = find('.composer-prompt-input'); prompt.value = 'Keep my unfinished description'; prompt.fire('input'); await flush();
  find('.composer-display-mode').click(); await flush();
  assert.deepEqual(requests, ['fullscreen']);
  assert.equal(find('.cohub-composer').dataset.layout, 'inline');
  assert.equal(find('.composer-display-mode').disabled, true);
  release({ mode: 'fullscreen' }); await flush();
  assert.equal(find('.cohub-composer').dataset.layout, 'expanded');
  assert.equal(find('.composer-prompt-input'), prompt);
  assert.equal(prompt.value, 'Keep my unfinished description');
  find('.composer-display-mode').click(); await flush();
  assert.deepEqual(requests, ['fullscreen', 'inline']);
  release({ mode: 'inline' }); await flush();
  assert.equal(find('.cohub-composer').dataset.layout, 'inline');
  assert.equal(find('.composer-prompt-input'), prompt);
  t.mock.timers.tick(650); await flush();
  assert.equal(backend.data.draft.id, 'draft-1');
  assert.equal(backend.data.draft.prompt, 'Keep my unfinished description');
  assert.equal(backend.calls.filter(([name]) => name === 'confirm_generation').length, 0);
});

test('unsupported expansion and return are disabled without making a host request', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const requests = [], { view, find } = mountComposerView({ requestDisplayMode: async mode => { requests.push(mode); return { mode }; } }); t.after(() => view.destroy());
  view.setCapabilities({ callTool: true, expand: false });
  assert.equal(find('.composer-display-mode').disabled, true); find('.composer-display-mode').click(); await flush();
  view.setHostContext({ displayMode: 'fullscreen', availableDisplayModes: ['fullscreen'] });
  assert.equal(find('.composer-display-mode').textContent, '返回聊天');
  assert.equal(find('.composer-display-mode').disabled, true); find('.composer-display-mode').click(); await flush();
  assert.deepEqual(requests, []);
});

test('failed, invalid, or declined expansion stays honest and preserves editable input', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const response of [() => { throw new Error('Panel unavailable'); }, () => ({ displayMode: 'fullscreen' }), () => ({ mode: 'inline' })]) {
    const { view, find } = mountComposerView({ requestDisplayMode: response });
    const prompt = find('.composer-prompt-input'); prompt.value = 'Keep this text'; prompt.fire('input'); await flush();
    find('.composer-display-mode').click(); await flush();
    assert.equal(find('.cohub-composer').dataset.layout, 'inline');
    assert.equal(find('.composer-prompt-input'), prompt);
    assert.equal(prompt.value, 'Keep this text');
    assert.match(find('.composer-feedback').textContent, /无法展开|未能展开/);
    assert.doesNotMatch(find('.composer-feedback').textContent, /重试保存/);
    assert.equal(find('.composer-display-mode').disabled, false);
    view.destroy();
  }
});

test('inline validation points to expanded editing while still blocking invalid generation', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { view, find } = mountComposerView(); t.after(() => view.destroy());
  const data = initial(); data.validation.errors = [{ path: 'parameters.duration', message: '时长不支持' }]; view.render(result(data));
  assert.equal(find('.composer-common').hidden, true);
  assert.match(find('.composer-feedback').textContent, /时长不支持/);
  assert.match(find('.composer-feedback').textContent, /展开编辑/);
  assert.equal(find('.composer-generate').disabled, true);
});

test('validation kinds are limited to the known value', () => {
  const data = initial(); data.validation.errors = [{ path: 'prompt', message: '请输入生成内容', kind: 'missing' }];
  assert.equal(readComposerResult(result(data)).validation.errors[0].kind, 'missing');
  data.validation.errors[0].kind = 'cosmetic';
  assert.throws(() => readComposerResult(result(data)), /校验/);
});

test('a fresh draft says what is still needed instead of raising an error', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { view, find } = mountComposerView(); t.after(() => view.destroy());
  const data = initial(); data.draft.prompt = ''; data.validation.errors = [{ path: 'prompt', message: '请输入生成内容', kind: 'missing' }];
  view.render(result(data));
  assert.equal(find('.composer-feedback').querySelectorAll('.composer-notice--error').length, 0);
  assert.match(find('.composer-feedback').textContent, /描述/);
  assert.equal(find('.composer-generate').disabled, true);
});

test('an invalid value is shown as an error next to the action', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { view, find } = mountComposerView(); t.after(() => view.destroy());
  const data = initial(); data.validation.errors = [{ path: 'parameters.duration', message: '不得大于 15' }];
  view.render(result(data));
  const errors = find('.composer-feedback').querySelectorAll('.composer-notice--error');
  assert.equal(errors.length, 1);
  assert.match(errors[0].textContent, /时长/);
  assert.doesNotMatch(errors[0].textContent, /parameters/);
});

test('saved state reads as plain language without internal revision numbers', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { view, find } = mountComposerView(); t.after(() => view.destroy());
  assert.equal(find('.composer-save-state').textContent, '已保存');
});

test('Command or Control + Enter in the description generates once; plain Enter and IME input do not', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { view, find, backend } = mountComposerView(); t.after(() => view.destroy());
  const submits = () => backend.calls.filter(([name]) => name === 'confirm_generation').length;
  const prompt = find('.composer-prompt-input');
  prompt.fire('keydown', { key: 'Enter' }); await flush();
  prompt.fire('keydown', { key: 'Enter', metaKey: true, isComposing: true }); await flush();
  assert.equal(submits(), 0);
  let prevented = false;
  prompt.fire('keydown', { key: 'Enter', metaKey: true, preventDefault() { prevented = true; } }); await flush(); await flush();
  assert.equal(prevented, true);
  assert.equal(submits(), 1);
  prompt.fire('keydown', { key: 'Enter', ctrlKey: true }); await flush(); await flush();
  assert.equal(submits(), 1, 'a submitted draft is never sent again');
});

test('the keyboard shortcut respects the same blocks as the Generate button', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { view, find, backend } = mountComposerView(); t.after(() => view.destroy());
  const data = initial(); data.validation.errors = [{ path: 'prompt', message: '请输入生成内容', kind: 'missing' }]; view.render(result(data));
  find('.composer-prompt-input').fire('keydown', { key: 'Enter', metaKey: true }); await flush(); await flush();
  assert.equal(backend.calls.filter(([name]) => name === 'confirm_generation').length, 0);
});

test('enumerated settings are direct choices that save to the shared draft', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { view, find, backend } = mountComposerView(); t.after(() => view.destroy());
  const data = initial(); data.model = { ...data.model, parameters: { ratio: { type: 'string', optional: true, default: '16:9', enum: ['16:9', '9:16', '1:1'] } } };
  backend.replace(data); view.render(result(data));
  view.setHostContext({ displayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen'] });
  const segments = find('.composer-common').querySelectorAll('.composer-segment');
  assert.deepEqual(segments.map(node => node.textContent), ['16:9', '9:16', '1:1']);
  assert.equal(segments[0].attributes['aria-checked'], 'true', 'the declared default is shown as the current choice');
  segments[1].click(); t.mock.timers.tick(650); await flush();
  assert.deepEqual(backend.data.draft.parameters, { ratio: '9:16' });
  assert.equal(backend.calls.filter(([name]) => name === 'confirm_generation').length, 0);
});

test('dropped or pasted files map only to a media type the selected model accepts', () => {
  const inputs = [{ type: 'text' }, { type: 'image' }, { type: 'video' }];
  assert.equal(composer.referenceTypeForFile({ type: 'image/png' }, inputs), 'image');
  assert.equal(composer.referenceTypeForFile({ type: 'video/mp4' }, inputs), 'video');
  assert.throws(() => composer.referenceTypeForFile({ type: 'audio/mpeg' }, inputs), /不支持/);
  assert.throws(() => composer.referenceTypeForFile({ type: 'image/svg+xml' }, inputs), /不支持/);
  assert.throws(() => composer.referenceTypeForFile({ type: '' }, inputs), /不支持/);
});

test('a required media role is preset only when the next one is unambiguous', () => {
  const frames = { type: 'image', roles: ['first_frame', 'last_frame'], roleRequired: true };
  assert.equal(composer.defaultRoleFor(frames, []), 'first_frame');
  assert.equal(composer.defaultRoleFor(frames, [{ type: 'image', meta: { role: 'first_frame' } }]), 'last_frame');
  assert.equal(composer.defaultRoleFor(frames, [{ type: 'image', meta: { role: 'first_frame' } }, { type: 'image', meta: { role: 'last_frame' } }]), undefined);
  assert.equal(composer.defaultRoleFor({ type: 'video', roles: ['reference_video'], roleRequired: true }, []), 'reference_video');
  assert.equal(composer.defaultRoleFor({ type: 'image', roles: ['first_frame', 'reference_image'] }, []), undefined, 'optional roles stay unset');
  assert.equal(composer.defaultRoleFor({ type: 'image' }, []), undefined);
});

test('price summary estimates per-second video cost from the chosen duration and labels other units plainly', () => {
  const duration = { duration: { type: 'integer', default: 5, min: 1, max: 15 } };
  assert.deepEqual(composer.priceSummary({ unit: 'second', amount: 0.04 }, duration, {}), { estimate: '≈ $0.20', unit: '$0.04/秒' });
  assert.deepEqual(composer.priceSummary({ unit: 'second', min: 0.126, max: 0.168 }, duration, { duration: 10 }), { estimate: '≈ $1.26–1.68', unit: '$0.126–0.168/秒' });
  assert.deepEqual(composer.priceSummary({ unit: 'image', amount: 0.01 }, {}, {}), { estimate: null, unit: '$0.01/张' });
  assert.deepEqual(composer.priceSummary({ unit: '1m_tokens', amount: 140 }, {}, {}), { estimate: null, unit: '$140/百万 tokens' });
  assert.deepEqual(composer.priceSummary({ unit: 'second', amount: 0.1 }, { duration: { type: 'integer', min: -1, max: 30 } }, { duration: -1 }), { estimate: null, unit: '$0.10/秒' });
  assert.equal(composer.priceSummary(undefined, {}, {}), null);
});

test('aspect ratios come from declared ratio or size values and never from guesses', () => {
  assert.equal(composer.aspectOf('16:9'), 16 / 9);
  assert.equal(composer.aspectOf('1536x1024'), 1.5);
  assert.equal(composer.aspectOf('768*1344'), 768 / 1344);
  for (const value of ['auto', 'adaptive', '768P', '', undefined, '0:9', '16:0']) assert.equal(composer.aspectOf(value), null);
});

test('a save rejected for an old revision loads the newer draft at once and asks how to continue', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const session = createDraftSession({ callTool: async name => {
    calls.push(name);
    if (name === 'update_generation_draft') return { isError: true, content: [{ type: 'text', text: 'REVISION_CONFLICT: 内容已更新，请读取最新草稿后合并。' }], _meta: { code: 'REVISION_CONFLICT', currentRevision: 2 } };
    const data = initial(); data.draft.revision = 2; data.draft.prompt = 'Agent edit'; return result(data);
  } });
  session.receive(result(initial())); session.edit({ prompt: 'Mine' });
  await assert.rejects(() => session.save(), /内容已更新/);
  await flush();
  assert.deepEqual(calls, ['update_generation_draft', 'read_generation_draft'], 'no 4 second wait for the next poll');
  assert.equal(session.state().conflict.draft.revision, 2);
  assert.equal(session.state().local.prompt, 'Mine');
  assert.doesNotMatch(session.state().error, /REVISION_CONFLICT/);
  assert.equal(calls.filter(name => name === 'confirm_generation').length, 0);
  session.destroy();
});
