# 文章详情页与构建提速 — 设计文档

**日期**：2026-04-26  
**分支**：`astro-migration`  
**作者**：rosu (assisted by Codex)

## 背景

博客已迁移到 Astro 5。最近新增 HEIC / Live Photo 支持后，GitHub Actions 构建仍有明显重复转换成本；文章详情页也需要从基础阅读页升级为更强的编辑杂志感。

这次需求包含三件事：

1. 构建提速与缓存：避免每次 Actions 重新转换资源。
2. 文章详情页样式重做：使用 critique 结果指导设计。
3. 图片 ALT 的可见呈现：以美观、优雅、简洁、现代的方式在图片周围展示。

## 已确认决策

| 决策点 | 选择 |
|---|---|
| CI 优化范围 | C：缓存 + 调整图片处理策略，减少重复衍生规格 |
| 文章页视觉范围 | C：重做为更强的编辑杂志感，但保持克制安静 |
| 图片 ALT 展示 | B：桌面边注 / 移动端下方细线图注 |
| 范围边界 | 只动文章详情页和构建链路，不重做首页，不批量改文章内容 |

## Critique 摘要

### LLM 设计评估

文章页没有明显 AI 生成感：没有通用渐变 hero、玻璃拟态、浮夸指标卡、卡片堆砌等典型问题。整体气质仍接近个人博客与编辑阅读页。

主要问题：

- 移动端存在横向溢出。390px 宽度下，标题和图片被裁切，页面本身可横向滚动。
- 图片只保留语义 `alt`，没有可见图注。对长图文文章而言，读者缺少图片说明层。
- 文章页层次偏基础。标题区、图片、代码块、上下篇导航还没有形成足够统一的编辑系统。
- 当前图片密集文章里，截图和照片都用同一宽度节奏，缺少横图、竖图、截图之间的节制差异。

### 自动扫描

`npx impeccable --json 'src/pages/[slug].astro' src/layouts/Layout.astro src/components/Bio.astro src/components/DarkMode.astro src/components/BambooShadow.astro`

扫描结果只有一个低优先级问题：

- `src/layouts/Layout.astro:179`：Live Photo 徽章附近字号层级偏平。该问题不阻塞本次，但可以随文章页重做一起纳入整体排版修正。

### Nielsen 评分

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | 阅读进度条存在，但代码复制反馈较轻 |
| 2 | Match System / Real World | 3 | 博客语言自然，图片说明未显性化 |
| 3 | User Control and Freedom | 3 | 导航返回可用，长文缺少更明确的阅读定位 |
| 4 | Consistency and Standards | 3 | 首页和文章页基调一致，但图片和 Live Photo 外观未统一 |
| 5 | Error Prevention | 3 | 静态阅读页风险低，主要问题是移动端溢出 |
| 6 | Recognition Rather Than Recall | 3 | 文章元信息清楚，但图片语义不可见 |
| 7 | Flexibility and Efficiency | 2 | 长文扫描和跳读辅助有限 |
| 8 | Aesthetic and Minimalist Design | 2 | 内容清爽，但文章页还不够有编辑层级 |
| 9 | Error Recovery | 3 | 低交互页面，代码复制失败静默但影响小 |
| 10 | Help and Documentation | 3 | 博客阅读不需要显式帮助 |
| **Total** | | **28/40** | **Good，适合做一次高质量视觉和阅读系统升级** |

### 认知负荷

失败项：2 / 8，属于中等偏低负荷。

失败点：

- 视觉层级：长图文中图片、正文、代码块的节奏不够明确。
- 渐进披露：图片说明没有在视觉层出现，读者需要从上下文推断。

### 相关用户画像

**持续浏览归档的读者**：会从首页进入旧文或长文。当前文章页可读，但长图文缺少图片说明和更清晰的节奏，浏览几十张图时容易疲劳。

**移动端读者 Casey**：当前 390px 下标题和图片裁切，这是最高优先级问题。修复后应保证页面本身无横向滚动。

