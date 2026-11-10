(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const initStickyHeader = () => {
    const header = document.querySelector(".header");
    if (!header) return;

    const SCROLL_THRESHOLD = 80;
    let ticking = false;

    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > SCROLL_THRESHOLD);
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  };

  const initSmoothScroll = () => {
    if (prefersReducedMotion || !window.Lenis || !window.matchMedia("(pointer: fine)").matches) return null;

    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.85,
      touchMultiplier: 1,
      smoothWheel: true,
    });

    if (window.gsap) {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }

    return lenis;
  };

  initStickyHeader();
  initSmoothScroll();
  window.initPageReveal?.(document.querySelector(".about-main"), [
    ".notes-intro > *",
    ".about-section-title",
    ".about-skill",
    ".about-timeline-item",
    ".about-creation-intro",
    ".about-press-item",
    ".about-social-intro",
    ".about-social-card",
    ".about-contact-list",
    ".about-qr",
    ".about-footer",
  ].join(", "));
})();
