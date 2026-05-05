document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const initStickyHeader = () => {
    const header = document.querySelector(".header");
    if (!header) return;

    const SCROLL_THRESHOLD = 80;
    let ticking = false;

    const update = () => {
      const scrolled = window.scrollY > SCROLL_THRESHOLD;
      header.classList.toggle("is-scrolled", scrolled);
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

  initStickyHeader();

  const initSmoothScroll = () => {
    if (!window.Lenis || !window.matchMedia("(pointer: fine)").matches) return null;

    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.85,
      touchMultiplier: 1,
      smoothWheel: true,
    });

    if (window.gsap) {
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
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

  initSmoothScroll();

  if (prefersReducedMotion || !window.gsap) return;

  const intro = document.querySelector(".notes-intro");
  const articles = gsap.utils.toArray(".note-article");

  if (intro) {
    gsap.from(intro.children, {
      y: 28,
      autoAlpha: 0,
      duration: 0.85,
      ease: "power3.out",
      stagger: 0.08,
    });
  }

  if (articles.length) {
    articles.forEach((article, index) => {
      gsap.from(article, {
        y: 24,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.out",
        delay: 0.4 + Math.min(index, 4) * 0.06,
      });
    });
  }
});
