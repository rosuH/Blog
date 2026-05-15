# Avatar-Led Blog Style Adjustment Plan

## Goal

在新头像已经替换的基础上，分阶段把博客视觉语言调整到“手绘、纸感、清晰、轻松、克制”，同时保持路由、SEO 和阅读体验稳定。

## Phase 1: Avatar Replacement

Status: `completed`

- [x] 新建分支 `codex/avatar-style-plan`
- [x] 替换 `src/images/profile-pic.png`
- [x] 同步替换遗留头像资源 `src/images/profile-pic.jpeg` 和 `public/profile-pic.jpeg`
- [x] 构建验证 Astro 头像产物

## Phase 2: Style Extraction

Status: `completed`

- [x] 读取头像视觉特征
- [x] 采样头像主色
- [x] 明确博客现有视觉约束
- [x] 输出设计规格：`docs/superpowers/specs/2026-05-13-avatar-style-adjustment-design.md`

## Phase 3: Token Pass

Status: `completed`

- [x] 在 `src/styles/global.css` 增加头像派生 token：blue、bright blue、peach、paper、ink
- [x] 将 `--accent` 从冷紫蓝微调到头像蓝
- [x] 将 `--support` 从同色系蓝紫微调到更暖的辅助色
- [x] 同步深色模式 token，避免纯蓝过亮

## Phase 4: Bio Pass

Status: `completed`

- [x] 评估头像显示尺寸从 48px 提升到 56px
- [x] 增加 warm paper ring 或 1px 浅描边
- [x] 将头像 hover 从 blur 改成轻微位移/旋转/边框反馈
- [x] 检查移动端 Bio 链接换行和点击区域

## Phase 5: Homepage Detail Pass

Status: `completed`

- [x] 调整 tagline 左边框为 avatar blue + 低饱和透明度
- [x] 将文章 hover underline 改成更像 marker stroke 的短线反馈
- [x] 用极浅 paper tint 区分最新文章区域，但不做浮动大卡片
- [x] 保持归档列表密度和年份锚点可扫描性

## Phase 6: Article Detail Pass

Status: `completed`

- [x] 阅读进度条、正文链接、TOC active 和 tag hover 统一使用头像蓝
- [x] blockquote 背景引入 peach/cream 呼应头像肤色
- [x] 检查代码块、表格、图片 caption 在浅/深色模式下的对比度
- [x] 保持正文宽度、行高和媒体尺寸约束不变

## Phase 7: Verification

Status: `completed`

- [x] `npm run build`
- [x] `npm test` 或至少现有 UI 回归测试
- [x] 本地预览首页与一篇长文
- [x] 截图检查桌面和移动端
- [x] `git diff --check`

## Phase 8: Favicon Alignment

Status: `completed`

- [x] 用新头像生成 `public/favicon.ico`
- [x] 用新头像生成 `public/favicon-32x32.png`
- [x] 用新头像生成 `public/apple-touch-icon.png`
- [x] 给 favicon 链接增加版本参数，避开浏览器旧图标缓存

## Phase 9: Scribble Highlight Lines

Status: `completed`

- [x] 新增可复用的 rough underline SVG mask
- [x] 正文链接 hover underline 从直线改为轻微波动的双笔触涂鸦线
- [x] 首页 intro 和文章列表 hover 线条套用同一涂鸦 mask
- [x] 文章页上下篇导航 hover 线条套用同一涂鸦 mask
- [x] hover 动画使用 `clip-path` 按长度揭开线条，避免 `scaleX()` 拉伸涂鸦纹理
- [x] 首页 quote 与正文 blockquote 左侧高亮改为竖向手划笔触
- [x] 保留阅读进度条为直线功能反馈，避免滚动状态变得不清晰

## Phase 10: Quiet Motion Tuning

Status: `completed`

- [x] 新增 `--ease-quiet` / `--duration-quiet` 作为克制动效 token
- [x] 首页首屏与最近文章入场动画降低位移和 stagger 强度
- [x] intro underline 与 quote 竖线改为 `clip-path` 描线揭开
- [x] 文章页 header、上下篇导航、lightbox、移动 TOC、返回顶部统一改为短促轻动效
- [x] 去掉 TOC 跳转时正文整体淡出
- [x] 明暗主题切换 pulse 与图标旋转降幅
- [x] 补充 UI 回归测试覆盖 motion token、描线动画、reduced motion
- [x] Playwright 验证 hover underline、reduced motion 和无横向溢出

## Phase 11: Audit Fixes

Status: `completed`

- [x] Lightbox 关闭态使用 `inert`，避免隐藏 backdrop/image 进入 Tab 顺序
- [x] 移动端 TOC 关闭态使用 `inert`，并补充 `aria-controls`
- [x] 修正桌面 TOC 点击时调用移动 TOC close 后的误聚焦
- [x] 提升 subtle/support token 对比度
- [x] 将 Bio 链接、移动 TOC、返回顶部等触控目标统一到 44px+
- [x] 去掉浮动控件与 Live Photo badge 的玻璃化视觉残留
- [x] 压缩头像派生图，降低 public/source 资产体积
- [x] 补充 UI 回归测试覆盖 a11y/touch/material 防回退
- [x] `npm test`
- [x] `git diff --check`
- [x] Playwright 验证键盘顺序、对比度、截图

## Implementation Notes

- 每次只改一个层级：tokens -> Bio -> homepage -> article。
- 优先使用现有组件和 CSS token，不引入新依赖。
- 任何偏“可爱化”的改动都应该回退到更克制的纸感/手写细节。
