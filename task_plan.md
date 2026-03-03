# Task Plan: Route Parity, Image Readability, and Hover Blur Recovery

## Goal
按用户要求完成 3 项修复并落地验证：
1. 路由保持与旧站一致，避免 SEO 受损
2. 博客详情页图片过大问题修复，改善阅读体验
3. 首页丢失的 hover + blur 效果恢复

## Verified Baseline
- 线上 Gatsby 站点文章路由为 `/{slug}/`（已通过抓取线上首页链接验证）
- 当前 Astro 迁移版本文章路由为 `/blog/{slug}/`（存在 SEO 风险）
- 旧版样式中存在 `identifier-bio-blur` 动画，作用于 Bio 区和站点标题链接
- 详情页 Markdown 图片在 Astro 输出中携带大尺寸宽高属性，未被阅读宽度约束

## Phases

### Phase 1: 路由与 SEO 一致性
**Status**: `completed`
**Tasks**:
- [x] 核对旧站真实路由结构（线上抓取 + Gatsby 源码）
- [x] 新增根路由文章页：`src/pages/[slug].astro`
- [x] 将首页文章链接改为 `/{slug}/`
- [x] 将上一篇/下一篇链接改为 `/{slug}/`
- [x] 将 RSS item 链接改为 `/{slug}/`
- [x] 保留 `/blog/{slug}/` 兼容跳转页，降低旧迁移链接断裂风险

### Phase 2: 详情页图片阅读体验
**Status**: `completed`
**Tasks**:
- [x] 基于旧站 `gatsby-remark-images maxWidth: 590` 策略对齐阅读宽度
- [x] 在全局样式增加正文图片约束：`.article-post-body img`
- [x] 确保图片居中、响应式缩放、保持比例

### Phase 3: 首页 Hover + Blur 恢复
**Status**: `completed`
**Tasks**:
- [x] 从旧版 `style.css` 精确定位丢失动画选择器和关键帧
- [x] 恢复 `identifier-bio-blur` 动画及触发选择器
- [x] 保持深色模式变量兼容（`--color-hover-blur`）

### Phase 4: 验证与收尾
**Status**: `completed`
**Tasks**:
- [x] 执行 `npm run build` 验证构建无报错
- [x] 校验 `dist` 路由是否包含 `/{slug}/` 与 `/blog/{slug}/` 跳转页
- [x] 抽样检查详情页图片宽度是否受控

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `Cannot find module 'glob'` (临时 Node 脚本) | 1 | 改用 `rg` + shell 统计，不引入新依赖 |

## Files Modified
- `src/pages/[slug].astro` (新增主路由文章页)
- `src/pages/blog/[slug].astro` (改为兼容跳转页)
- `src/pages/index.astro` (文章链接改为根路径)
- `src/pages/rss.xml.ts` (RSS 链接改为根路径)
- `src/styles/global.css` (正文图片宽度约束 + blur 动画恢复)

## Decision Notes
- 路由主路径选 `/{slug}/`，以旧站线上真实链接为准
- `/blog/{slug}/` 保留兼容页面，减少迁移期间外链断裂
- 图片约束优先 CSS 落地（覆盖 Markdown 输出图片），改动最小且对全量旧文生效

---

# Task Plan: UI Benchmark Refactor (Boris + Zed)

## Goal
基于以下参考站点重构博客的视觉和交互体验，同时保持既有 SEO 路由不变：
1. https://boristane.com/blog/how-i-use-claude-code/#phase-1-research
2. https://zed.dev/blog

## Constraints
- 路由保持 `/{slug}/` 主路由不变，`/blog/{slug}/` 继续兼容跳转
- 保留现有内容结构与可读性，不引入重型前端框架
- 继续兼容暗色模式

## Phases

### Phase 1: 参考站点模式提炼（Web + MCP + GitHub）
**Status**: `completed`
**Tasks**:
- [x] 抓取 boristane 文章页结构和关键交互（TOC、图片缩放、底部操作）
- [x] 抓取 zed blog 列表页结构和交互动效（卡片 hover、pattern 背景）
- [x] 补充高质量 GitHub 开源实现作为技术参照
- [x] 将结论沉淀到 findings.md

### Phase 2: 首页 UI/交互升级
**Status**: `completed`
**Tasks**:
- [x] 将文章列表升级为更强层次感的卡片布局
- [x] 恢复/优化 hover + blur，避免图标“消失感”
- [x] 增加轻量背景纹理和 sticky header 交互感

### Phase 3: 文章页可读性与交互升级
**Status**: `completed`
**Tasks**:
- [x] 优化正文图片阅读体验（尺寸、留白、边框/阴影）
- [x] 增加点击放大预览（modal）以提升长文阅读体验
- [x] 校正上一篇/下一篇的文案与布局语义（左旧右新）

### Phase 4: 验证与交付
**Status**: `completed`
**Tasks**:
- [x] 执行 `npm run build`
- [x] 回归检查首页 hover/blur 与文章页图片行为
- [x] 记录改动清单与后续可选优化

### Phase 5: 长文阅读增强（TOC + Scroll Spy）
**Status**: `completed`
**Tasks**:
- [x] 在文章页接入 headings 目录数据
- [x] 增加桌面 sticky TOC 与移动端折叠 TOC
- [x] 实现滚动激活高亮（active heading）
- [x] 验证与现有图片放大脚本兼容

### Phase 6: Hero Image Public 化与 Social Meta 稳定性
**Status**: `completed`
**Tasks**:
- [x] 将带 `hero` 的文章封面统一迁移至 `public/images/posts/`
- [x] 将对应 frontmatter `hero` 改为站内绝对路径（`/images/posts/...`）
- [x] 修复 Layout 中 `og:description`/`twitter:description` 空值问题（统一 fallback）
- [x] 修复 `og:image`/`twitter:image` 相对路径问题（统一输出绝对 URL）
- [x] 修正 `.gitignore` 中误忽略 `public` 的规则，确保静态资源可提交
- [x] 构建验证路由保持不变（`/{slug}/` 主路由 + `/blog/{slug}/` 兼容跳转）

### Phase 7: 全局图片性能加固
**Status**: `completed`
**Tasks**:
- [x] 首页头像由 `<img>` 升级为 `astro:assets` `Image` 组件
- [x] Markdown 图片统一注入 `loading="lazy"` 与 `decoding="async"`（仅在缺失时补充）
- [x] 构建验证头像产物走 `/_astro/*.webp`
- [x] 输出全站外链图片分布统计，明确下一步优化优先级

### Phase 8: 头像清晰度与 Hover Blur 回归
**Status**: `completed`
**Tasks**:
- [x] 头像优化图尺寸提升为 `100x100`，显示尺寸保持 `50x50`，提升 Retina 清晰度
- [x] 头像启用 `quality=95`，降低过度压缩导致的细节丢失
- [x] 恢复头像自身 hover blur（`filter: blur(3px)`）
- [x] `npm run build` 验证产物与样式生效
