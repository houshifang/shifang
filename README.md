# 仕方 · UX & AI Product Designer

> UX·AI 产品设计师仕方的个人作品集与随手记。一个纯静态、零构建、可一键部署的小站。

## ✨ 主要内容

- **首页 (`index.html`)** — 个人介绍 + 9 个精选作品集，hero 区域有鼠标拖尾动画
- **从工具到服务 (`trust-conversion.html`)** — AI 建站首次付费体验设计复盘
- **AI 审美进化 (`ai-design-evolution.html`)** — 生成质量实验与落地复盘
- **关于 (`about.html`)** — 履历、技能、联系方式
- **资源 (`resources.html`)** — 111 个设计与开发收藏，按工具、灵感、学习、行业四类组织，支持多选筛选
- **随手记 (`notes.html`)** — 关于设计、AI 与生活的零散思考
- **设计打卡挑战 (`design-challenge.html`)** — 带全站导航的全屏循环画廊，支持拖拽惯性与图片展开预览

## 🛠 技术栈

- 纯 HTML / CSS / JavaScript，无构建工具
- [GSAP](https://gsap.com/) — 入场动画 / 拖尾动画 / 画廊预览过渡
- [Lenis](https://github.com/darkroomengineering/lenis) — 平滑滚动
- 第三方库保存在 `assets/vendor/`，页面可直接本地运行

## 📁 目录结构

```
.
├── index.html              # 首页
├── about.html              # 关于
├── notes.html              # 随手记
├── resources.html          # 资源收藏
├── design-challenge.html   # 全屏设计画廊，保留原页面地址
├── ai-design-evolution.html # AI 审美进化复盘
├── trust-conversion.html  # AI 建站付费体验设计复盘
├── css/
│   ├── style.css           # 全局样式
│   ├── design-challenge.css # 画廊布局与导航适配
│   ├── trust-conversion.css # 付费体验复盘补充样式
│   └── resources.css       # 资源列表与筛选样式
├── js/
│   ├── pages/             # 各页面交互逻辑
│   │   ├── home.js
│   │   ├── about.js
│   │   ├── notes.js
│   │   ├── design-challenge.js # 画廊拖拽、缩放与预览动画
│   │   ├── design-challenge-geometry.js # 循环网格与惯性计算
│   │   ├── ai-design-evolution.js
│   │   ├── trust-conversion.js # 长文章节目录
│   │   └── resources.js    # 资源筛选与平滑滚动
│   └── shared/            # 跨页面共用交互
│       ├── click-spark.js
│       ├── site-nav.js
│       ├── site-footer.js
│       └── trail-images.js # 首页拖尾与全站页脚共用的图片
├── tests/
│   ├── home-trail.test.cjs # 首页动效回归检查
│   └── design-challenge-geometry.test.cjs # 画廊几何与惯性检查
├── tools/
│   └── compress-images.py # 图片压缩工具（PNG/JPG → WebP）
└── assets/
    ├── site/               # favicon、光标、微信二维码
    ├── trail/              # 首页拖尾动画图
    ├── vendor/             # GSAP、Lenis
    └── projects/
        ├── *.webp          # 项目封面
        ├── dakafeng/       # 01~50.webp 打卡作品图
        ├── web-design-quality/
        └── trust-conversion/
```

## 🚀 本地运行

不需要构建。任意一个静态服务器即可：

```bash
# 方案 1：Python（推荐）
python3 -m http.server 5500

# 方案 2：Node
npx serve .

# 方案 3：VS Code 用 Live Server 插件
```

打开浏览器访问 `http://localhost:5500` 即可。

## 首页动效检查

```bash
node --test tests/home-trail.test.cjs
```

覆盖图片慢加载、加载失败、快速移动连续出图、独立节点清理、页面返回与减少动态效果偏好。首页脚本与拖尾图片使用带版本的 URL。更换拖尾图片时，在 `js/shared/trail-images.js` 更新地址，前三张同时更新 `index.html` 的预加载链接。修改首页脚本时更新它在 `index.html` 中的版本。

## 设计画廊维护

正式入口仍是 `design-challenge.html`，首页作品卡片无需改链接。导航复用全站 `.header` 样式和 `js/shared/site-nav.js`，画廊区域随导航实际高度调整；预览使用原生 dialog 覆盖整个窗口。

- 样式：`css/design-challenge.css`，作品宽 250px，16px 平滑圆角；不支持 `corner-shape` 时保留普通圆角。
- 交互：`js/pages/design-challenge.js`，负责虚拟渲染、拖拽、缩放和 GSAP 展开收起。
- 几何：`js/pages/design-challenge-geometry.js`，负责循环编号、位置与松手惯性。
- 资源：复用 `assets/projects/dakafeng/01~50.webp` 与 `assets/vendor/gsap.min.js`；画廊不加载 Lenis。

滚轮跟随保留约 0.13、拖拽跟随约 0.22 的每帧缓动（按 60fps 折算，并适配刷新率）；惯性距离为速度 × 180，单轴上限 650px。

检查循环网格与惯性：

```bash
node --test tests/design-challenge-geometry.test.cjs
```

## 🌐 部署

当前使用 GitHub Pages：仓库为 `houshifang/shifang`，发布源为 `main` 分支根目录。推送到 `main` 后会自动执行 `pages build and deployment`，无需构建命令。

线上地址：[https://houshifang.github.io/shifang/](https://houshifang.github.io/shifang/)。发布结果可在仓库的 Actions 中查看。

项目也可由任意静态托管服务运行，发布目录为根目录。

> ⚠️ **部署后建议**：把各个 HTML 页面中的 `og:image` 的相对路径换成完整 URL（例如 `https://your-domain.com/assets/site/ico.png`），微信、Twitter 等平台分享才能正确抓取预览图。

## 🖼 图片压缩脚本

项目自带一个 PNG/JPG → WebP 批量压缩脚本，依赖 Pillow：

```bash
# 安装依赖
python3 -m pip install --user Pillow

# 把要压缩的图片放进任意目录，然后：
python3 tools/compress-images.py \
  --input  /path/to/source \
  --output ./assets/projects \
  --quality 90 \
  --force
```

参数说明：
- `--quality 0-100`：质量，默认 90（肉眼几乎无损）
- `--method 0-6`：压缩努力级别，默认 6（最高，体积最小）
- `--force`：覆盖已存在的 WebP 文件

通常压缩率在 **80%~94%**，体积大幅减少。

## 📜 浏览器兼容

- 现代浏览器：Chrome / Edge / Safari / Firefox 最新版均支持
- WebP / `aspect-ratio` / `clamp()` 等特性已广泛支持，不再需要 polyfill

## 🤝 联系

- Twitter：[@faaaannng](https://x.com/faaaannng)
- Email：5909068@qq.com

---

**Designed & coded by 仕方** · ©2026
