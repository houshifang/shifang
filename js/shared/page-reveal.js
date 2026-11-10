window.initPageReveal = (main, selector, {
  duration = 0.65,
  ease = 'power3.out',
  rootMargin = '0px 0px -24px 0px',
} = {}) => {
  const { gsap } = window;
  if (!main || !gsap || !('IntersectionObserver' in window)) return;

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', (context) => {
    const targets = Array.from(main.querySelectorAll(selector));
    const pending = new Set(targets);
    gsap.set(targets, { opacity: 0 });

    const reveal = context.add(null, (entries) => {
      const entering = [];
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting || !pending.delete(target)) continue;
        observer.unobserve(target);
        entering.push(target);
      }
      if (!entering.length) return;

      gsap.fromTo(entering, { opacity: 0, y: 16 }, {
        opacity: 1,
        y: 0,
        duration,
        ease,
        stagger: Math.min(0.05, 0.22 / entering.length),
        clearProps: 'opacity,transform',
      });
    });

    const observer = new IntersectionObserver(reveal, { rootMargin });
    targets.forEach((target) => observer.observe(target));

    const showOnFocus = (event) => {
      const target = event.target.closest(selector);
      if (!target) return;
      pending.delete(target);
      observer.unobserve(target);
      gsap.killTweensOf(target);
      target.style.removeProperty('opacity');
      target.style.removeProperty('transform');
    };
    main.addEventListener('focusin', showOnFocus);

    return () => {
      observer.disconnect();
      main.removeEventListener('focusin', showOnFocus);
    };
  });
};

window.initArticleReveal = (main, selector) => window.initPageReveal(main, selector, {
  duration: 1,
  ease: 'power1.out',
  rootMargin: '0px 0px -200px 0px',
});