**辅助技术用户 Sam**：`alt` 已存在，但视觉图注不能替代 `alt`。实现必须保留 `<img alt>`，新增 `<figcaption>`。

## 目标

### 构建目标

- GitHub Actions 能复用 Astro 图片缓存和自定义 HEIC/MOV 缓存。
- 普通 Markdown 图片不再生成过多不必要宽度。
- 构建日志能看出缓存是否有效。
- 现有 HEIC/MOV 内容寻址缓存继续保持。

### 文章页目标

- 文章详情页形成更强的编辑杂志感：标题区、正文、图片、代码块、引用、上下篇导航是一套系统。
- 移动端无横向溢出，尤其是标题、图片、代码块。
- 图片图注来自 Markdown `alt`，桌面为边注，移动端为下方细线说明。
- 普通图片、HEIC、Live Photo 使用统一 figure / caption 外观。
- 视觉增强不能牺牲语义、可访问性和深色主题。

## 非目标

- 不重做首页、404、RSS、Bio 的信息架构。
- 不批量改文章 Markdown 文案。
- 不引入大型前端框架或客户端图片库。
- 不把文章页做成产品 landing page、dashboard 或卡片化布局。
- 不改 HEIC/MOV 的核心编码参数，除非测试证明现有行为被破坏。

## 架构

### 构建链路

#### Astro 图片缓存

Astro 官方文档说明，处理后的图片默认缓存到 `./node_modules/.astro`，可通过 `cacheDir` 改目录。当前本地 `node_modules/.astro` 约 121MB，GitHub Actions 未缓存它，因此普通 JPEG/PNG 在 CI 中会反复生成 WebP 和 srcset。

设计：

1. 在 `astro.config.mjs` 设置显式 `cacheDir: '.cache/astro'`。
2. GitHub Actions 缓存 `.cache/astro`。
3. 保留 `.cache/media` 给自定义 HEIC/MOV 管线。
4. Actions 构建前恢复缓存，构建后由 `actions/cache` 自动保存新缓存。
5. 日志输出 `.cache/astro`、`.cache/media`、`public/_media` 的目录大小。

#### 普通图片衍生规格

当前全局 `image.layout = 'constrained'` 会让 Markdown 本地图片自动生成响应式 `srcset`。长图文文章中大量图片会放大构建成本。

设计：

1. 保留 `layout: 'constrained'`，继续获得响应式图片和宽高属性。
2. 设置全局 `image.breakpoints`，减少默认规格数量。
3. `image.breakpoints` 设置为 `[640, 828, 1080, 1440]`。
4. 这些宽度覆盖手机、平板、普通桌面和轻微破栏图片；不再为每张图默认生成 750、1280、1668、2048、2560、3072 等过多规格。
5. 如果某些超宽截图确实需要更大规格，后续再做文章级显式 opt-in，而不是默认全站生成。

#### 缓存键

GitHub Actions 缓存拆成两组：

1. Node/npm 缓存：继续使用 `actions/setup-node` 的 npm cache。
2. 图片缓存：新增 `actions/cache`，覆盖 `.cache/astro` 与 `.cache/media`。

缓存 key 应包含：

- OS。
- `package-lock.json`。
- `astro.config.mjs`。
- 媒体处理代码：`src/utils/media-cache.mjs`、`src/utils/remark-media.mjs`、`src/utils/rehype-media.mjs`。
- 图片源：`content/posts/**/*.{png,jpg,jpeg,webp,gif,heic,mov}`。

原因：

- `astro.config.mjs` 改 breakpoints 时必须刷新缓存。
- 媒体处理代码或 `PROCESSOR_VERSION` 变化时必须刷新自定义产物。
- 图片源变化时需要生成新产物，但 restore-key 仍能复用旧图缓存。

### 文章详情页版式

#### 页面结构

现有结构保留：

