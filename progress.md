# Progress Log: Astro Blog Migration

## Session Started: 2026-03-02

### Initial State Analysis
- ✅ Reviewed current Astro implementation
- ✅ Analyzed git history and Gatsby configuration
- ✅ Read current file structure
- ✅ Researched Astro image optimization best practices
- ✅ Researched CSS hover/blur effects
- ✅ Compared Gatsby vs Astro routing mechanisms

### Research Summary
**Image Optimization**:
- Astro 5.0 has built-in image optimization via `astro:assets`
- Recommended image width for blog posts: 800-1200px
- Auto-converts to WebP, generates responsive images, adds lazy loading

**Hover Effects**:
- Found multiple CSS blur patterns
- Recommended blur values: 1-3px (subtle), 5-10px (noticeable), 15-25px (heavy)
- Performance: keep blur <20px for smooth animations

**Routing**:
- Current Astro setup matches Gatsby URL structure: `/blog/{slug}/`
- Content Collections `generateId` function handles slug/filename extraction
- Should maintain SEO consistency ✅

### Questions to Resolve
1. ❓ 用户期望的具体 hover + blur 效果是什么？
   - Gatsby 的 global.css 中没有明显的 blur 效果
   - 只有 gradient background highlight
   - 需要确认用户的具体需求

2. ❓ 是否需要检查其他 Gatsby 组件文件的样式？
   - `src/components/bio.js`
   - `src/components/layout.js`
   - 可能有 styled-components 或其他 CSS

### Next Steps
1. 开始 Phase 1: 验证路由结构
2. 检查博客文章示例的 frontmatter
3. 确认用户对 hover 效果的具体期望
4. 继续实现图片优化

### Tools Used
- Web search: Astro image optimization, CSS blur effects
- Git: Reviewed Gatsby configuration and history
- File analysis: Current Astro implementation

