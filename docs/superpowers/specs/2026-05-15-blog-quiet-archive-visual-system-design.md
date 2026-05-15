# Blog Quiet Archive and Visual System Design

## Goal

在当前头像风格分支的基础上，把博客从“首页即完整索引”调整为更安静的个人写作入口，同时把手绘、纸感、头像色和文章页控件收束成一致的视觉系统。

这轮仍在同一分支完成，但按阶段推进：先拆清页面职责，再统一视觉语言，最后优化长文阅读控件。

## Current Context

- 当前分支已经完成头像替换、favicon 对齐、头像派生色 token、手绘下划线、引用线、年份胶囊和动效调优。
- 最近 critique 评分为 `30/40 Good`，无 P0/P1。主要问题是手绘语言还偏局部装饰、首页归档选择过多、文章页工具控件偏 app 化。
- 产品定位保持不变：个人技术/生活长文博客，气质是 scholarly、restrained、deliberate，像 well-made notebook 或 letterpress book。

## Non-Goals

- 不改内容模型，不迁移文章 frontmatter。
- 不引入搜索、筛选、客户端归档交互或重型动画库。
- 不更换字体作为本轮必要范围；字体可作为后续单独 pass。
- 不为了风格牺牲长文阅读、深浅色对比、键盘访问或 reduced motion。
- 不改 SEO/discovery/llms 相关文件，除非新归档页需要常规 meta。

## Information Architecture

### Homepage `/`

首页变成安静入口，而不是完整目录。

保留：

- site header、Bio、头像、作者链接。
- 首页引用和轻量手绘身份标记。
- 最近写作列表，继续作为主要入口。
- 一个低调但明确的归档入口。

移除：

- 首页完整历史归档列表。
- 多年份展开的长索引。

首页归档入口应给读者两个信号：旧文仍然容易找到，但首页第一屏不再承担完整浏览任务。入口可以包含少量年份摘要或“全部归档”链接，但不能重新变成大列表。

### Archive Page `/archive/`

新增独立归档页，承载完整文章索引。

行为：

- 使用全部非 draft 文章。
- 按年份从新到旧分组。
- 每组内文章按日期从新到旧。
- 每篇显示标题和月/日日期。
- 页面应是静态 Astro 页面，不依赖客户端展开/折叠。

视觉：

- 归档页可以保持较高信息密度，但分隔线、日期、年份胶囊需要更轻、更像纸上压痕和边注。
- 年份标记沿用当前手绘胶囊方向，但避免每个年份都显得像强 CTA。
- 页面顶部需要一个简短标题和说明，让读者知道这是完整索引。

### Article Page `/[slug]/`

文章页不改内容结构，重点统一长文阅读控件。

处理范围：

- TOC trigger、mobile TOC panel、back-to-top、copy button、image lightbox。
- blockquote、正文链接下划线、上下篇导航。
- reading progress 保持功能反馈，不改成过度手绘。

目标是让工具控件像博客自身的一部分，而不是深色 app 浮层外挂。

## Visual System

### Token Layer

保留当前头像派生 token，并补充或整理语义用法：

- `--avatar-blue` / `--avatar-blue-bright`：主要强调、链接、活跃态。
- `--avatar-peach`：柔和背景、引用、年份/标签温度。
- `--paper` / `--ink`：页面底和正文墨色。
- `--support` / `--support-soft` / `--support-border`：归档、标签、边注、低调控件。

组件应优先使用语义 token，不在局部散落新的硬编码颜色。

### Scribble Layer

手绘资产限制为三类：

1. 横向下划线：链接 hover、文章行 hover、上下篇导航。
2. 竖向引用线：首页 quote 和正文 blockquote。
3. 年份/标签胶囊轮廓：归档年份、少量边注式标签。

不要为每个新控件创建新的手绘图形。手绘感负责人味和状态反馈，不负责装饰整页。

### List Language

首页最近写作、归档页文章列表、上下篇导航应共享同一种列表语法：

- 标题是主信息。
- 日期降噪，使用更安静的颜色和稳定数字宽度。
- 分隔线更轻，避免机械表格感。
- hover/focus 用短手绘线表达当前目标，但不改变布局。

### Control Language

浮动和工具控件从深色 app pill 转向低饱和纸/墨控件：

