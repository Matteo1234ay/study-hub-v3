import test from 'node:test';
import assert from 'node:assert/strict';
import { createScrollFollower } from '../src/home/scene/scroll-follower.js';

test('a full-page fling settles within four seconds without overshoot', () => {
  const follower = createScrollFollower();
  let previous = 0;
  for (let i = 0; i < 240; i++) {
    const value = follower.sample(1, 1 / 60);
    assert.ok(value >= previous && value <= 1);
    assert.ok((value - previous) * 60 <= .46);
    previous = value;
  }
  assert.ok(previous > .999);
});

test('60 and 120Hz give the same scroll position', () => {
  const a = createScrollFollower(), b = createScrollFollower();
  let x, y;
  for (let i = 0; i < 60; i++) x = a.sample(.6, 1 / 60);
  for (let i = 0; i < 120; i++) y = b.sample(.6, 1 / 120);
  assert.ok(Math.abs(x - y) < .000001);
});

test('reversing scroll settles at the new target and reduced motion is immediate', () => {
  const follower = createScrollFollower();
  for (let i = 0; i < 30; i++) follower.sample(1, 1 / 60);
  let value;
  for (let i = 0; i < 120; i++) {
    value = follower.sample(0, 1 / 60);
    assert.ok(value >= 0 && value < 1);
  }
  assert.ok(value < .0001);
  assert.equal(follower.sample(.8, 1 / 60, true), .8);
});
