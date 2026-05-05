# 仕方 · UX & AI Product Designer

> UX·AI 产品设计师仕方的个人作品集与随手记。一个纯静态、零构建、可一键部署的小站。

## ✨ 主要内容

- **首页 (`index.html`)** — 个人介绍 + 7 个精选作品集，hero 区域有鼠标拖尾动画
- **关于 (`about.html`)** — 履历、技能、联系方式
- **随手记 (`notes.html`)** — 关于设计、AI 与生活的零散思考
- **设计打卡挑战 (`dakafeng.html`)** — 50 天设计打卡作品墙

## 🛠 技术栈

- 纯 HTML / CSS / JavaScript，无构建工具
- [GSAP](https://gsap.com/) — 入场动画 / 拖尾动画
- [Lenis](https://github.com/darkroomengineering/lenis) — 平滑滚动
- 通过 jsdelivr CDN 加载第三方库

## 📁 目录结构

```
.
├── index.html              # 首页
├── about.html              # 关于
├── notes.html              # 随手记
├── dakafeng.html           # 设计打卡详情
├── script.js               # 首页交互逻辑
├── about.js                # 关于页交互
├── notes.js                # 随手记页交互
├── dakafeng.js             # 打卡页交互
├── style.css               # 全局样式
├── scripts/
│   └── compress-images.py  # 图片压缩脚本（PNG/JPG → WebP）
└── assets/
    ├── ico.png             # favicon
    ├── cursor-pointer.svg  # 自定义光标
    ├── wechat-qr.webp      # 微信二维码
    ├── trail-01~14.webp    # 首页拖尾动画图
    └── projects/
        ├── *.webp          # 项目封面
        └── dakafeng/
            └── 01~50.webp  # 打卡作品图
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

## 🌐 部署

### 部署到 Netlify（推荐，最快）

1. 把项目推到 GitHub 仓库
2. 登录 [Netlify](https://www.netlify.com/) → New site from Git → 选择仓库
3. **Build command** 留空，**Publish directory** 填 `.`
4. Deploy，几秒后拿到 `*.netlify.app` 域名

### 部署到 GitHub Pages

1. 仓库 Settings → Pages
2. Source 选 `Deploy from a branch`
3. Branch 选 `main` / `(root)`
4. 几分钟后访问 `https://<你的用户名>.github.io/<仓库名>/`

> ⚠️ **部署后建议**：把 4 个 HTML 中 `og:image` 的相对路径换成完整 URL（例如 `https://your-domain.com/assets/ico.png`），微信、Twitter 等平台分享才能正确抓取预览图。

## 🖼 图片压缩脚本

项目自带一个 PNG/JPG → WebP 批量压缩脚本，依赖 Pillow：

```bash
# 安装依赖
python3 -m pip install --user Pillow

# 把要压缩的图片放进任意目录，然后：
python3 scripts/compress-images.py \
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
