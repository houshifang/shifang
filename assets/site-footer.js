/**
 * <site-footer> 自定义元素 —— 仕方个人作品集统一页脚组件
 *
 * 用法：在每个页面的 </body> 之前放 <site-footer></site-footer>，
 * 并在 <head> 或 body 末尾引入本脚本即可。
 *
 * 上半部分：基于 Matter.js 的「掉落英文词」物理画布；
 * 下半部分：原有的品牌 / 链接 / 版权信息。
 *
 * 物理效果在以下情况会被跳过：
 * - 用户开启了「减少动效」偏好；
 * - 触屏设备宽度过窄（< 480px），避免在小屏占用太多滚动空间；
 * - Matter.js CDN 加载失败时，自动降级为只显示一段静态文案。
 */

const MATTER_CDN = "https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js";

// 56 个英文词组成的「自我介绍」，统一字号 + 两种颜色：白色 + 粉色高亮。
const HIGHLIGHTS = new Set([
  "SHIFANG.", "UX", "AI", "DESIGNER", "BEIJING", "0→1", "CURSOR", "VIBE",
]);
const WORD_TEXTS = [
  "Hi", "I'm", "SHIFANG.", "a", "UX", "AI", "Product", "DESIGNER",
  "based", "in", "BEIJING", "with", "experience", "focused", "on", "products",
  "from", "0→1", "conversational", "interfaces", "generative", "UI",
  "image", "generation", "currently", "at", "CURSOR", "building", "VIBE",
  "coding", "workflows", "love", "crafting", "pixels", "exploring", "motion",
  "shipping", "ideas", "designing", "writing", "notes", "drawing",
  "inspiration", "art", "music", "interface", "details", "every", "pixel",
  "matters", "2026", "stay", "curious", "make", "good", "things",
];
const UNIFORM_SIZE = 36;
const WORDS = WORD_TEXTS.map((text) => {
  const highlight = HIGHLIGHTS.has(text);
  return {
    text,
    size: UNIFORM_SIZE,
    weight: highlight ? 600 : 400,
    highlight,
  };
});

const TEMPLATE = /* html */ `
  <footer class="site-footer" aria-hidden="true">
    <div class="site-footer-physics" data-physics-zone></div>
  </footer>
`;

let matterPromise = null;
function loadMatter() {
  if (window.Matter) return Promise.resolve(window.Matter);
  if (matterPromise) return matterPromise;
  matterPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = MATTER_CDN;
    s.async = true;
    s.onload = () => resolve(window.Matter);
    s.onerror = () => reject(new Error("Failed to load matter.js"));
    document.head.appendChild(s);
  });
  return matterPromise;
}

class SiteFooter extends HTMLElement {
  constructor() {
    super();
    this._raf = 0;
    this._cleanups = [];
  }

