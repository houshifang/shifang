document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TOTAL_IMAGES = 50;
  const IMAGES = Array.from({ length: TOTAL_IMAGES }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  const ASSET_BASE = "./assets/projects/dakafeng/";
  const buildSrc = (name) => `${ASSET_BASE}${name}.webp`;
  const buildAlt = (name) => `设计打卡挑战 - 第 ${Number(name)} 张`;

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

  const renderGrid = () => {
    const grid = document.getElementById("dakafeng-grid");
    if (!grid) return [];

    const fragment = document.createDocumentFragment();
    const items = [];

    IMAGES.forEach((name, index) => {
      const figure = document.createElement("figure");
      figure.className = "dakafeng-item";
      figure.dataset.index = String(index);

      const img = document.createElement("img");
      img.src = buildSrc(name);
      img.alt = buildAlt(name);
      img.loading = "lazy";
      img.decoding = "async";
      img.draggable = false;

      figure.appendChild(img);
      fragment.appendChild(figure);
      items.push(figure);
    });

    grid.appendChild(fragment);
    return items;
  };

  const initRevealAnimation = (items) => {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
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

    items.forEach((el) => observer.observe(el));
  };

  const initLightbox = (items) => {
    if (!items.length) return;

    const overlay = document.createElement("div");
    overlay.className = "dakafeng-lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "图片预览");
    overlay.innerHTML = `
      <button type="button" class="dakafeng-lightbox-btn dakafeng-lightbox-close" aria-label="关闭">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      </button>
      <button type="button" class="dakafeng-lightbox-btn dakafeng-lightbox-prev" aria-label="上一张">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <button type="button" class="dakafeng-lightbox-btn dakafeng-lightbox-next" aria-label="下一张">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
      <figure class="dakafeng-lightbox-stage">
        <img alt="" />
        <figcaption class="dakafeng-lightbox-counter"></figcaption>
      </figure>
    `;
    document.body.appendChild(overlay);

    const stageImg = overlay.querySelector(".dakafeng-lightbox-stage img");
    const counter = overlay.querySelector(".dakafeng-lightbox-counter");
    const btnClose = overlay.querySelector(".dakafeng-lightbox-close");
    const btnPrev = overlay.querySelector(".dakafeng-lightbox-prev");
    const btnNext = overlay.querySelector(".dakafeng-lightbox-next");

    let activeIndex = -1;
    let lastFocused = null;

    const setIndex = (index) => {
      const total = IMAGES.length;
      activeIndex = (index + total) % total;
      const name = IMAGES[activeIndex];
      stageImg.src = buildSrc(name);
      stageImg.alt = buildAlt(name);
      counter.textContent = `${activeIndex + 1} / ${total}`;
    };

    const open = (index) => {
      lastFocused = document.activeElement;
      setIndex(index);
      overlay.classList.add("is-open");
      document.documentElement.classList.add("is-lightbox-open");
      btnClose.focus({ preventScroll: true });
    };

    const close = () => {
      overlay.classList.remove("is-open");
      document.documentElement.classList.remove("is-lightbox-open");
      stageImg.removeAttribute("src");
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus({ preventScroll: true });
      }
    };

    items.forEach((figure) => {
      figure.addEventListener("click", () => {
        const index = Number(figure.dataset.index);
        if (Number.isFinite(index)) open(index);
      });
    });

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", (event) => {
      event.stopPropagation();
      setIndex(activeIndex - 1);
    });
    btnNext.addEventListener("click", (event) => {
      event.stopPropagation();
      setIndex(activeIndex + 1);
    });

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.classList.contains("dakafeng-lightbox-stage")) {
        close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!overlay.classList.contains("is-open")) return;
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") setIndex(activeIndex - 1);
      else if (event.key === "ArrowRight") setIndex(activeIndex + 1);
    });
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

  initStickyHeader();
  initSmoothScroll();
  const items = renderGrid();
  initRevealAnimation(items);
  initLightbox(items);
  initIntroAnimation();
});
