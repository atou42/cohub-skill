import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile} from 'node:fs/promises';

test('bundled SDK is inserted literally and leaves no card placeholders',async()=>{
  await promisify(execFile)(process.execPath,['scripts/build.mjs'],{cwd:new URL('../',import.meta.url)});
  const html=await readFile(new URL('../dist/card.html',import.meta.url),'utf8');
  assert.ok(html.includes('<script type="module">'));
  assert.ok(html.includes('<style>'));
  assert.ok(!html.includes('<!--CARD_'));
  assert.equal((html.match(/<html /g)||[]).length,1);
});

test('Cohub fonts and tokens are embedded once, with no unresolved style markers',async()=>{
  await promisify(execFile)(process.execPath,['scripts/build.mjs'],{cwd:new URL('../',import.meta.url)});
  const html=await readFile(new URL('../dist/card.html',import.meta.url),'utf8');
  assert.equal((html.match(/font-family:"Geist";/g)||[]).length,1);
  assert.equal((html.match(/font-family:"Geist Mono";/g)||[]).length,1);
  assert.ok(html.includes('--brand: oklch(60% .2 30)'),'Cohub dark brand token is present');
  assert.ok(!html.includes('/*COHUB_FONTS*/'));
});