  connectedCallback() {
    this.innerHTML = TEMPLATE;
    this.zone = this.querySelector("[data-physics-zone]");
    if (!this.zone) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tooNarrow = window.innerWidth < 480;
    if (reduceMotion || tooNarrow) {
      this.zone.classList.add("is-disabled");
      return;
    }

    this._observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this._observer.disconnect();
          this._observer = null;
          this._init();
        }
      },
      { rootMargin: "200px 0px" }
    );
    this._observer.observe(this.zone);
  }

  disconnectedCallback() {
    this._observer?.disconnect();
    this._teardown();
  }

  async _init() {
    let Matter;
    try {
      Matter = await loadMatter();
    } catch (e) {
      console.warn("[site-footer]", e);
      this.zone.classList.add("is-disabled");
      return;
    }
    if (!this.isConnected) return;
    this._setupPhysics(Matter);
  }

  _setupPhysics(Matter) {
    const { Engine, World, Bodies, Runner, Mouse, MouseConstraint, Composite, Body } = Matter;

    const zone = this.zone;
    let rect = zone.getBoundingClientRect();
    let W = rect.width;
    let H = rect.height;
    if (W <= 0 || H <= 0) return;

    const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.0012 } });
    this._engine = engine;

    const wallOpts = { isStatic: true, render: { visible: false } };
    const wallThickness = 80;
    const buildWalls = (w, h) => [
      Bodies.rectangle(w / 2, h + wallThickness / 2 - 2, w * 2, wallThickness, wallOpts),
      Bodies.rectangle(-wallThickness / 2 + 2, h / 2, wallThickness, h * 2, wallOpts),
      Bodies.rectangle(w + wallThickness / 2 - 2, h / 2, wallThickness, h * 2, wallOpts),
      Bodies.rectangle(w / 2, -wallThickness / 2 - 200, w * 2, wallThickness, wallOpts),
    ];
    let walls = buildWalls(W, H);
    World.add(engine.world, walls);

    // 两遍法：先把所有 span 一次性塞进 DOM，强制一次 layout 后再批量测量、建 body。
    // 这样可以避免在每次 appendChild 后立即读 offsetWidth 触发的 layout 抖动，
    // 保证所有 span 拿到的尺寸都是「最终」尺寸。
    const fragment = document.createDocumentFragment();
    const spans = WORDS.map((word) => {
      const span = document.createElement("span");
      span.className = `word${word.highlight ? " word--bright" : ""}`;
      span.style.fontSize = `${word.size}px`;
      span.style.fontWeight = word.weight;
      span.textContent = word.text;
      fragment.appendChild(span);
      return span;
    });
    zone.appendChild(fragment);
    // 强制一次同步 layout，确保后面 getBoundingClientRect 是真实尺寸。
    void zone.offsetHeight;

    const wordBodies = [];
    let failedCount = 0;
    for (let i = 0; i < WORDS.length; i++) {
      const word = WORDS[i];
      const span = spans[i];
      try {
        const rect = span.getBoundingClientRect();
        const ww = Math.max(12, Math.round(rect.width) + 4);
        const hh = Math.max(12, Math.round(rect.height) + 2);

        const minX = ww / 2 + 8;
        const maxX = Math.max(minX + 1, W - ww / 2 - 8);
        const startX = minX + Math.random() * (maxX - minX);
        // 所有词都从「正上方一小段距离」掉下来，避免有些词起点在 -1000 以上等到天荒地老
        const startY = -30 - Math.random() * 220;

        const body = Bodies.rectangle(startX, startY, ww, hh, {
          restitution: 0.32,
          friction: 0.18,
          frictionAir: 0.012,
          density: 0.0014,
          angle: (Math.random() - 0.5) * 0.5,
          render: { visible: false },
        });

        wordBodies.push({ body, elem: span, w: ww, h: hh });
      } catch (err) {
        failedCount++;
        console.warn(`[site-footer] #${i} "${word.text}" failed:`, err && err.message);
        if (span && span.parentNode) span.remove();
      }
    }
    console.info(`[site-footer] ✓ ${wordBodies.length}/${WORDS.length} bodies (failed: ${failedCount})`);

    this._wordBodies = wordBodies;
    World.add(engine.world, wordBodies.map((b) => b.body));

    const mouse = Mouse.create(zone);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.16, damping: 0.08, render: { visible: false } },
    });
    mouse.element.removeEventListener("wheel", mouse.mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
    World.add(engine.world, mouseConstraint);
    this._mouseConstraint = mouseConstraint;

    const runner = Runner.create();
    Runner.run(runner, engine);
    this._runner = runner;

    const sync = () => {
      for (const wb of wordBodies) {
        const { x, y } = wb.body.position;
        wb.elem.style.transform = `translate3d(${x - wb.w / 2}px, ${y - wb.h / 2}px, 0) rotate(${wb.body.angle}rad)`;
      }
      this._raf = requestAnimationFrame(sync);
    };
    sync();

    const onResize = this._debounce(() => {
      const r = zone.getBoundingClientRect();
      const newW = r.width;
      const newH = r.height;
      if (newW <= 0 || newH <= 0) return;
      if (newW === W && newH === H) return;

      Composite.remove(engine.world, walls);
      walls = buildWalls(newW, newH);
      World.add(engine.world, walls);

      for (const wb of wordBodies) {
        if (wb.body.position.x > newW - wb.w / 2 - 4) {
          Body.setPosition(wb.body, { x: newW - wb.w / 2 - 4, y: wb.body.position.y });
        }
        if (wb.body.position.y > newH - wb.h / 2 - 4) {
          Body.setPosition(wb.body, { x: wb.body.position.x, y: newH - wb.h / 2 - 4 });
        }
      }
      W = newW;
      H = newH;
    }, 200);
    window.addEventListener("resize", onResize, { passive: true });
    this._cleanups.push(() => window.removeEventListener("resize", onResize));

    const ro = new ResizeObserver(onResize);
    ro.observe(zone);
    this._cleanups.push(() => ro.disconnect());

    this._cleanups.push(() => {
      cancelAnimationFrame(this._raf);
      Runner.stop(runner);
      World.clear(engine.world, false);
      Engine.clear(engine);
      for (const wb of wordBodies) wb.elem.remove();
    });
  }

  _teardown() {
    while (this._cleanups.length) {
      try { this._cleanups.pop()(); } catch (_) { /* noop */ }
    }
  }

  _debounce(fn, wait) {
    let t = 0;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }
}

if (!customElements.get("site-footer")) {
  customElements.define("site-footer", SiteFooter);
}
