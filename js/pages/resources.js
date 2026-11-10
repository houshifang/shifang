(() => {
  const controls = document.querySelector('.resources-controls');
  if (!controls) return;

  const initSmoothScroll = () => {
    if (!window.Lenis || !window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

    const lenis = new window.Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.85,
      touchMultiplier: 1,
      smoothWheel: true,
    });
    const raf = (time) => {
      lenis.raf(time);
      window.requestAnimationFrame(raf);
    };
    window.requestAnimationFrame(raf);
    return lenis;
  };
  const lenis = initSmoothScroll();

  const buttons = Array.from(document.querySelectorAll('.resources-filters button'));
  const reset = document.querySelector('.resources-reset');
  const empty = document.querySelector('.resources-empty');
  const count = document.getElementById('resources-count');
  const items = Array.from(document.querySelectorAll('.resource-item')).map((element) => ({
    element,
    format: element.dataset.format,
  }));
  const selected = new Set();
  controls.hidden = false;

  const update = () => {
    let visible = 0;
    items.forEach(({ element, format }) => {
      const matches = !selected.size || selected.has(format);
      element.hidden = !matches;
      if (matches) visible++;
    });
    count.textContent = visible === items.length ? `共 ${items.length} 个资源` : `${visible} / ${items.length} 个资源`;
    empty.hidden = visible !== 0;
    reset.disabled = !selected.size;
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(selected.has(button.dataset.format))));
    // 筛选会改变列表高度，立即同步可滚动范围。
    lenis?.resize();
  };

  const clear = () => {
    selected.clear();
    update();
    buttons[0].focus();
  };
  buttons.forEach((button) => button.addEventListener('click', () => {
    const format = button.dataset.format;
    if (selected.has(format)) selected.delete(format);
    else selected.add(format);
    update();
  }));
  reset.addEventListener('click', clear);
  empty.querySelector('button').addEventListener('click', clear);
  window.addEventListener('pageshow', update);
  update();

  window.initPageReveal?.(document.querySelector('.resources-main'),
    '.resources-intro > *, .resources-section-heading, .resources-controls, .resource-link');

  const header = document.querySelector('.header');
  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 80);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
})();
