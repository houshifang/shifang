const initHomePage = () => {
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
    mouseThreshold: isMobile ? 22 : 100,
    minImageSize: isMobile ? 120 : 160,
    maxImageSize: isMobile ? 240 : 340,
    lifespan: 0.1,
    inDuration: 0.45,
    outDuration: 0.65,
    speedSmoothing: 0.25,
  };

  // 更换图片时同步更新内容版本，并保持首页的三张 preload 地址一致。
  const images = [
    "./assets/trail/trail-01.webp?v=7ace4409b0",
    "./assets/trail/trail-02.webp?v=7fc4281157",
    "./assets/trail/trail-03.webp?v=d3f55e3195",
    "./assets/trail/trail-04.webp?v=0f6dc4b8c5",
    "./assets/trail/trail-05.webp?v=31b20356bb",
    "./assets/trail/trail-06.webp?v=4453688261",
    "./assets/trail/trail-07.webp?v=99d0fefa53",
    "./assets/trail/trail-08.webp?v=094ca3a6e3",
    "./assets/trail/trail-09.webp?v=f556a21b57",
    "./assets/trail/trail-10.webp?v=80c7dce472",
    "./assets/trail/trail-11.webp?v=48816e1523",
    "./assets/trail/trail-12.webp?v=3393a94455",
    "./assets/trail/trail-13.webp?v=958442ca9e",
    "./assets/trail/trail-14.webp?v=c79cf0052b",
  ];
  const initialImageCount = 3;
  const entries = images.map((src) => {
    const image = new Image();
    image.className = "trail-img";
    image.alt = "";
    image.decoding = "async";
    image.loading = "eager";
    return { src, image, ready: false, pending: null, timeline: null };
  });

  let imageIndex = 0;
  let lastX = 0;
  let lastY = 0;
  let lastTime = performance.now();
  let smoothedSpeed = 0;
  let maxSpeed = 0.5;
  let hasPointer = false;
  let needsFirstImage = true;
  let latestPointer = null;

  const getRelativePoint = (event) => {
    const rect = hero.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      inside:
        event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom,
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

  const releaseImage = (entry) => {
    entry.image.remove();
    entry.timeline = null;
  };

  const createTrailImage = (x, y, speed) => {
    // 只使用已解码、且没有正在播放的节点；不会对空白图片启动动画。
    let entry;
    for (let offset = 0; offset < entries.length; offset += 1) {
      const index = (imageIndex + offset) % entries.length;
      if (entries[index].ready && !entries[index].timeline) {
        entry = entries[index];
        imageIndex = (index + 1) % entries.length;
        break;
      }
    }
    if (!entry) return false;

    const imageSize =
      config.minImageSize + (config.maxImageSize - config.minImageSize) * speed;
    const rotation = gsap.utils.random(-28, 28) * (1 + speed);
    const img = entry.image;
    gsap.set(img, {
      x, y,
      xPercent: -50,
      yPercent: -50,
      width: imageSize,
      height: "auto",
      rotation,
      scale: 0,
      autoAlpha: 0,
    });
    hero.appendChild(img);
    entry.timeline = gsap
      .timeline({ onComplete: () => releaseImage(entry) })
      .to(img, {
        scale: 1,
        autoAlpha: 1,
        duration: config.inDuration,
        ease: "power3.out",
      })
      .to(img, {
        scale: 0,
        rotation: rotation + 180,
        autoAlpha: 0,
        duration: config.outDuration,
        ease: "power3.inOut",
      }, `+=${config.lifespan}`);
    needsFirstImage = false;
    return true;
  };

  const showPendingFirstImage = () => {
    if (!needsFirstImage || !hasPointer || !latestPointer || document.hidden) return;
    const point = getRelativePoint(latestPointer);
    if (!point.inside) return;
    if (createTrailImage(point.x, point.y, 0)) {
      lastX = point.x;
      lastY = point.y;
      lastTime = performance.now();
    }
  };

  const prepareImage = (entry, priority = "low", refresh = false) => {
    if (entry.pending) return entry.pending;
    if (entry.ready && !refresh) return Promise.resolve(true);
    entry.ready = false;
    entry.pending = (async () => {
      const img = entry.image;
      img.fetchPriority = priority;
      if (typeof img.decode === "function") {
        if (!img.src) img.src = entry.src;
        await img.decode();
      } else if (!(img.complete && img.naturalWidth > 0)) {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          if (!img.src) img.src = entry.src;
        });
      }
      if (!img.naturalWidth) throw new Error("拖尾图片不可用");
      entry.ready = true;
      showPendingFirstImage();
      return true;
    })().catch(() => false).finally(() => {
      entry.pending = null;
    });
    return entry.pending;
  };

  const resetTrail = () => {
    hasPointer = false;
    needsFirstImage = true;
    latestPointer = null;
    lastX = 0;
    lastY = 0;
    smoothedSpeed = 0;
    maxSpeed = 0.5;
    lastTime = performance.now();
    entries.forEach((entry) => {
      if (entry.timeline) entry.timeline.kill();
      releaseImage(entry);
    });
  };

  hero.addEventListener("pointerenter", () => {
    hasPointer = false;
    needsFirstImage = true;
  });
  hero.addEventListener("pointerleave", () => {
    hasPointer = false;
    needsFirstImage = true;
    latestPointer = null;
  });
  hero.addEventListener("pointermove", (event) => {
    const point = getRelativePoint(event);
    if (!point.inside || document.hidden) return;
    latestPointer = { clientX: event.clientX, clientY: event.clientY };
    if (!hasPointer) {
      hasPointer = true;
      lastX = point.x;
      lastY = point.y;
      lastTime = performance.now();
    }
    const distance = Math.hypot(point.x - lastX, point.y - lastY);
    if (!needsFirstImage && distance < config.mouseThreshold) return;
    if (createTrailImage(point.x, point.y, getSpeed(point.x, point.y))) {
      lastX = point.x;
      lastY = point.y;
    }
  });

  window.addEventListener("pagehide", resetTrail);
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    resetTrail();
    // 恢复页面时只重新解码已经下载的图片，不重新设置 src 或重播进场动画。
    entries.forEach((entry) => {
      if (entry.image.complete && entry.image.naturalWidth > 0) {
        prepareImage(entry, "low", true);
      }
    });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetTrail();
  });

  // 前三张优先就绪；余下图片用两个后台任务逐步加载，避免挤占脚本与首屏资源。
  Promise.allSettled(entries.slice(0, initialImageCount).map((entry, index) =>
    prepareImage(entry, index === 0 ? "high" : "auto")
  )).then(async () => {
    const queue = entries.slice(initialImageCount);
    const warmNext = async () => {
      while (queue.length) await prepareImage(queue.shift());
    };
    await Promise.all([warmNext(), warmNext()]);
  });
};

// defer 脚本执行时 DOM 已可用，无需再等待其他非关键脚本触发 DOMContentLoaded。
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomePage, { once: true });
} else {
  initHomePage();
}
