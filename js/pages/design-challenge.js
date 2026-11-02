(() => {
  'use strict';
  const geometry = DesignChallengeGeometry;
  const viewport = document.getElementById('gallery-viewport');
  const world = document.getElementById('gallery-world');
  const dialog = document.getElementById('gallery-dialog');
  const preview = document.getElementById('gallery-image');
  const header = document.querySelector('.header');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const gsap = window.gsap;
  const cornerRadius = 16;
  const artworks = Array.from({ length: 50 }, (_, i) => ({
    src: `./assets/projects/dakafeng/${String(i + 1).padStart(2, '0')}.webp`,
    alt: `设计打卡，第 ${i + 1} 张作品`,
    ...geometry.position(i % geometry.columns, Math.floor(i / geometry.columns)),
  }));
  const state = { x: 0, y: 0, scale: 1 };
  let shown = { ...state };
  let frame = 0;
  let lastTime = 0;
  let lastRange = '';
  let activeIndex = 0;
  let drag = null;
  let suppressClick = false;
  let previousSize = null;
  let sourceCard = null;
  let closing = false;
  const visibleCards = new Map();
  const bounds = () => viewport.getBoundingClientRect();
  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

  function renderVisible() {
    const { width, height } = bounds();
    const range = geometry.visibleRange(shown, width, height);
    const signature = Object.values(range).join(',');
    if (signature === lastRange) return;
    lastRange = signature;
    const needed = new Set();
    for (let row = range.top; row <= range.bottom; row++) {
      for (let col = range.left; col <= range.right; col++) {
        const key = `${col},${row}`;
        needed.add(key);
        if (visibleCards.has(key)) continue;
        const position = geometry.position(col, row);
        const art = artworks[position.index];
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'gallery-artwork';
        card.tabIndex = -1;
        card.dataset.index = String(position.index);
        card.setAttribute('aria-label', art.alt);
        card.style.cssText = `left:${position.x}px;top:${position.y}px`;
        const image = document.createElement('img');
        image.src = art.src;
        image.alt = art.alt;
        image.width = 1440;
        image.height = 1920;
        image.decoding = 'async';
        image.draggable = false;
        card.append(image);
        world.append(card);
        visibleCards.set(key, card);
      }
    }
    for (const [key, card] of visibleCards) {
      if (!needed.has(key)) { card.remove(); visibleCards.delete(key); }
    }
  }

  function paint() {
    renderVisible();
    world.style.transform = `translate3d(${shown.x}px,${shown.y}px,0) scale(${shown.scale})`;
  }

  function animate(now) {
    frame = 0;
    const distance = Math.abs(state.x - shown.x) + Math.abs(state.y - shown.y) + Math.abs(state.scale - shown.scale) * 500;
    if (reducedMotion.matches || distance < .15) {
      shown = { ...state };
      paint();
      return;
    }
    const elapsed = Math.min(40, Math.max(1, now - lastTime));
    lastTime = now;
    const ease = 1 - Math.pow(drag?.moved ? .78 : .87, elapsed / 16.67);
    shown.x += (state.x - shown.x) * ease;
    shown.y += (state.y - shown.y) * ease;
    shown.scale += (state.scale - shown.scale) * ease;
    paint();
    frame = requestAnimationFrame(animate);
  }

  function update(instant = false) {
    if (instant || reducedMotion.matches) shown = { ...state };
    if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(animate); }
  }

  function home() {
    const { width, height } = bounds();
    state.scale = width <= 760 ? .66 : 1;
    state.x = width / 2 - geometry.width / 2 * state.scale;
    state.y = height / 2 - geometry.height / 2 * state.scale;
    update(true);
  }

  function zoomTo(value, px, py) {
    const { width, height } = bounds();
    px ??= width / 2;
    py ??= height / 2;
    const scale = clamp(value, .45, 1.7);
    const ratio = scale / state.scale;
    state.x = px - (px - state.x) * ratio;
    state.y = py - (py - state.y) * ratio;
    state.scale = scale;
    update();
  }

  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || drag) return;
    Object.assign(state, shown);
    drag = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      lastX: event.clientX, lastY: event.clientY, lastTime: performance.now(),
      vx: 0, vy: 0, startX: state.x, startY: state.y, moved: false,
    };
    suppressClick = false;
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 5) {
      drag.moved = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
    }
    if (!drag.moved) return;
    const now = performance.now(), dt = Math.max(8, now - drag.lastTime);
    drag.vx = drag.vx * .4 + (event.clientX - drag.lastX) / dt * .6;
    drag.vy = drag.vy * .4 + (event.clientY - drag.lastY) / dt * .6;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = now;
    state.x = drag.startX + dx;
    state.y = drag.startY + dy;
    update();
  });

  function finishDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    suppressClick = drag.moved;
    if (drag.moved && event.type === 'pointerup' && !reducedMotion.matches) {
      const idle = performance.now() - drag.lastTime;
      state.x += geometry.momentum(drag.vx, idle);
      state.y += geometry.momentum(drag.vy, idle);
      update();
    }
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    drag = null;
    viewport.classList.remove('is-dragging');
  }
  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);
  viewport.addEventListener('lostpointercapture', () => { drag = null; viewport.classList.remove('is-dragging'); });
  viewport.addEventListener('click', (event) => {
    if (suppressClick) { suppressClick = false; return; }
    const card = event.target.closest('.gallery-artwork');
    if (card) openArt(Number(card.dataset.index), card);
  });
  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds().height : 1;
    if (event.ctrlKey || event.metaKey) {
      const rect = bounds();
      zoomTo(state.scale * Math.exp(-event.deltaY * unit * .006), event.clientX - rect.left, event.clientY - rect.top);
    } else {
      state.x -= (event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX) * unit;
      state.y -= (event.shiftKey && !event.deltaX ? 0 : event.deltaY) * unit;
      update();
    }
  }, { passive: false });

  viewport.addEventListener('keydown', (event) => {
    const moves = { ArrowLeft: [150, 0], ArrowRight: [-150, 0], ArrowUp: [0, 150], ArrowDown: [0, -150] };
    if (moves[event.key]) {
      event.preventDefault();
      state.x += moves[event.key][0]; state.y += moves[event.key][1]; update();
    } else if (['+', '=', '-'].includes(event.key)) {
      event.preventDefault(); zoomTo(state.scale * (event.key === '-' ? .8 : 1.25));
    } else if (event.key === '0') {
      event.preventDefault(); home();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const { width, height } = bounds();
      const x = (width / 2 - shown.x) / shown.scale, y = (height / 2 - shown.y) / shown.scale;
      const nearest = artworks.reduce((best, art, index) => {
        const copy = geometry.nearestCopy(art, x, y);
        const distance = Math.hypot(copy.x + geometry.cardWidth / 2 - x, copy.y + geometry.cardHeight / 2 - y);
        return distance < best.distance ? { index, distance } : best;
      }, { index: 0, distance: Infinity });
      openArt(nearest.index);
    }
  });

  function setArt(index, crossfade = false) {
    if (closing) return;
    if (sourceCard) sourceCard.style.visibility = '';
    activeIndex = geometry.mod(index, artworks.length);
    preview.src = artworks[activeIndex].src;
    preview.alt = artworks[activeIndex].alt;
    sourceCard = findSource(activeIndex);
    if (sourceCard) sourceCard.style.visibility = 'hidden';
    if (crossfade && !reducedMotion.matches) {
      gsap.fromTo(preview, { autoAlpha: .45 }, { autoAlpha: 1, duration: .22, ease: 'power2.out', overwrite: 'auto' });
    }
  }
  function findSource(index) {
    const view = bounds();
    let nearest = null, distance = Infinity;
    for (const card of visibleCards.values()) {
      if (Number(card.dataset.index) !== index) continue;
      const rect = card.getBoundingClientRect();
      if (rect.right <= view.left || rect.bottom <= view.top || rect.left >= view.right || rect.top >= view.bottom) continue;
      const nextDistance = Math.hypot(rect.left + rect.width / 2 - view.left - view.width / 2, rect.top + rect.height / 2 - view.top - view.height / 2);
      if (nextDistance < distance) { nearest = card; distance = nextDistance; }
    }
    return nearest;
  }
  function previewLayout() {
    // The gallery sits below the site navigation; the modal occupies the full window.
    const { width, height } = dialog.getBoundingClientRect();
    const padding = width <= 760 ? 16 : 28;
    const ratio = (preview.naturalWidth || 3) / (preview.naturalHeight || 4);
    const w = Math.min(width - padding * 2, (height - padding * 2) * ratio);
    const h = w / ratio;
    preview.style.width = `${w}px`;
    preview.style.height = `${h}px`;
    return { width: w, height: h, x: (width - w) / 2, y: (height - h) / 2 };
  }
  function openArt(index, card = null) {
    if (dialog.open) return;
    // Freeze the gallery beneath the preview so the return position stays exact.
    Object.assign(state, shown);
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    closing = false;
    setArt(index);
    if (card && card !== sourceCard) {
      if (sourceCard) sourceCard.style.visibility = '';
      sourceCard = card;
      sourceCard.style.visibility = 'hidden';
    }
    const origin = sourceCard?.getBoundingClientRect();
    dialog.showModal();
    const layout = previewLayout();
    gsap.killTweensOf([preview, dialog]);
    gsap.set(dialog, { '--shade': 0 });
    gsap.to(dialog, { '--shade': .94, duration: reducedMotion.matches ? 0 : .4, ease: 'power2.out' });
    gsap.fromTo(preview, {
      x: origin?.left ?? layout.x,
      y: origin?.top ?? layout.y + 12,
      scaleX: origin ? origin.width / layout.width : .97,
      scaleY: origin ? origin.height / layout.height : .97,
      borderRadius: origin ? cornerRadius * shown.scale * layout.width / origin.width : cornerRadius,
      autoAlpha: origin ? 1 : 0,
    }, {
      x: layout.x, y: layout.y, scaleX: 1, scaleY: 1, borderRadius: cornerRadius, autoAlpha: 1,
      duration: reducedMotion.matches ? 0 : .62, ease: 'power3.inOut', overwrite: true,
    });
    dialog.focus({ preventScroll: true });
  }
  function closeArt() {
    if (!dialog.open || closing) return;
    closing = true;
    gsap.killTweensOf([preview, dialog]);
    const target = sourceCard?.isConnected ? sourceCard : findSource(activeIndex);
    const rect = target?.getBoundingClientRect();
    const w = parseFloat(preview.style.width), h = parseFloat(preview.style.height);
    gsap.to(dialog, { '--shade': 0, duration: reducedMotion.matches ? 0 : .38, ease: 'power2.inOut' });
    gsap.to(preview, {
      ...(rect ? { x: rect.left, y: rect.top, scaleX: rect.width / w, scaleY: rect.height / h, borderRadius: cornerRadius * shown.scale * w / rect.width } : { scaleX: .97, scaleY: .97, autoAlpha: 0 }),
      duration: reducedMotion.matches ? 0 : .44, ease: 'power3.inOut', overwrite: true,
      onComplete: () => dialog.close(),
    });
  }
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeArt(); });
  dialog.addEventListener('close', () => {
    gsap.killTweensOf([preview, dialog]);
    if (sourceCard) sourceCard.style.visibility = '';
    sourceCard = null;
    closing = false;
    gsap.set(preview, { clearProps: 'all' });
    viewport.focus({ preventScroll: true });
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); setArt(activeIndex + (event.key === 'ArrowLeft' ? -1 : 1), true);
    }
  });
  let swipeStart = null, swiped = false;
  dialog.addEventListener('click', () => { if (!swiped) closeArt(); swiped = false; });
  dialog.addEventListener('touchstart', (event) => {
    swiped = false;
    swipeStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  dialog.addEventListener('touchend', (event) => {
    if (!swipeStart) return;
    const dx = event.changedTouches[0].clientX - swipeStart.x, dy = event.changedTouches[0].clientY - swipeStart.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiped = true; setArt(activeIndex + (dx < 0 ? 1 : -1), true);
    }
    swipeStart = null;
  }, { passive: true });

  if (header) {
    new ResizeObserver(() => {
      document.documentElement.style.setProperty('--gallery-header-height', `${header.getBoundingClientRect().height}px`);
    }).observe(header);
  }

  new ResizeObserver(() => {
    const { width, height } = bounds();
    if (!width || !height) return;
    if (!previousSize || (width <= 760) !== (previousSize.width <= 760)) home();
    else {
      state.x += (width - previousSize.width) / 2;
      state.y += (height - previousSize.height) / 2;
      update(true);
    }
    previousSize = { width, height };
    if (dialog.open) {
      // A viewport resize changes the fitted image size; do not retain a stale transform.
      gsap.killTweensOf([preview, dialog]);
      if (closing) { dialog.close(); return; }
      const layout = previewLayout();
      gsap.set(preview, { x: layout.x, y: layout.y, scaleX: 1, scaleY: 1, borderRadius: cornerRadius, autoAlpha: 1 });
      gsap.set(dialog, { '--shade': .94 });
    }
  }).observe(viewport);
})();