```astro
<Layout article>
  <div id="reading-progress" />
  <article>
    <header class="article-header">...</header>
    <section class="prose"><Content /></section>
    <footer class="article-footer"><Bio compact /></footer>
  </article>
  <nav class="post-nav">...</nav>
</Layout>
```

升级重点：

- `article` 增加更明确的宽度系统。
- 标题区从简单标题变成编辑开篇：日期、标题、可能的标签按同一节奏排列。
- `.prose` 继续是正文主容器，但支持图片 figure 破栏。
- 上下篇导航改成更像文章尾声，而不是简单链接列表。

#### 宽度系统

新增或调整 CSS tokens：

- `--content-width`: 正文阅读栏，约 680-720px。
- `--media-width`: 横图和截图最大宽度，约 `min(980px, 100vw - 2rem)`。
- `--caption-width`: 桌面边注宽度，约 9-11rem。

约束：

- 所有宽度都必须用 `max-width: min(..., 100%)` 或 viewport 约束。
- 移动端 `body` 与 `.site-wrap` 不得出现横向滚动。
- 代码块 `overflow-x: auto` 只作用于代码块自身。

#### 编辑杂志感

视觉方向：

- 更强标题开篇，但不是 hero card。
- 文章标题使用更稳的 serif display，移动端字号必须 clamp 到不会裁切。
- 日期和标签更像出版信息，不做大面积 chip。
- 正文使用适合中文阅读的行距和段距。
- `h2` / `h3` 用细线、留白和小型编号感建立层级，避免单纯靠颜色。
- 引用块更像边注引文，不使用厚重渐变。
- 代码块保持技术文章可读，按钮常显或 hover 显示都要保证键盘可达。

## 图片 ALT / 图注系统

### 数据流

Markdown 保持不变：

```md
![富士山与冰淇淋](2024-fuji-icecream.jpeg)
```

渲染后：

```html
<figure class="media-figure">
  <img alt="富士山与冰淇淋" ...>
  <figcaption>富士山与冰淇淋</figcaption>
</figure>
```

规则：

1. `alt` 保留在 `<img>` 上。
2. `figcaption` 内容来自非空 `alt`。
3. 空 `alt` 不生成可见 `figcaption`。
4. 普通图片、HEIC、Live Photo 都使用同一套 figure/caption 结构。
5. 不把 `figcaption` 作为 `alt` 的替代。屏幕阅读器仍能读到图片 `alt`，视觉读者看到图注。

### 普通 Astro Markdown 图片

Astro 会把 Markdown 图片渲染成 `<img data-astro-image="constrained" ...>`。现有 rehype 插件只对自定义 HEIC 标记做替换。

设计：

1. 在 `rehype-media.mjs` 中扩展 walk 行为。
2. 对非自定义 media marker 的普通 `<img>`：
   - 保留现有 `loading`、`decoding`。
   - 如果父节点是只包含该图片的 `<p>`，把父节点替换为 `<figure class="media-figure">`。
   - 如果图片在链接中或内联混排中，避免强行包 figure，防止破坏语义。
3. `alt` 非空时追加 `<figcaption>`。

### HEIC 和 Live Photo

当前 `rehype-media.mjs` 已生成 `<picture>` 或 `<figure class="livephoto">`。

设计：

1. HEIC still 输出改为 `<figure class="media-figure media-figure--generated">`，内部放 `<picture>` 和可选 `<figcaption>`。
2. Live Photo 保持 `<figure class="livephoto media-figure">`，在 badge/video/picture 后追加可选 `<figcaption>`。
3. Live Photo 的 `aspect-ratio`、播放 badge 和 caption 不互相遮挡。

### 视觉规则

桌面：

- `figure.media-figure` 可用 grid：图片区域 + 右侧 caption rail。
- caption rail 顶部与图片上沿对齐，细边线从说明首行开始。
- caption 用小字号、muted 色、细左边线。
- 不覆盖图片，避免遮住照片主体。

