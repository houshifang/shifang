/**
 * <site-footer> 自定义元素 —— 仕方个人作品集统一页脚组件
 *
 * 用法：在每个页面的 </body> 之前放 <site-footer></site-footer>，
 * 并在 <head> 或 body 末尾引入本脚本即可。
 *
 * 先引入 trail-images.js，由 Matter.js 模拟文字和拖尾图片的掉落。
 *
 * 物理效果在以下情况会被跳过：
 * - 用户开启了「减少动效」偏好；
 * - 视口宽度小于 480px，避免在小屏占用太多滚动空间；
 * - Matter.js CDN 加载失败时，隐藏动画区域。
 */

const MATTER_CDN = "https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js";

const WORDS = [
  "Hi", "I'm", "SHIFANG.", "a", "UX", "AI", "Product", "DESIGNER", "based", "in",
  "BEIJING", "experience", "products", "0→1", "conversational", "interfaces", "generative", "UI",
  "image", "generation", "CURSOR", "building", "VIBE", "coding", "workflows", "love",
  "crafting", "pixels", "exploring", "motion", "ideas", "designing", "writing", "notes",
  "inspiration", "art", "2026", "stay", "curious", "make", "good", "things",
];
const PICTURE_WIDTHS = [162, 110, 104, 176, 115, 104, 154, 101, 113, 106, 120, 101, 94, 106];

function loadFooterPicture(src, index) {
  return new Promise((resolve) => {
    const image = new Image();
    image.className = "footer-picture";
    image.alt = "";
    image.draggable = false;
    image.onload = () => {
      const width = PICTURE_WIDTHS[index] ?? 110;
      image.width = width;
      image.height = Math.round(width * image.naturalHeight / image.naturalWidth);
      resolve(image);
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

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
    const zone = this.zone;
    const sources = window.siteTrailImages ?? [];
    let Matter;
    let pictures;
    try {
      [Matter, pictures] = await Promise.all([
        loadMatter(),
        Promise.all(sources.map(loadFooterPicture)),
      ]);
    } catch (e) {
      console.warn("[site-footer]", e);
      zone.classList.add("is-disabled");
      return;
    }
    if (!this.isConnected || this.zone !== zone) return;
    this._setupPhysics(Matter, pictures.filter(Boolean));
  }

  _setupPhysics(Matter, pictures) {
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
    const ceilingOffset = 420;
    const buildWalls = (w, h) => [
      Bodies.rectangle(w / 2, h + wallThickness / 2 - 2, w * 2, wallThickness, wallOpts),
      Bodies.rectangle(-wallThickness / 2 + 2, h / 2, wallThickness, h * 2, wallOpts),
      Bodies.rectangle(w + wallThickness / 2 - 2, h / 2, wallThickness, h * 2, wallOpts),
      Bodies.rectangle(w / 2, -wallThickness / 2 - ceilingOffset, w * 2, wallThickness, wallOpts),
    ];
    let walls = buildWalls(W, H);
    World.add(engine.world, walls);

    // 两遍法：先插入全部元素，强制一次 layout 后再批量测量、创建刚体。
    // 这样可以避免在每次 appendChild 后立即读 offsetWidth 触发的 layout 抖动，
    // 保证所有 span 拿到的尺寸都是「最终」尺寸。
    const fragment = document.createDocumentFragment();
    const pieces = WORDS.map((word) => {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = word;
      return span;
    });
    pieces.push(...pictures);
    fragment.append(...pieces);
    zone.appendChild(fragment);
    // 强制一次同步 layout，确保后面 getBoundingClientRect 是真实尺寸。
    void zone.offsetHeight;

    const pieceBodies = [];
    let failedCount = 0;
    for (const [i, elem] of pieces.entries()) {
      try {
        const rect = elem.getBoundingClientRect();
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

        pieceBodies.push({ body, elem, w: ww, h: hh });
      } catch (err) {
        failedCount++;
        console.warn(`[site-footer] piece #${i} failed:`, err && err.message);
        elem.remove();
      }
    }
    console.info(`[site-footer] ✓ ${pieceBodies.length}/${pieces.length} bodies (failed: ${failedCount})`);

    World.add(engine.world, pieceBodies.map((b) => b.body));

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
      for (const wb of pieceBodies) {
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

      for (const wb of pieceBodies) {
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
      for (const wb of pieceBodies) wb.elem.remove();
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
