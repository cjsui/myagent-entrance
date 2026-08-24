import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COPY, LINK_URLS } from '../src/content/copy.ts';

test('both languages define the same set of keys', () => {
  const enKeys = Object.keys(COPY.en).sort();
  const zhKeys = Object.keys(COPY.zh).sort();
  assert.deepEqual(enKeys, zhKeys);
});

test('both languages have exactly 4 identity tags', () => {
  assert.equal(COPY.en.tags.length, 4);
  assert.equal(COPY.zh.tags.length, 4);
});

test('both languages link to the same 3 URLs in the same order', () => {
  const enUrls = COPY.en.links.map((l) => l.url);
  const zhUrls = COPY.zh.links.map((l) => l.url);
  assert.deepEqual(enUrls, zhUrls);
  assert.deepEqual(enUrls, [LINK_URLS.ronsui, LINK_URLS.aisi, LINK_URLS.github]);
});

test('language toggle label points to the other language', () => {
  assert.equal(COPY.en.langToggleLabel, '中');
  assert.equal(COPY.zh.langToggleLabel, 'EN');
});
