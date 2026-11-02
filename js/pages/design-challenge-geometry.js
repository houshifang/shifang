/* Shared geometry for the repeating gallery; usable in the browser and Node checks. */
(() => {
  const columns = 10, rows = 5, cellWidth = 270, cellHeight = 354;
  const cardWidth = 250, cardHeight = cardWidth * 4 / 3;
  const width = columns * cellWidth, height = rows * cellHeight;
  const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;
  function position(col, row) {
    const c = mod(col, columns), r = mod(row, rows);
    return {
      index: r * columns + c,
      x: col * cellWidth,
      y: row * cellHeight + (c % 2) * cellHeight / 2,
    };
  }
  function visibleRange(view, viewportWidth, viewportHeight) {
    return {
      left: Math.floor(-view.x / view.scale / cellWidth) - 1,
      right: Math.ceil((viewportWidth - view.x) / view.scale / cellWidth),
      top: Math.floor(-view.y / view.scale / cellHeight) - 1,
      bottom: Math.ceil((viewportHeight - view.y) / view.scale / cellHeight),
    };
  }
  function nearestCopy(art, centerX, centerY) {
    return {
      x: art.x + Math.round((centerX - art.x - cardWidth / 2) / width) * width,
      y: art.y + Math.round((centerY - art.y - cardHeight / 2) / height) * height,
    };
  }
  function momentum(velocity, idleMs) {
    // A pause before release cancels stale velocity; distance is limited even on fast flicks.
    return idleMs > 90 ? 0 : Math.max(-650, Math.min(650, velocity * 180));
  }
  const geometry = { columns, rows, cellWidth, cellHeight, cardWidth, cardHeight, width, height, mod, position, visibleRange, nearestCopy, momentum };
  globalThis.DesignChallengeGeometry = geometry;
  if (typeof module !== 'undefined' && module.exports) module.exports = geometry;
})();
