import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextTabIndex } from '../src/lib/tabs.ts';

test('arrow keys move and wrap around', () => {
  assert.equal(nextTabIndex(4, 'ArrowRight', 5), 0);
  assert.equal(nextTabIndex(0, 'ArrowLeft', 5), 4);
  assert.equal(nextTabIndex(2, 'ArrowRight', 5), 3);
});
test('Home and End jump to the ends', () => {
  assert.equal(nextTabIndex(3, 'Home', 5), 0);
  assert.equal(nextTabIndex(1, 'End', 5), 4);
});
test('other keys are ignored', () => {
  assert.equal(nextTabIndex(1, 'Enter', 5), null);
  assert.equal(nextTabIndex(1, 'a', 5), null);
});