- 默认状态低对比、轻边框、纸色或透明背景。
- hover/focus/open 状态使用头像蓝或 support 色增强。
- 仍保持 44px 以上触控目标。
- 控件不使用 glassmorphism、重阴影或过强浮层感。

## Code Boundaries

保持 Astro 静态架构，不做大规模重构。只在能减少重复、稳定页面职责时抽小边界。

建议边界：

- `src/utils/posts.ts`：排序、取最近文章、按年份分组、日期格式 helper。
- `src/components/PostList.astro`：复用首页最近写作和归档页文章行的结构。
- `src/components/ArchiveYearPill.astro`：统一年份胶囊 markup。
- `src/components/QuietIconButton.astro` 或等价 CSS 规则：统一 TOC、返回顶部、copy 这类控件的视觉语言。

如果抽组件会造成范围膨胀，可以先用共享 CSS class 和 helper 函数完成，避免为了抽象而抽象。

## Data Flow

文章数据继续来自 `getCollection('blog', ({ data }) => !data.draft)`。

共享 helper 输出：

- `sortedPosts`：全部非 draft 文章，新到旧。
- `latestPosts`：首页最近写作列表。
- `archiveGroups`：完整年份分组，供 `/archive/` 使用。
- `archiveSummary`：首页归档入口需要的轻量摘要。

首页只消费 `latestPosts` 和 `archiveSummary`。归档页消费完整 `archiveGroups`。文章页继续由动态 slug 渲染，不需要改数据来源。

## Empty and Edge States

- 没有文章时，首页显示安静空状态；归档页显示“暂无归档”类文案。
- draft 文章永远不进入首页、归档页或结构化归档摘要。
- 日期排序统一使用 `Date.valueOf()`，避免字符串排序问题。
- `/archive/` 页面存在时，首页归档入口和 footer/header 链接都不应指向空路由。
- 本地视觉 QA 应避免 Astro dev toolbar 干扰；最终判断以 build/preview 或静态 dist 截图为准。

## Accessibility and Motion

- 所有交互控件保持可键盘访问。
- 触控目标保持 44px 以上。
- focus-visible 使用明确但克制的头像蓝或 support outline。
- `prefers-reduced-motion: reduce` 下关闭入场、hover 位移、面板过渡和复制反馈动画。
- 深浅色模式都需要检查正文、日期、年份胶囊、TOC active、blockquote 的对比度。

## Testing and Verification

Automated checks:

- `npm run build`
- `npm test`
- `git diff --check`

Targeted assertions:

- 首页只渲染最近写作和归档入口，不再渲染完整历史归档列表。
- `/archive/` 渲染所有非 draft 文章，并按年份和日期排序。
- 首页归档入口链接到 `/archive/`。
- 移动端无横向溢出。
- reduced motion 下关键动画关闭。
- TOC、返回顶部、copy button 等控件保持 44px 触控目标。

Manual QA:

- 首页桌面和移动端。
- `/archive/` 桌面和移动端。
- 至少一篇长文章，包含 TOC、blockquote、图片、代码块和上下篇导航。
- 深色模式检查首页、归档页和文章页。

## Implementation Phases

### Phase 1: Shared Data and Archive Route

建立 posts helper，新增 `/archive/` 页面，把完整归档从首页迁出。

### Phase 2: Homepage Quiet Entry

首页保留最近写作和轻量归档入口，移除完整归档列表，调整首屏节奏。

### Phase 3: Shared List and Year Styling

统一首页最近写作、归档页文章行、年份胶囊、日期和分隔线的纸感/手绘语言。

### Phase 4: Article Controls Alignment

统一 TOC、返回顶部、copy button、lightbox、blockquote、上下篇导航的控件语言。

### Phase 5: Verification

跑自动测试、静态构建、diff check，并用 Playwright 对首页、归档页和长文章做视觉/交互检查。

## Success Criteria

- 首页第一屏更安静，重点落在作者气质和最近写作。
- 完整旧文仍然通过 `/archive/` 清晰可达。
- 手绘线条、年份胶囊、日期、分隔线、控件属于同一套视觉语言。
- 文章页控件不再显得像外来的 app UI。
- 无 P0/P1 视觉或可访问性问题。
- 构建、测试、diff check 通过。
