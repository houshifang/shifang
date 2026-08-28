document.addEventListener("DOMContentLoaded", () => {
  const marquee = document.querySelector(".quality-marquee");
  const track = document.querySelector(".quality-marquee__track");
  const firstGroup = document.querySelector(".quality-marquee__group");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!marquee || !track || !firstGroup || prefersReducedMotion) return;

  let offset = 0;
  let lastTime = performance.now();
  let currentSpeed = 42;
  const normalSpeed = 42;
  const hoverSpeed = 20;
  const easing = 0.08;

  const getLoopWidth = () => {
    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;
    return firstGroup.getBoundingClientRect().width + gap;
  };

  let loopWidth = getLoopWidth();

  const updateLoopWidth = () => {
    loopWidth = getLoopWidth();
    if (loopWidth > 0) {
      offset %= loopWidth;
    }
  };

  window.addEventListener("resize", updateLoopWidth, { passive: true });
  window.addEventListener("load", updateLoopWidth, { once: true });

  const tick = (time) => {
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    const targetSpeed = marquee.matches(":hover") ? hoverSpeed : normalSpeed;
    currentSpeed += (targetSpeed - currentSpeed) * easing;

    if (loopWidth > 0) {
      offset = (offset + currentSpeed * delta) % loopWidth;
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    }

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
});
