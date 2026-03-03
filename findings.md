# Findings: Astro Blog Migration Research

## 2026-03-02 Corrections & Final Decisions

### Routing (SEO critical)
- 通过线上站点 `https://blog.rosuh.me` 首页链接抓取确认，历史文章路由是 `/{slug}/`，不是 `/blog/{slug}/`。
- 因此 Astro 应以 `/{slug}/` 作为主路由，保证历史收录与外链一致。
- 保留 `/blog/{slug}/` 作为兼容入口并跳转到 `/{slug}/`，用于兜底迁移期间的旧链接。

### Image readability
- 线上 Gatsby 配置里 `gatsby-remark-images` 的 `maxWidth` 为 `590`，且正文图片输出带居中与响应式包裹。
- Astro 迁移后 Markdown 图片输出虽有 `width/height` 与 lazy/async，但缺少阅读宽度限制，导致图过大。
- 最小侵入修复：在 `.article-post-body img` 统一设置 `max-width: min(100%, 590px)` + `height: auto` + 居中。

### Hover + blur
- 旧版 blur 并非文章卡片 hover，而是 Bio 区图标/文字、站点标题链接触发的 `identifier-bio-blur` 动画。
- 新版迁移中该动画缺失，恢复对应选择器与 keyframes 即可对齐旧体验。

### MCP / Web / GitHub References Used
- Astro Images guide: https://docs.astro.build/en/guides/images/
- Astro assets reference: https://docs.astro.build/en/reference/modules/astro-assets
- Astro blog example source: https://github.com/withastro/astro/tree/main/examples/blog
- Gatsby image sizing config in repo: `gatsby-config.js` (`gatsby-remark-images.maxWidth = 590`)

## Astro Image Optimization Best Practices

### Key Discoveries
1. **Astro 内置图片优化**（v3.0+）
   - 自动转换为 WebP 格式
   - 自动生成 responsive images
   - 自动添加 lazy loading
   - 防止 CLS（Cumulative Layout Shift）

2. **推荐的图片大小**
   - 博客内容图片：800-1200px 宽度
   - 研究显示 1200px 是清晰度和性能的良好平衡点
   - 原始 1920px 图片可能过大，影响加载速度

3. **使用方式**
   ```astro
   ---
   import { Image } from 'astro:assets';
   import myImage from '../assets/image.jpg';
   ---
   <Image src={myImage} alt="Description" />
   ```

4. **Markdown 中的图片**
   - Astro 自动优化 Markdown 中的本地图片
   - 使用相对路径引用即可
   - 需要在 frontmatter 中声明图片路径

### Performance Metrics from Research
- 案例：首页加载时间从 6.2s 降到 1.8s
- Lighthouse 分数从 62 提升到 95
- 图片大小减少约 50%

## CSS Hover + Blur Effects

### Common Patterns
1. **Filter Blur**
   ```css
   .item:hover {
     filter: blur(2px);
   }
   ```

2. **Backdrop Filter** (更现代)
   ```css
   .overlay {
     backdrop-filter: blur(10px);
   }
   ```

3. **"Blur Others on Hover"** 模式
   ```css
   .container:hover .item:not(:hover) {
     filter: blur(3px);
     opacity: 0.6;
   }
   ```

### Performance Considerations
- Blur 值建议：
  - 1-3px: 轻微柔化
  - 5-10px: 明显模糊
  - 15-25px: 强烈抽象效果
- 超过 20px 会显著影响性能
- 使用 `transition` 实现平滑效果
- GPU 加速支持（现代浏览器）

## Gatsby to Astro 路由迁移

### Gatsby 路由机制
- 通过 `gatsby-node.js` 的 `createPages` API 创建页面
- 从 frontmatter 读取 `slug` 或 `filename` 字段
- 线上实际文章链接格式: `/{slug}/`（由首页抓取验证）

### Astro 路由机制
- 使用文件系统路由：`src/pages/[slug].astro`（主路由）
- Content Collections 的 `loader.generateId` 控制 URL
- 当前配置：
  ```ts
  generateId: ({ entry, data }) => {
    const id = data.filename || data.slug || entry.split('/').pop();
    return id?.replace(/\.mdx?$/, '') || entry;
  }
  ```

### 验证要点
- ✅ 两者都支持从 frontmatter 自定义 URL
- ✅ 主路由对齐历史结构：`/{id}/`
- ✅ 兼容保留 `/blog/{id}/` 跳转页，避免迁移期间断链

## Open Source Astro Blog References

### 推荐查看的项目
1. **Astro Official Blog** - astro.build/blog
2. **Astro Starter Templates** - github.com/withastro/astro/tree/main/examples/blog
3. **Community Blogs** - 使用 Astro 的博客项目

