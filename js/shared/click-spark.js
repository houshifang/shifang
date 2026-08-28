/**
 * <click-spark> 自定义元素
 * 来源：https://codepen.io/hexagoncircle/pen/bGZdWyw  by Ryan Mulligan
 *
 * 用法：
 *   <click-spark></click-spark>
 * 在它的「父元素」上监听 click，点击位置会绽放 8 条放射状的火花线条。
 * 默认颜色继承父元素的 color；可通过 CSS 变量 --click-spark-color 覆盖。
 */
class ClickSpark extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = this.createSpark();
    this.svg = this.shadowRoot.querySelector("svg");
    this._parent = this.parentNode;
    this._parent.addEventListener("click", this);
  }

  disconnectedCallback() {
    if (this._parent) {
      this._parent.removeEventListener("click", this);
      delete this._parent;
    }
  }

  handleEvent(e) {
    this.setSparkPosition(e);
    this.animateSpark();
  }

  animateSpark() {
    const sparks = [...this.svg.children];
    const size = parseInt(sparks[0].getAttribute("y1"));
    const offset = size / 2 + "px";

    const keyframes = (i) => {
      const deg = `calc(${i} * (360deg / ${sparks.length}))`;
      return [
        {
          strokeDashoffset: size * 3,
          transform: `rotate(${deg}) translateY(${offset})`
        },
        {
          strokeDashoffset: size,
          transform: `rotate(${deg}) translateY(0)`
        }
      ];
    };

    const options = {
      duration: 660,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      fill: "forwards"
    };

    sparks.forEach((spark, i) => spark.animate(keyframes(i), options));
  }

  setSparkPosition(e) {
    this.style.left = e.pageX - this.clientWidth / 2 + "px";
    this.style.top = e.pageY - this.clientHeight / 2 + "px";
  }

  createSpark() {
    return `
      <style>
        :host {
          position: absolute;
          pointer-events: none;
          z-index: 9999;
        }
      </style>
      <svg width="30" height="30" viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" stroke="var(--click-spark-color, currentcolor)" transform="rotate(-20)">
        ${Array.from(
          { length: 8 },
          () =>
            `<line x1="50" y1="30" x2="50" y2="4" stroke-dasharray="30" stroke-dashoffset="30" style="transform-origin: center" />`
        ).join("")}
      </svg>
    `;
  }
}

if (!customElements.get("click-spark")) {
  customElements.define("click-spark", ClickSpark);
}
