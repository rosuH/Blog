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
