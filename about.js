document.addEventListener("DOMContentLoaded", () => {
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
    if (!window.Lenis || !window.matchMedia("(pointer: fine)").matches) return null;

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

  const initIntroAnimation = () => {
    if (prefersReducedMotion || !window.gsap) return;

    const intro = document.querySelector(".notes-intro");
    if (!intro) return;

    gsap.from(intro.children, {
      y: 28,
      autoAlpha: 0,
      duration: 0.85,
      ease: "power3.out",
      stagger: 0.08,
    });
  };

  const initRevealOnScroll = () => {
    const targets = document.querySelectorAll(
      ".about-stats, .about-section, .about-contact"
    );
    if (!targets.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.05,
      }
    );

    targets.forEach((el) => observer.observe(el));
  };

  initStickyHeader();
  initSmoothScroll();
  initIntroAnimation();
  initRevealOnScroll();
});