### 值得借鉴的特性
- Image component 使用模式
- CSS transition 动画
- Dark mode 实现
- RSS feed 生成

## Technology Stack Comparison

| Feature | Gatsby | Astro |
|---------|--------|-------|
| Build Time | 较慢（大量图片时） | 快速（Islands 架构） |
| Image Optimization | gatsby-plugin-image | 内置 astro:assets |
| 数学公式 | gatsby-remark-katex | remark-math + rehype-katex |
| 语法高亮 | gatsby-remark-prismjs | 内置 Shiki |
| 深色模式 | 手动实现 | 手动实现 |
| RSS | gatsby-plugin-feed | @astrojs/rss |

## Current Gatsby Styles Analysis

### 已确认的 Blur 来源
从 Gatsby 旧版 `src/style.css` 确认存在如下交互动画：
- 选择器：`.bio svg/img/p` 与 `.header-link-home` 的 hover/active/focus
- 关键帧：`@keyframes identifier-bio-blur`
- 效果：文字透明 + text-shadow + `blur(2px)`

### 修复结论
- 迁移后效果缺失原因：上述选择器与关键帧未被带入新的全局样式。
- 已在 Astro 的 `src/styles/global.css` 恢复该动画，且复用深色模式变量 `--color-hover-blur`。

## Dependencies Required

### 必需的包
```json
{
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/rss": "^4.0.0",
    "remark-math": "^6.0.0",
    "rehype-katex": "^7.0.0"
  },
  "devDependencies": {
    "sharp": "^0.33.0",  // 图片处理引擎
    "@types/node": "^22.0.0",
    "typescript": "^5.8.0"
  }
}
```

### Sharp 说明
- Astro 推荐的图片处理库
- 性能优秀，功能完整
- 需要作为 dev dependency 安装

## 2026-03-03 UI Benchmark Notes (Boris + Zed)

### Boris Tane 文章页（how-i-use-claude-code）
- 结构特征：正文 + 桌面侧边 TOC（固定）+ 移动端折叠 TOC。
- 交互特征：TOC 链接存在 active 高亮与 smooth scroll 偏移；正文图片支持 hover 放大与点击 modal 放大。
- 可借鉴点：
  - 长文场景中，目录定位和图片缩放是明显提升阅读效率的两个“高价值交互”。
  - 小动画以 120~250ms 过渡为主，低侵入但能增强反馈。

### Zed Blog 列表页
- 结构特征：顶部导航 sticky；精选区域 + 列表区域的层次分区明显。
- 视觉特征：卡片边框 + 轻阴影 + hover 提升（颜色/阴影/位移）组合，信息密度高但不压迫。
- 可借鉴点：
  - 使用细边框与浅背景层即可建立“科技感”信息块，无需重视觉噪声。
  - 列表项可通过 group-hover 强化标题与 meta 的响应。

### 初步实现策略（映射当前 Astro 项目）
- 首页：
  - 保留既有路由/数据源，仅替换列表视觉为 zed 风格轻卡片。
  - Bio icon hover 改为“保留可见 + 轻模糊/提亮反馈”，避免透明度过低导致“消失”。
- 详情页：
  - 继续保留 `max-width` 限制，补充图片容器质感（圆角+阴影）和点击放大 modal。
  - 上一篇/下一篇文案固定为：左侧“上一篇（更早）”，右侧“下一篇（更新）”。

### 2026-03-03 GitHub + MCP 参考补充
- MCP（Context7）Astro 文档：确认可以在 `.astro` 页面安全加入页面脚本处理 DOM 交互，且 Markdown 图片样式推荐通过全局/正文容器 CSS 统一约束。
  - 参考：`/withastro/docs` 查询结果（images + directives + markdown plugins）
- GitHub 开源参考 1：`withastro/astro` 官方 blog example 的 `global.css`，采用了简洁渐变背景、舒适排版和 `img { max-width: 100%; height: auto; border-radius }` 的基础可读性策略。
  - 参考源码：
    - https://github.com/withastro/astro/tree/main/examples/blog
    - https://raw.githubusercontent.com/withastro/astro/main/examples/blog/src/styles/global.css
- GitHub 开源参考 2：`francoischalifour/medium-zoom`，确认“点击图片放大 + ESC/点击空白关闭”是成熟交互范式。
  - 参考源码：
    - https://github.com/francoischalifour/medium-zoom
    - https://raw.githubusercontent.com/francoischalifour/medium-zoom/master/README.md