### Performance Targets
- Build time: < 2 minutes (vs Gatsby's potential timeout)
- First page load: < 2 seconds
- Lighthouse score: 90+
- Image size reduction: ~50%

## Update: 2026-03-02 (Route/Image/Hover Fix Pass)

### What Was Implemented
- ✅ 新增主文章路由文件 `src/pages/[slug].astro`，主路径改为 `/{slug}/`
- ✅ `src/pages/blog/[slug].astro` 改为兼容跳转页（`/blog/{slug}/` -> `/{slug}/`）
- ✅ 首页文章链接改为根路径：`src/pages/index.astro`
- ✅ RSS item 链接改为根路径：`src/pages/rss.xml.ts`
- ✅ 详情页正文图片限制最大阅读宽度：`src/styles/global.css`
- ✅ 恢复旧版 `identifier-bio-blur` 动画：`src/styles/global.css`

### Research/Validation Highlights
- 线上站点首页链接验证：历史路由为 `/{slug}/`
- 旧 Gatsby `gatsby-config.js` 验证：`gatsby-remark-images.maxWidth = 590`
- 旧 Gatsby `src/style.css` 验证：blur 动画存在于 Bio 和 header-link
- 参考了 Astro 官方图片文档 + 官方 blog example + GitHub 开源项目实现

### Issue Log
- `node` 临时脚本依赖 `glob` 缺失，已改用 shell + `rg` 完成统计，无需新增依赖

### Remaining
- ✅ `npm run build` 已通过
- ✅ `dist` 已同时生成 `/{slug}/` 主路由和 `/blog/{slug}/` 兼容跳转页
- ✅ `dist/_astro/*.css` 已包含 `identifier-bio-blur` 和 `.article-post-body img` 规则
- ✅ `dist/rss.xml` 链接已改为 `https://blog.rosuh.me/{slug}/`

## Update: 2026-03-03 (UI Benchmark Refactor Kickoff)

### User Goal
- 参考 boristane + zed.dev/blog 的 UI/交互，优化当前博客体验。

### Actions Done
- 已启用并遵循 `planning-with-files`。
- 已完成项目结构复盘（首页、文章页、全局样式、Bio/DarkMode 组件）。
- 已完成第一轮外部调研（boristane + zed 页面结构与交互模式）。
- 已创建本轮任务分阶段计划并写入 `task_plan.md`。

### In Progress
- 补充高质量 GitHub 参照实现（优先官方/高星项目）。
- 准备开始首页与详情页的样式/交互改造。

## Update: 2026-03-03 (UI Benchmark Refactor Completed)

### Implemented Changes
- 首页（`src/pages/index.astro`）
  - 文章列表升级为轻卡片（边框、渐变底、hover 抬升与阴影）。
  - 列表 hover 时对非焦点卡片应用轻 blur，强化视觉焦点。
  - 标题链接与日期信息样式强化，提升信息分层。
- Bio（`src/components/Bio.astro` + `src/styles/global.css`）
  - 3 个社交 icon 改为“当前高亮、其他轻 blur”，并提高基础可见度，避免“直接消失”。
  - 取消对 Bio SVG 的全局 blur 动画，改为更温和的文本/标题 blur 动画。
- 详情页（`src/pages/[slug].astro` + `src/styles/global.css`）
  - 上/下篇导航改为明确文案：左侧 `上一篇`（更旧），右侧 `下一篇`（更新）。
  - 正文图片增加边框/圆角/hover 反馈。
  - 新增点击放大预览 modal（支持点击蒙层关闭、按钮关闭、Esc 关闭）。
- 布局（`src/layouts/Layout.astro`）
  - Header 升级为 sticky + backdrop blur，增强滚动中的导航识别与层次感。

### Validation
- ✅ `npm run build` 通过
- ✅ `dist` 保持 `/{slug}/` 主路由 + `/blog/{slug}/` 兼容页
- ✅ 文章页输出包含 `上一篇/下一篇` 与 `image-zoom-modal` 结构

### Notes
- 当前工作区仍是迁移中的大规模未提交状态；本次未回滚任何历史改动，仅叠加 UI/交互优化。

## Update: 2026-03-03 (Round 2 In Progress)

### Next Focus
- 继续对齐 boristane 长文交互：为文章页补齐 TOC（桌面侧栏 + 移动折叠）和滚动高亮。

## Update: 2026-03-03 (Round 2 Completed - TOC)

### Implemented
- 文章页增加双态目录：
  - 桌面：右侧 sticky TOC
  - 移动：顶部折叠 TOC
- 目录项支持 active 高亮（随滚动更新）。
- 保持原有图片放大 modal 与上一篇/下一篇导航不变。
- Layout 新增 `wide` 容器能力，仅在文章页启用更宽排版。

### Validation
- ✅ `npm run build` 通过
- ✅ dist 中已生成 `文章目录`、`data-toc-link`、active 脚本与 `global-wrapper-wide`

## Update: 2026-03-03 (Hero to Public + Social Meta Hardening)

### Implemented
- 将 5 篇文章的 `hero` 统一迁移到 `public/images/posts/`：
  - `manifesto-for-minimalist-software-engineers-cn-hero.jpg`
  - `why-can-get-view-size-after-view-post-hero.jpg`
  - `2019-12-reading-report-hero.jpg`
  - `android-reading-note-summary-hero.jpg`
  - `link-ndk-with-gradle-hero.png`
- 5 篇文章 frontmatter 的 `hero` 已改为站内绝对路径（`/images/posts/...`）。
- `Layout.astro` 增强：
  - `description` 统一使用 `metaDescription` fallback，避免 OG/Twitter 描述空值
  - `og:image` 与 `twitter:image` 统一转为绝对 URL（基于 `Astro.site`）
- 修复 `.gitignore`：移除对 `public` 的全量忽略，保证静态资源可纳入版本管理

### Validation
- ✅ `npm run build` 通过
- ✅ 抽样 `dist` 页面确认：
  - `og:image`/`twitter:image` 已输出为 `https://blog.rosuh.me/images/posts/...`
  - 首页与文章页 `og:description`/`twitter:description` 均有值
- ✅ 路由未变化：仍为 `/{slug}/` 主路由与 `/blog/{slug}/` 兼容入口

## Update: 2026-03-03 (Global Image Performance Pass)

### Implemented
- 首页 Bio 头像切换到 `astro:assets` 的 `Image` 组件（由静态 `/profile-pic.jpeg` 改为构建产物图）。
- 新增 Markdown 图片性能插件：
  - `remark-image-performance`：为 markdown `image` 节点补充 `loading="lazy"` / `decoding="async"`
  - `rehype-image-performance`：为 HTML `<img>` 节点补充同样属性（兜底 raw HTML 场景）
- `astro.config.mjs` 已接入上述插件并保持原有 `remark-math`/`rehype-katex` 不变。

### Validation
- ✅ `npm run build` 通过
- ✅ 首页头像输出为 `/_astro/profile-pic...webp`
- ✅ 抽样外链图（`Use-NW-to-build-a-web-app`）输出已包含 `loading="lazy" decoding="async"`

### Audit Summary
- 全站 markdown 外链图片共 `40` 张
- 域名分布：
  - `img.ioioi.top`: 26
  - `ooo.0o0.ooo`: 12
  - `i.loli.net`: 2
- 外链图最集中的文章：
  - `2018-03-08-Use-NW-to-build-a-web-app`（16 张）
  - `2016-08-11-lets-using-https`（12 张）

## Update: 2026-03-03 (Avatar Clarity + Hover Blur Fix)

### Implemented
- `Bio.astro` 头像 `Image` 参数从 `50x50` 调整为 `100x100` 生成图，CSS 仍以 `50x50` 显示（提升高 DPI 清晰度）。
- 为头像增加 `quality={95}`，减少压缩模糊感。
- 恢复头像 hover blur 交互：`.bio-avatar:hover { filter: blur(3px) }`。

### Validation
- ✅ `npm run build` 通过
- ✅ 首页产物头像标签为：`width="100" height="100" class="bio-avatar"`
- ✅ 组件样式中存在 `bio-avatar:hover` blur 规则

## Update: 2026-03-04 (PR #62 Review Fixes)

### All 10 issues resolved

| # | Fix | File |
|---|-----|------|
| 1 | `Astro.site ?? new URL('/', Astro.url)` fallback | Layout.astro |
| 2 | KaTeX CSS conditional on `article` prop | Layout.astro |
| 3 | `font-size: 100%` (was `16px`) | global.css |
| 4 | `color-mix()` compat comment added | global.css |
| 5 | `:focus-visible` global outline styles | global.css |
| 6 | Single `getCollection` via `getStaticPaths` props | [slug].astro |
| 7 | `post.data.tags ?? []` null guard | [slug].astro |
| 8 | `sizes` attr on `<Image>` | Bio.astro |
| 9 | `<ol>` → `<ul>` for post list | index.astro |
| 10 | Fonts non-blocking `media=print` + `<noscript>` | Layout.astro |

### Validation
- ✅ `astro build` 62 pages, 0 errors
- ✅ KaTeX absent on `/index.html`, present on article pages
- ✅ `media="print"` font strategy confirmed in dist HTML
- ✅ `focus-visible` in compiled CSS
- ✅ Canonical URL resolves to `https://blog.rosuh.me/...`
- ✅ `getCollection` appears once in [slug].astro (import + 1 call)

### Commit: 7f17d7d — pushed to astro-migration

## Update: 2026-05-13 (Avatar Replacement + Style Planning)

### Implemented

- 新建分支：`codex/avatar-style-plan`
- 替换头像源图：
  - `src/images/profile-pic.png`
  - `src/images/profile-pic.jpeg`
  - `public/profile-pic.jpeg`
- 新增头像驱动的风格设计规格：
  - `docs/superpowers/specs/2026-05-13-avatar-style-adjustment-design.md`
- 新增后续实施计划：
  - `docs/superpowers/plans/2026-05-13-avatar-style-adjustment.md`

### Avatar Style Notes

- 风格关键词：手绘、纸感、清晰、轻松、克制。
- 主色应靠近头像 marker blue，而不是继续偏冷紫蓝。
- 后续调整重点：tokens、Bio、首页 underline/quote、文章页 blockquote/TOC/tag。

### Validation

- ✅ `npm run build` 通过
- ✅ `npm test` 通过（16 个媒体/性能测试 + 8 个 UI 回归测试）
- ✅ `git diff --check` 通过
- ✅ `dist/index.html` 中首页头像已指向新的 `/_astro/profile-pic.B9g4oTuh_*.webp` 构建产物

## Update: 2026-05-13 (Avatar-Led Style Implementation)

### Implemented

- 全局色彩 token 改为头像驱动：
  - avatar blue / bright blue
  - avatar peach
  - warm paper
  - ink
- `Bio.astro`：
  - 首页头像显示从 48px 提升到 56px
  - 增加 warm paper ring 与浅 avatar-blue 外描边
  - hover 从 blur 改为轻微位移/旋转和描边反馈
  - 桌面 Bio 链接收回到名字旁边，避免与头像签名区脱节
- `index.astro`：
  - quote 左边框改为头像蓝
  - intro 增加短 marker underline
  - 最近写作区域加入极浅 paper tint
  - 文章 hover underline 改成更像手划线的 2px 渐变 stroke
- `src/pages/[slug].astro` 和 `global.css`：
  - 阅读进度条、正文链接、TOC active、tag hover 统一使用头像蓝
  - blockquote 背景引入 peach/cream 暖色
  - nav underline 加粗为低饱和头像蓝 stroke
- `tests/ui-regressions.test.mjs` 更新旧 token 断言为头像蓝/暖纸色断言。

### Validation

- ✅ `npm test` 通过（16 个媒体/性能测试 + 8 个 UI 回归测试）
- ✅ `git diff --check` 通过
- ✅ 本地 Playwright 截图检查：
  - 首页 desktop/mobile 无横向溢出
  - 文章页 desktop/mobile 无横向溢出
  - 桌面文章页 TOC 可见，移动文章页目录按钮可见

## Update: 2026-05-14 (Avatar Favicon)

### Implemented

- 使用新头像生成浏览器图标资源：
  - `public/favicon.ico`
  - `public/favicon-32x32.png`
  - `public/apple-touch-icon.png`
- `src/layouts/Layout.astro` 的 favicon/apple-touch-icon 链接增加 `?v=avatar`，避免浏览器继续使用旧缓存。

### Validation

- ✅ `public/favicon.ico` 包含 16px、32px、48px 图标
- ✅ `public/favicon-32x32.png` 为 32x32
- ✅ `public/apple-touch-icon.png` 为 180x180

## Update: 2026-05-14 (Scribble Highlight Lines)

### Implemented

- 新增 `--scribble-underline-mask`，用轻微波动的双笔触 SVG mask 表达手划线。
- 正文链接 hover underline 改为 `::before` 涂鸦线，保留外链 `↗` 指示。
- 首页 intro、文章列表 hover、文章页上下篇导航 hover 线条统一使用涂鸦 mask。
- 阅读进度条保持直线，继续作为清晰的功能反馈。

### Adjustment

- hover underline 动画从 `scaleX()` 拉伸整条线，改为 `clip-path` 按长度揭开完整线条，避免涂鸦 mask 在动画过程中被压缩变形。
- 引用左侧高亮从直 `border-left` 改为竖向双笔触 rough mask，应用到首页 quote 和正文 blockquote。

## Update: 2026-05-14 (Quiet Motion Tuning)

### Implemented

- 新增 `--ease-quiet` 与 `--duration-quiet`，作为博客的主要微动效节奏。
- 首页首屏动效改为轻微 settle-in：位移从 12px 降到 7px，缩短 stagger 间隔。
- 首页 intro underline 与 quote 左侧笔触使用 `clip-path` 描线揭开，和涂鸦 mask 的长度变化一致。
- 文章页 header、上下篇导航、图片 lightbox、移动 TOC、返回顶部按钮改用更短、更克制的 motion。
- 移除 TOC 跳转时整篇正文 opacity fade，避免阅读中出现突兀闪动。
- 非交互的文章 tag 移除 hover 位移动效，减少误导。
- 明暗主题切换的 pulse 和图标旋转幅度降低。

### Validation

- ✅ `npm test` 通过（16 个媒体/性能测试 + 9 个 UI 回归测试）
- ✅ `git diff --check` 通过
- ✅ Playwright 验证：
  - 首页 intro/quote 描线动画存在，最终 clip-path 完整展开
  - hover underline 从 `inset(0 100% 0 0)` 变为 `inset(0)`
  - `prefers-reduced-motion: reduce` 下首页首屏动画关闭
  - 首页与文章页无横向溢出

## Update: 2026-05-14 (Audit Fixes)

### Implemented

- Lightbox 与移动端目录关闭态增加 `inert`，不再进入键盘 Tab 顺序。
- 移动端目录增加 `aria-controls`，并避免桌面 TOC 点击时误把焦点带到移动按钮。
- 提高 `--fg-subtle` 与 `--support` 的可读性，修复 cite、footer、年份标签、文章导航小字对比度偏低。
- Bio 链接、移动目录按钮、关闭按钮、返回顶部按钮统一到 44px 触控目标。
- 浮动目录/返回顶部与 Live Photo badge 去掉 glassmorphism 倾向，改为 token 化实色/半透明墨色。
- 头像派生图从 1254px 压到 512px：`public/profile-pic.jpeg` 从 548K 降到 64K。
- 移除残留负 letter-spacing 和 viewport-width 字号缩放。

### Validation

- ✅ `npm test` 通过（16 个媒体/性能测试 + 10 个 UI 回归测试）
- ✅ `git diff --check` 通过
- ✅ Playwright 验证：
  - lightbox 与移动 TOC 关闭态均为 `inert`
  - Tab 顺序不会进入关闭态 overlay
  - 移动 TOC 与 lightbox 打开后焦点进入正确控件，关闭后恢复 `inert`
  - 浅/深色关键小字对比度均 >= 4.5:1
  - 生成桌面首页、桌面文章、移动文章截图
