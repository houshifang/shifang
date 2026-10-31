const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/pages/home.js'), 'utf8');
const flush = () => new Promise((resolve) => setImmediate(resolve));

function createPage({ reducedMotion = false, supportsDecode = true, readyState = "loading", fireDomReady = true } = {}) {
  class Surface {
    constructor() { this.events = new Map(); this.children = []; }
    addEventListener(type, callback) {
      const callbacks = this.events.get(type) || [];
      callbacks.push(callback);
      this.events.set(type, callbacks);
    }
    emit(type, event = {}) {
      for (const callback of this.events.get(type) || []) callback(event);
    }
    appendChild(node) { this.children.push(node); node.parent = this; }
    remove() {
      if (this.parent) this.parent.children = this.parent.children.filter((node) => node !== this);
      this.parent = null;
    }
  }
  const images = [];
  class FakeImage extends Surface {
    constructor() {
      super();
      this.complete = false;
      this.naturalWidth = 0;
      this.decodeWaiters = [];
      this.srcWrites = 0;
      this.classList = { add() {}, remove() {}, toggle() {} };
      if (!supportsDecode) this.decode = undefined;
      images.push(this);
    }
    set src(value) { this.url = value; this.srcWrites += 1; }
    get src() { return this.url || ''; }
    decode() {
      return new Promise((resolve, reject) => this.decodeWaiters.push({ resolve, reject }));
    }
    load() {
      this.complete = true;
      this.naturalWidth = 419;
      for (const waiter of this.decodeWaiters.splice(0)) waiter.resolve();
      this.onload?.();
    }
    fail() {
      this.complete = true;
      for (const waiter of this.decodeWaiters.splice(0)) waiter.reject(new Error('网络失败'));
      this.onerror?.(new Error('网络失败'));
    }
  }
  const hero = new Surface();
  hero.querySelectorAll = () => [];
  hero.querySelector = () => ({});
  hero.getBoundingClientRect = () => ({ left: 0, top: 0, right: 1000, bottom: 700 });
  const document = new Surface();
  document.hidden = false;
  document.readyState = readyState;
  document.querySelector = (selector) => selector === '.hero-section' ? hero : { classList: { toggle() {} } };
  document.querySelectorAll = () => [];
  const window = new Surface();
  window.innerWidth = 1200;
  window.scrollY = 0;
  window.matchMedia = (query) => ({ matches: query.includes('reduced-motion') ? reducedMotion : true });
  const timelines = [];
  const gsap = {
    utils: { random: () => 0 },
    set(node, values) { node.lastSet = values; },
    timeline(options = {}) {
      const timeline = {
        options,
        killed: false,
        from() { return this; },
        to(node) { this.target = node; return this; },
        kill() { this.killed = true; },
        complete() { options.onComplete?.(); },
      };
      timelines.push(timeline);
      return timeline;
    },
  };
  window.gsap = gsap;
  let time = 0;
  vm.runInNewContext(source, {
    document, window, gsap, Image: FakeImage,
    performance: { now: () => ++time },
  });
  if (fireDomReady) document.emit('DOMContentLoaded');
  const move = (x, y = 100) => hero.emit('pointermove', { clientX: x, clientY: y });
  return { hero, document, window, images, timelines, move };
}

test('慢加载时不播放空白图片，图片就绪后在最新指针位置出现', async () => {
  const page = createPage();
  page.move(100);
  page.move(230);
  assert.equal(page.hero.children.length, 0);
  assert.equal(page.timelines.length, 1, '此时只有标题动画');
  page.images[1].load();
  await flush();
  assert.equal(page.hero.children.length, 1);
  assert.equal(page.hero.children[0], page.images[1]);
  assert.equal(page.hero.children[0].lastSet.x, 230);
});

test('不依赖 pointerenter，第一下移动即可显示已就绪图片', async () => {
  const page = createPage();
  page.images[0].load();
  await flush();
  assert.equal(page.hero.children.length, 0);
  page.move(10);
  assert.equal(page.hero.children.length, 1);
});

test('动画结束后复用同一节点，不重新请求图片', async () => {
  const page = createPage();
  page.images[0].load();
  await flush();
  page.move(20);
  page.move(220);
  assert.equal(page.hero.children.length, 1, '正在播放的节点不会被抢走');
  page.timelines.at(-1).complete();
  assert.equal(page.hero.children.length, 0);
  page.move(420);
  assert.equal(page.hero.children[0], page.images[0]);
  assert.equal(page.images[0].srcWrites, 1);
  assert.equal(page.images.length, 14, '移动指针不再创建新的图片节点');
});

test('首批图片失败后仍加载后续图片，后台请求最多同时启动两个', async () => {
  const page = createPage();
  assert.equal(page.images.filter((image) => image.src).length, 3);
  page.move(180);
  page.images.slice(0, 3).forEach((image) => image.fail());
  await flush();
  assert.equal(page.images.filter((image) => image.src).length, 5);
  page.images[3].load();
  await flush();
  assert.equal(page.hero.children[0], page.images[3]);
  assert.equal(page.images.filter((image) => image.src).length, 6);
});

test('指针离开后图片才解码完成，不出现滞后的拖尾', async () => {
  const page = createPage();
  page.move(100);
  page.hero.emit('pointerleave');
  page.images[0].load();
  await flush();
  assert.equal(page.hero.children.length, 0);
});

test('返回缓存页面时清理旧动画，重新解码后无需移出再移入即可出现', async () => {
  const page = createPage();
  page.images[0].load();
  await flush();
  page.move(30);
  const oldTimeline = page.timelines.at(-1);
  page.window.emit('pagehide');
  assert.equal(oldTimeline.killed, true);
  assert.equal(page.hero.children.length, 0);
  page.window.emit('pageshow', { persisted: true });
  page.move(350);
  assert.equal(page.hero.children.length, 0);
  page.images[0].load();
  await flush();
  assert.equal(page.hero.children[0].lastSet.x, 350);
  assert.equal(page.images[0].srcWrites, 1, '缓存恢复不重新设置图片地址');
  assert.equal(page.timelines.filter((timeline) => !timeline.options.onComplete).length, 1, '不重播标题动画');
});

test('首次 pageshow 不会打断用户已经触发的拖尾', async () => {
  const page = createPage();
  page.images[0].load();
  await flush();
  page.move(30);
  page.window.emit('pageshow', { persisted: false });
  assert.equal(page.hero.children.length, 1);
});

test('不支持 decode 时等待 load，仍可显示拖尾', async () => {
  const page = createPage({ supportsDecode: false });
  page.move(100);
  assert.equal(page.hero.children.length, 0);
  page.images[0].load();
  await flush();
  assert.equal(page.hero.children.length, 1);
});

test('减少动态效果偏好下不准备或播放拖尾', () => {
  const page = createPage({ reducedMotion: true });
  page.move(100);
  assert.equal(page.images.length, 0);
  assert.equal(page.timelines.length, 0);
});

test('defer 执行时立即准备动效，不等待非关键脚本触发 DOMContentLoaded', () => {
  const page = createPage({ readyState: 'interactive', fireDomReady: false });
  assert.equal(page.images.filter((image) => image.src).length, 3);
  assert.equal(page.timelines.length, 1);
});
