# Avatar-Led Blog Style Adjustment Design

## Goal

以新头像作为视觉锚点，调整博客的整体气质：从当前偏冷、规整、工程化的 Astro 迁移风格，转向更有手写人格、轻松但仍然清晰的个人技术博客。

本规格先定义方向和约束，不在本阶段大面积改 CSS。

## Avatar Style Extraction

### Visual DNA

- 手绘肖像，不是照片或拟物插画。
- 线条是粗黑色、近似马克笔/蜡笔笔触，边缘有轻微抖动和像素化，应该被保留为“人味”，不应被磨平。
- 背景是高饱和蓝色涂抹，带明显重复笔触、空隙和方向变化。
- 面部用低饱和桃色大面积平涂，几乎没有阴影；表情轻松、友善、克制。
- 构图是近距离半身像，头发和眼镜形成最强识别符号。

### Sampled Palette

轻量采样得到的主色参考：

| Role | Color | Use |
| --- | --- | --- |
| Marker blue | `#1860C0` | 头像背景、主交互强调、局部手绘线条 |
| Bright blue | `#3090D8` | hover、选中态、浅色模式辅助强调 |
| Deep blue | `#3078C0` | 边框、链接 underline、深色模式强调 |
| Skin peach | `#FFC0A8` | 柔和背景、引用块、轻提示 |
| Warm cream | `#F0D8C0` | 卡片纸感、浅色背景微调 |
| Ink black | `#000000` | 少量描边、图标、强标题 |

整图平均色约 `#6486B0`，说明蓝色是整体记忆点，但不应把全站做成单一蓝色主题。

## Existing Blog Context

当前站点已经有这些稳定特征：

- `Bio.astro` 使用 `astro:assets` 的 `Image` 组件加载 `src/images/profile-pic.png`。
- 全站 token 位于 `src/styles/global.css`，主色为冷紫蓝 `--accent`，辅助色同属蓝紫系。
- 首页是安静的文章列表和归档结构，信息密度合适。
- `BambooShadow.astro` 提供竹影背景，带有东方、书写和安静阅读感。
- 正文排版已比较成熟，不能牺牲可读性换取装饰感。

## Style Direction

### Positioning

关键词：手写、纸感、清晰、轻松、克制。

这个博客不应该变成儿童涂鸦或插画作品集。头像带来的变化应该体现在细节：颜色更接近头像蓝，边框和背景更像纸上轻画，交互反馈更像轻轻划线，而不是大面积卡通化。

### Design Principles

1. **Avatar as signature, not wallpaper**
   首页 Bio 是唯一需要强头像存在感的地方。正文页保持安静，只在链接、标签、进度条和选择态里引用头像蓝。

2. **Keep reading first**
   正文宽度、字重、行高、代码块可读性不动大结构。任何风格变化都必须先通过长文阅读检查。

3. **Hand-drawn texture through micro details**
   用不完全均匀的下划线、轻微纸色背景、较粗的焦点描边表达手写感；避免全站涂鸦背景和过重阴影。

4. **Blue plus warm neutral**
   主色从冷紫蓝靠近头像蓝，但用 warm cream 和 peach 平衡，避免页面变成单色蓝。

5. **Roundness stays small**
   当前设计的 4-8px 圆角适合技术博客。头像本身可以圆形展示，但卡片和代码块不要大圆角。

## Proposed Visual System

### Color Tokens

建议新增或调整 token，而不是在组件里散落硬编码颜色：

```css
:root {
  --avatar-blue: oklch(49% 0.19 255);
  --avatar-blue-bright: oklch(62% 0.16 235);
  --avatar-peach: oklch(86% 0.055 50);
  --paper: oklch(97% 0.012 78);
  --ink: oklch(20% 0.015 250);
}
```

`--accent` 可以逐步映射到 `--avatar-blue`，`--support` 可以向更暖的 peach/cream 方向移动。

### Typography

- 保留当前 sans + serif 组合，不引入新字体。
- 标题不做手写字体，避免中文/英文混排质量下降。
- 可以让首页 quote 和年份标签更像“手写边注”：更小、更轻、更暖。

### Bio

- 头像显示可以从 48px 提升到 56px，给手绘线条更多空间。
- 增加 1px warm paper ring 或浅色边框，使蓝底从页面背景里立起来。
- hover 不再单纯 blur，可改成轻微 rotate/translate + ring 颜色变化，减少头像清晰度损失。

### Homepage

- 首页 intro 可以加入一条细的手绘感蓝色 underline 或左侧 marker stroke。
- 文章列表保持当前行式结构，但 hover underline 可变成更粗、更短、更像手划线的 accent stroke。
- 最新文章区域可使用极浅 paper tint，不使用嵌套卡片。

### Article Page

- 阅读进度条、正文链接、TOC active、tag hover 统一使用 avatar blue。
- blockquote 可引入 peach/cream 背景，和头像肤色呼应。
- 图片边框保持 4px 半径，但可以使用更温暖的边框色。

### Background

- 保留竹影作为博客的东方阅读感资产。
- 降低竹影和头像蓝的竞争：浅色模式竹影更淡，深色模式只保留氛围。
- 不增加大面积蓝色涂抹背景，否则会压过正文。

### Motion

- 维持 160-360ms 区间。
- Bio avatar hover 使用小幅 `translateY(-1px) rotate(-1deg)`。
- 链接 underline 用 `scaleX` 或 `background-size`，不加弹跳。
- 尊重 `prefers-reduced-motion`。

## Non-Goals

- 不改路由、SEO、llms/discovery 文件。
- 不引入重型动画库。
- 不重做信息架构。
- 不把全站变成蓝色插画页。
- 不牺牲正文中文阅读体验。

## Success Criteria

- 首页第一眼能感到新头像和站点风格是同一套视觉语言。
- 文章页仍然像一个安静、可信的技术博客。
- 浅色和深色模式都有可读、不过饱和的 accent。
- `npm run build` 通过。
- 截图检查移动端没有头像、Bio 链接或标题拥挤问题。
