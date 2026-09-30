import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const editions = [
  'skills/cohub/references/app-developer/management.md',
  'zh-CN/skills/cohub/references/app-developer/运行与管理.md',
];
const sources = editions.map(path => {
  const document = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const examples = [...document.matchAll(/```js\n([\s\S]*?)\n```/g)]
    .map(([, code]) => code).filter(code => code.includes('async function authorizeGenerationTarget('));
  assert.equal(examples.length, 1, `Expected one authorization example in ${path}`);
  return examples[0];
});

function runExample(source, target, response) {
  const authorize = new Function(source + '\nreturn authorizeGenerationTarget;')();
  const client = {
    auth: {
      async authorize(request) {
        assert.deepEqual(request, {
          target,
          scopes: ['generation.create', 'taskrun.view'],
          reason: 'Generate media in the selected Space and read the result.',
          fallback: 'none',
        });
        if (response instanceof Error) throw response;
        return response;
      },
    },
  };
  return authorize(client, target);
}

test('both authorization examples use the selected target rather than the App home Space', async () => {
  assert.equal(sources[0], sources[1]);
  for (const source of sources) {
    const response = { status: 'granted', target: { kind: 'space', spaceId: 'selected-space' } };
    assert.equal(await runExample(source, { kind: 'pick-space' }, response), 'selected-space');
    assert.equal(await runExample(source, { kind: 'space', spaceId: 'selected-space' }, response), 'selected-space');
  }
});

test('authorization cancellation stops the action and denial does not return a target', async () => {
  for (const source of sources) {
    const target = { kind: 'pick-space' };
    assert.equal(await runExample(source, target, { status: 'cancelled' }), null);
    await assert.rejects(runExample(source, target, { status: 'denied', code: 'not_authorized' }), /Authorization denied/);
  }
});

test('fixed destinations reject changed targets and malformed grants without a fallback', async () => {
  for (const source of sources) {
    const target = { kind: 'space', spaceId: 'requested-space' };
    await assert.rejects(runExample(source, target, { status: 'granted', target: { kind: 'space', spaceId: 'different-space' } }), /different Space/);
    await assert.rejects(runExample(source, target, { status: 'granted', target: { kind: 'account' } }), /Space grant/);
    await assert.rejects(runExample(source, target, { status: 'granted' }));
    for (const spaceId of [undefined, '', '   ']) {
      await assert.rejects(runExample(source, { kind: 'pick-space' }, { status: 'granted', target: { kind: 'space', spaceId } }), /Space grant/);
    }
    const error = new Error('Host does not support structured authorization');
    await assert.rejects(runExample(source, target, error), error);
  }
});
