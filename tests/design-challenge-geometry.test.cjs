const test = require('node:test');
const assert = require('node:assert/strict');
const g = require('../js/pages/design-challenge-geometry.js');

test('each repeat contains all 50 artworks, including in negative coordinates', () => {
  for (const [startCol, startRow] of [[0, 0], [-20, -15], [100, 200]]) {
    const indices = new Set();
    for (let row = startRow; row < startRow + g.rows; row++) {
      for (let col = startCol; col < startCol + g.columns; col++) {
        const p = g.position(col, row);
        assert.ok(p.index >= 0 && p.index < 50);
        indices.add(p.index);
      }
    }
    assert.equal(indices.size, 50);
  }
  assert.equal(g.position(-1, -1).index, 49);
});

test('positions repeat continuously with the same offsets across tile boundaries', () => {
  for (let row = -7; row < 7; row++) {
    for (let col = -12; col < 12; col++) {
      const a = g.position(col, row);
      const b = g.position(col + g.columns, row + g.rows);
      assert.equal(a.index, b.index);
      assert.ok(Math.abs(b.x - a.x - g.width) < 1e-9);
      assert.ok(Math.abs(b.y - a.y - g.height) < 1e-9);
    }
  }
});

test('virtualization stays bounded after long pans and covers the viewport', () => {
  for (const offset of [-1e7, -7000, 0, 7000, 1e7]) {
    for (const scale of [.45, .9, 1.7]) {
      const view = { x: offset, y: offset / 3, scale };
      const r = g.visibleRange(view, 1600, 800);
      const maxCards = (Math.ceil(1600 / scale / g.cellWidth) + 3) * (Math.ceil(800 / scale / g.cellHeight) + 3);
      assert.ok((r.right - r.left + 1) * (r.bottom - r.top + 1) <= maxCards);
      assert.ok(r.left * g.cellWidth <= -view.x / scale);
      assert.ok(r.right * g.cellWidth >= (1600 - view.x) / scale);
      assert.ok(r.top * g.cellHeight <= -view.y / scale);
      assert.ok(r.bottom * g.cellHeight >= (800 - view.y) / scale);
    }
  }
});

test('locating an artwork chooses a nearby copy after large pans', () => {
  const art = g.position(3, 2);
  for (const center of [[0, 0], [-120000, 75000], [999000, -888000]]) {
    const copy = g.nearestCopy(art, ...center);
    assert.ok(Math.abs(copy.x + g.cardWidth / 2 - center[0]) <= g.width / 2);
    assert.ok(Math.abs(copy.y + g.cardHeight / 2 - center[1]) <= g.height / 2);
    assert.ok(Math.abs((copy.x - art.x) / g.width - Math.round((copy.x - art.x) / g.width)) < 1e-8);
  }
});

test('inertia cancels stale velocity and limits fast flick distance', () => {
  assert.equal(g.momentum(3, 100), 0);
  assert.equal(g.momentum(1, 20), 180);
  assert.equal(g.momentum(100, 0), 650);
  assert.equal(g.momentum(-100, 0), -650);
});
