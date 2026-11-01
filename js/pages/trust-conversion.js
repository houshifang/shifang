// 页内目录独立于长文的入场动画与平滑滚动，原生锚点负责跳转和历史记录。
(() => {
  const toc = document.querySelector(".trust-toc");
  if (!toc) return;

  const details = toc.querySelector("details");
  const currentLabel = toc.querySelector(".trust-toc-current");
  const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
  const sections = links.map((link) => document.getElementById(link.hash.slice(1)));
  const compact = window.matchMedia("(max-width: 85.999rem)");

  const syncLayout = () => {
    details.open = !compact.matches;
  };
  syncLayout();
  compact.addEventListener("change", syncLayout);

  let activeIndex = -1;
  const updateCurrent = () => {
    const readingLine = compact.matches ? 168 : 128;
    let nextIndex = 0;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= readingLine) nextIndex = index;
    });
    if (nextIndex === activeIndex) return;
    activeIndex = nextIndex;
    links.forEach((link, index) => {
      if (index === activeIndex) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    currentLabel.textContent = links[activeIndex].lastChild.textContent.trim();
  };

  let scheduled = false;
  const scheduleUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      updateCurrent();
    });
  };
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("hashchange", scheduleUpdate);
  window.addEventListener("load", scheduleUpdate);
  // 延迟加载图片、展开研究附录也会改变章节位置。
  new ResizeObserver(scheduleUpdate).observe(document.querySelector(".quality-article"));

  links.forEach((link, index) => {
    link.addEventListener("click", () => {
      if (compact.matches) details.open = false;
      const heading = sections[index].querySelector("h2");
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });
  });
  updateCurrent();
})();
