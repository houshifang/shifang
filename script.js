document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero-section");
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

  if (!hero || !window.gsap || prefersReducedMotion) return;

  const initCursorFollower = () => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const covers = document.querySelectorAll(".project-cover");
    if (!covers.length) return;

    const cursor = document.createElement("div");
    cursor.className = "cursor-follower";
    document.body.appendChild(cursor);

    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

    const xTo = gsap.quickTo(cursor, "x", {
      duration: 0.36,
      ease: "power2.out",
    });
    const yTo = gsap.quickTo(cursor, "y", {
      duration: 0.36,
      ease: "power2.out",
    });

    window.addEventListener("pointermove", (event) => {
      cursor.classList.add("is-visible");
      xTo(event.clientX);
      yTo(event.clientY);
    });

    document.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-visible", "is-project");
    });

    covers.forEach((cover) => {
      cover.addEventListener("pointerenter", () => {
        cursor.classList.add("is-project");
      });

      cover.addEventListener("pointerleave", () => {
        cursor.classList.remove("is-project");
      });
    });
  };

  initCursorFollower();

  const initSmoothScroll = () => {
    if (!window.Lenis || !window.matchMedia("(pointer: fine)").matches) return null;

    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.85,
      touchMultiplier: 1,
      smoothWheel: true,
    });

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return lenis;
  };

  initSmoothScroll();

  const playIntroAnimation = () => {
    const titleLetters = hero.querySelectorAll(".title-letter");
    const dot = hero.querySelector(".dot");
    const header = document.querySelector(".header");
    const description = hero.querySelector(".hero-description");

    gsap
      .timeline({
        defaults: {
          ease: "power4.out",
        },
      })
      .from(titleLetters, {
        yPercent: 110,
        autoAlpha: 0,
        filter: "blur(16px)",
        duration: 1.1,
        stagger: 0.055,
        clearProps: "filter",
      })
      .from(
        dot,
        {
          scale: 0,
          autoAlpha: 0,
          duration: 0.55,
          ease: "back.out(1.8)",
        },
        "-=0.35"
      )
      .from(
        [header, description],
        {
          y: 16,
          autoAlpha: 0,
          duration: 0.8,
          stagger: 0.08,
        },
        "-=0.55"
      );
  };

  playIntroAnimation();

  const isMobile = window.innerWidth <= 768;
  const config = {
    // 数值越大，鼠标需要移动更远才生成下一张图片，拖尾会更稀疏。
    mouseThreshold: isMobile ? 22 : 100,
    minImageSize: isMobile ? 120 : 160,
    maxImageSize: isMobile ? 240 : 340,
    // 数值越小，图片停留时间越短，画面也会更轻。
    lifespan: 0.1,
    inDuration: 0.45,
    outDuration: 0.65,
    speedSmoothing: 0.25,
  };

  const images = [
    "./assets/trail-01.webp",
    "./assets/trail-02.webp",
    "./assets/trail-03.webp",
    "./assets/trail-04.webp",
    "./assets/trail-05.webp",
    "./assets/trail-06.webp",
    "./assets/trail-07.webp",
    "./assets/trail-08.webp",
    "./assets/trail-09.webp",
    "./assets/trail-10.webp",
    "./assets/trail-11.webp",
    "./assets/trail-12.webp",
    "./assets/trail-13.webp",
    "./assets/trail-14.webp",
  ];

  // 触屏设备根本不会触发拖尾，避免浪费用户流量
  if (window.matchMedia("(pointer: fine)").matches) {
    const preloadTrailImages = () => {
      images.forEach((src) => {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
      });
    };

    const idle =
      window.requestIdleCallback ||
      ((cb) => setTimeout(cb, 200));
    idle(preloadTrailImages, { timeout: 1500 });
  }

  let imageIndex = 0;
  let lastX = 0;
  let lastY = 0;
  let lastTime = performance.now();
  let smoothedSpeed = 0;
  let maxSpeed = 0.5;
  let hasPointer = false;

  const getRelativePoint = (event) => {
    const rect = hero.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const getSpeed = (x, y) => {
    const now = performance.now();
    const distance = Math.hypot(x - lastX, y - lastY);
    const delta = Math.max(now - lastTime, 16);
    const rawSpeed = distance / delta;

    maxSpeed = Math.max(maxSpeed, rawSpeed);
    smoothedSpeed =
      smoothedSpeed * (1 - config.speedSmoothing) +
      Math.min(rawSpeed / maxSpeed, 1) * config.speedSmoothing;

    lastTime = now;
    return smoothedSpeed;
  };

  const createTrailImage = (x, y, speed) => {
    const img = document.createElement("img");
    const imageSize =
      config.minImageSize + (config.maxImageSize - config.minImageSize) * speed;
    const rotation = gsap.utils.random(-28, 28) * (1 + speed);

    img.className = "trail-img";
    img.src = images[imageIndex];
    img.alt = "";
    img.decoding = "async";
    imageIndex = (imageIndex + 1) % images.length;
    hero.appendChild(img);

    gsap.set(img, {
      x,
      y,
      xPercent: -50,
      yPercent: -50,
      width: imageSize,
      height: "auto",
      rotation,
      scale: 0,
      autoAlpha: 0,
    });

    gsap
      .timeline({ onComplete: () => img.remove() })
      .to(img, {
        scale: 1,
        autoAlpha: 1,
        duration: config.inDuration,
        ease: "power3.out",
      })
      .to(
        img,
        {
          scale: 0,
          rotation: rotation + 180,
          autoAlpha: 0,
          duration: config.outDuration,
          ease: "power3.inOut",
        },
        `+=${config.lifespan}`
      );
  };

  hero.addEventListener("pointerenter", (event) => {
    const point = getRelativePoint(event);
    lastX = point.x;
    lastY = point.y;
    lastTime = performance.now();
    hasPointer = true;
  });

  hero.addEventListener("pointerleave", () => {
    hasPointer = false;
  });

  hero.addEventListener("pointermove", (event) => {
    const point = getRelativePoint(event);
    const distance = Math.hypot(point.x - lastX, point.y - lastY);

    if (!hasPointer || distance < config.mouseThreshold) return;

    const speed = getSpeed(point.x, point.y);
    createTrailImage(point.x, point.y, speed);
    lastX = point.x;
    lastY = point.y;
  });
});