- GitHub 开源参考 3：`vercel/next.js` blog-starter 中封面图 hover shadow 的轻量反馈（`hover:shadow-lg` + 短过渡）适合迁移到文章列表卡片场景。
  - 参考源码：
    - https://github.com/vercel/next.js/tree/canary/examples/blog-starter
    - https://raw.githubusercontent.com/vercel/next.js/canary/examples/blog-starter/src/app/_components/cover-image.tsx

### 本轮改造决策
- 首页采用“轻卡片 + 悬浮抬升 + 列表非焦点轻 blur”提升信息层次，避免过重动效。
- Bio 3 个 icon 的 hover 行为改为“高亮当前、轻 blur 其他”，并避免 opacity 过低导致“消失感”。
- 文章页图片保留阅读宽度限制，并增加点击放大 modal，兼容键盘 `Esc` 关闭。
- 上/下篇文案语义固定：左侧 `上一篇`（更旧），右侧 `下一篇`（更新）。

### 2026-03-03 Round 2: TOC Implementation Notes
- `render(post)` 可直接返回 `headings`，适合无侵入构建 Markdown 目录。
- 宽屏下采用 sticky 侧栏 TOC，窄屏下退化为 `details/summary` 折叠目录，交互成本低且易维护。
- 目录激活逻辑采用 `IntersectionObserver`，并复用同一套 `data-toc-link` 同步桌面与移动目录状态。
- 为避免 sticky header 锚点遮挡，正文标题需设置 `scroll-margin-top`。

## 2026-03-03 Hero in public/ Decision Notes

### Why this route
- 将 `hero` 统一迁移到 `public/` 不影响页面路由，仅影响静态资源地址，符合“SEO 路由不动”的约束。
- 站内路径可避免第三方图床波动导致的社媒卡片失效。
- 与 Astro 静态站点部署模型天然匹配，发布后资源地址稳定。

### Implementation choices
- 文章 frontmatter 统一使用根路径：`/images/posts/<name>.jpg|png`
- `Layout.astro` 使用 `new URL(image, Astro.site ?? Astro.url)` 生成绝对图地址，确保 OG/Twitter 解析稳定。
- `description` 统一 fallback 到站点默认描述，避免 `og:description` / `twitter:description` 为空。
- 移除 `.gitignore` 中 `public` 忽略规则，避免 hero 图与 favicon/robots 等静态资产被漏提交流水线。

### Verification evidence
- `dist/index.html` 中 `og:description`/`twitter:description` 已有值。
- `dist/link-ndk-with-gradle/index.html` 中 `og:image`/`twitter:image` 为绝对地址：
  - `https://blog.rosuh.me/images/posts/link-ndk-with-gradle-hero.png`

## 2026-03-03 Global Image Performance Findings

### Implemented improvements
- 首页头像改为 `astro:assets` `Image` 组件，构建后产物为 `/_astro/profile-pic...webp`。
- Markdown 图片链路新增双层兜底：
  - `remark-image-performance` 为 markdown `![...](...)` 生成的 `img` 注入 `loading`/`decoding`
  - `rehype-image-performance` 为 raw HTML `<img>` 注入同样属性

### Build evidence
- 首页产物示例：`<img src="/_astro/profile-pic...webp" ... loading="eager" decoding="async">`
- 外链图产物示例：`<img src="https://img.ioioi.top/..." ... loading="lazy" decoding="async">`

### Remaining optimization opportunities
- 外链图片总量 `40`，主要集中在：
  - `img.ioioi.top`（26）
  - `ooo.0o0.ooo`（12）
  - `i.loli.net`（2）
- 高优先文章（外链图数量）：
  - `2018-03-08-Use-NW-to-build-a-web-app`（16）
  - `2016-08-11-lets-using-https`（12）
- 结论：下一阶段若继续优化，优先将上述两篇外链图批量本地化，可显著降低第三方依赖风险与首屏抖动。

## 2026-03-03 Avatar Visual Regression Notes

### Symptom
- 用户反馈头像在首页“像素变糊”，且头像 hover 时 blur 效果消失。

### Cause
- `Image` 组件此前按 `50x50` 直接生成单尺寸资源，在高 DPI 屏幕上细节易偏软。
- 头像未单独定义 hover blur 规则，原规则仅覆盖了 Bio 文本和 icon。

### Fix
- 头像生成尺寸提升为 `100x100`，显示尺寸保持 `50x50`，并设置 `quality=95`。
- 新增 `.bio-avatar:hover` 的 blur 交互规则（`3px`）。

### Verification
- `dist/index.html` 中头像输出为 `width="100" height="100"` 的 `/_astro` 优化资源。
- 组件样式中确认 `bio-avatar:hover` 含 blur 规则。