移动端：

- figure 单列。
- caption 位于图片下方。
- 用顶部细线或短线形成图片说明感。
- caption 不依赖 hover。

## 错误处理与降级

### 构建缓存

- 缓存 miss 不应导致构建失败，只是变慢。
- `du -sh` 日志命令应使用 `|| true`，避免目录不存在时报错。
- `actions/cache` 使用 restore-keys，图片源变化时仍能恢复旧缓存。

### 图片包裹

- 如果 `alt` 为空，不生成可见图注。
- 如果图片位于链接或复杂内联结构中，不强制改写成 figure。
- 如果 `data-media` JSON 解析失败，现有策略继续删除坏 HEIC 节点并留下注释，避免输出坏 `.heic` 图片。

### 移动端

- 标题使用 `overflow-wrap: anywhere`，并通过 `clamp()` 限制移动端字号，保证长中英混排不裁切。
- 图片和 picture 必须 `max-width: 100%`。
- 破栏图片在窄屏禁用破栏。
- 代码块内部滚动，页面不横向滚动。

## 测试计划

### 单元 / 输出测试

扩展现有测试：

- `tests/media-output.test.mjs`
  - HEIC still 输出 `<figure>`、`<picture>`、`<figcaption>`。
  - Live Photo 输出 `<figure class="livephoto media-figure">`、video sources、badge、`figcaption`。
  - 原始 `.heic` 不出现在 `<img src>`。

新增或扩展普通图片测试：

- Markdown 普通图片输出 `<figure class="media-figure">`。
- 非空 `alt` 生成 `<figcaption>`。
- 空 `alt` 不生成 `<figcaption>`。
- 链接内图片不被错误包成破坏链接的结构。

### 构建测试

- `npm run build`。
- 连续两次构建，确认已有 HEIC/MOV 不重复处理。
- 检查 `.cache/astro` 与 `.cache/media` 存在并有体积。
- 检查生成的普通图片 srcset 宽度数量减少。

### 视觉测试

用本地 Chrome 截图验证：

- 桌面宽度：1440px。
- 移动宽度：390px。

检查点：

- 页面无横向滚动。
- 标题不裁切。
- 图片不撑破 viewport。
- caption 桌面为边注，移动端为下方说明。
- 深色主题中 caption、代码块、引用可读。

### 回归测试

- 文章页上下篇导航仍可访问。
- 旧 `/blog/{slug}/` 跳转页不受影响。
- RSS 不受图片 figure 改写影响。
- 主题切换按钮正常。

## 实施计划提示

后续 implementation plan 应拆成四个步骤：

1. CI 和 Astro 图片缓存配置。
2. `rehype-media.mjs` figure/caption 数据结构改造。
3. 文章详情页 CSS 重做。
4. 测试、截图验证、日志可观测性。

每一步都应保持可单独验证，避免一次性大改后难以定位问题。

## 风险

- Astro Markdown 图片输出结构可能随版本变化。实现应针对 HAST 节点结构做保守判断，不依赖 fragile 字符串。
- 过少的 `breakpoints` 可能让大屏截图清晰度下降。初始 `[640, 828, 1080, 1440]` 是构建成本和清晰度的折中。
- 将普通图片包成 figure 可能影响已有 CSS 选择器。需要测试 `.prose img`、`.prose p`、链接图片。
- Live Photo figure 已经有交互层，caption 加入后要避免影响 pointer events。

## 验收标准

- GitHub Actions 构建日志显示 Astro 图片缓存和自定义媒体缓存目录大小。
- 普通 Markdown 图片衍生规格减少。
- `npm run build` 通过。
- 相关 `node --test` 通过。
- 桌面和 390px 移动端截图确认无横向裁切。
- 有 `alt` 的普通图片、HEIC、Live Photo 都显示统一图注。
- 空 `alt` 不显示图注。
- `alt` 仍保留在 `<img>` 上。
