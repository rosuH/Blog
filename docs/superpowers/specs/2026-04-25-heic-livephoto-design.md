# HEIC + Live Photo 支持 — 设计文档

**日期**：2026-04-25
**分支**：`astro-migration`
**作者**：rosu (assisted by Claude)

## 背景

博客使用 Astro 5 静态构建。作者希望直接把 iPhone 导出的 HEIC（含 Live Photo 配对 MOV）拖进文章目录就能正常显示，不用手动转格式或写额外语法。

当前问题：
- HEIC 仅 Safari 原生支持。Chrome/Firefox/Edge 显示坏图。
- Live Photo 在 Web 上没有现成的轻量方案（Apple 的 LivePhotosKit JS 已停更、体积大）。
- iOS 导出的 Live Photo MOV 是 HEVC，Chrome/Firefox 桌面端不能直接播。

## 决策摘要

| 决策点 | 选择 |
|---|---|
| 触发方式 | HEIC + 同名 `.mov` 自动配对（"originals" 导出工作流） |
| 静帧输出 | AVIF + WebP + JPEG 三档，1× / 2× 两种尺寸（≤800px 仅 1×） |
| 视频输出 | HEVC MP4（remux）+ H.264 MP4（转码）双源，**完全静音**（`-an`） |
| 交互 | iOS 风格：左上 LIVE 徽章；桌面 hover、移动 long-press；播完一遍自动停回静帧 |
| Markdown 语法 | 零变更：`![alt](file.heic)` 原样写法，构建时自动判断 |
| 缓存 | 内容寻址 SHA-256 + processor 版本号，跨次构建持久化 |
| CI | GitHub Actions ubuntu-latest（已预装 ffmpeg；sharp 0.33+ prebuilt 含 HEIF 解码） |

## 架构

```
content/posts/<slug>/
  ├─ tea.heic              ← 作者拖入
  └─ tea.mov               ← 可选配对，自动检测

   ── 构建时 ──
remark-media 插件遍历 image 节点
        │
        ├─ 非 .heic → 沿用旧逻辑：lazy/async hint → 通过
        │
        └─ .heic   → 解析同目录 same-basename .mov
                    → 询问 MediaCache 拿到所有产物 URL
                    → 把 mdast image 节点上的 data.hProperties
                       塞入元数据；标记节点类型
                    → rehype 阶段读取元数据，替换为
                       <picture>（HEIC alone）或
                       <figure data-livephoto>（HEIC + MOV）

MediaCache（read-through）
  - key = sha256(source_bytes) + PROCESSOR_VERSION
  - 命中 → 复制到 public/_media/<hash>/
  - 未命中 → 跑 HeicProcessor / MovProcessor → 写 .cache/media/<hash>/ → 复制
```

### 模块边界

- **`src/utils/media-cache.mjs`**：单一职责的缓存层。导出 `getOrBuild(sourcePath, kind)`，返回 `{ hash, products: { ... } }`。内部包含 HEIC processor + MOV processor。所有文件 IO 都在这里。
- **`src/utils/remark-media.mjs`**：替换现有 `remark-image-performance.mjs`。两件事：(1) 给非 HEIC 的 `<img>` 加 `loading=lazy`/`decoding=async`（保持当前行为不退化）；(2) 检测 HEIC，把媒体元数据塞入节点 `data.hProperties.dataMedia`（JSON.stringified 字符串）。
- **`src/utils/rehype-media.mjs`**：拿到 `data-media` 属性后展开成最终 `<picture>` 或 `<figure>` HTML 节点。替换现有 `rehype-image-performance.mjs`。
- **`src/components/LivePhoto.astro`**：纯展示组件（接收 props，不做构建）。提供 HTML 结构 + scoped CSS + `is:inline` 行为脚本。
- **`src/components/Picture.astro`**：纯 HEIC 静态图情况复用（也可以被未来其他图片管线复用）。
- **`.cache/media/`**：gitignored，构建产物缓存，按 hash 分目录。
- **`public/_media/<hash>/`**：每次构建从缓存复制过来的实际服务文件。

### 数据流（一次构建）

```
1. Astro 启动
2. remark/rehype pipeline 加载 → MediaCache 单例创建
3. 对每篇 markdown：
   a. 遍历 image 节点
   b. .heic 命中 → MediaCache.getOrBuild(absPath, 'heic')
                  → 内部检查同 basename .mov，存在则同时 getOrBuild(..., 'mov')
                  → 返回 { still: { avif, webp, jpg @ 1x/2x }, video?: { hevc, h264 }, dims }
   c. 节点 data.hProperties 加 data-media + 临时 marker class
4. rehype 阶段把 marker 节点替换为最终 hast tree
5. Astro build 把 public/_media 整目录拷到 dist/
6. 构建结束：
   - GC：扫描 .cache/media/ 下超过 60 天 mtime 且未被本次引用的目录，删除
```

### 缓存键

```
hash = sha256(file_bytes).hex.slice(0,16) + ":" + PROCESSOR_VERSION
```

`PROCESSOR_VERSION = 1`。修改输出策略（质量/尺寸/编解码参数）时 bump version → 旧缓存失效。

`.cache/media/<hash>/meta.json`：
```json
{
  "version": 1,
  "kind": "heic" | "mov",
  "src_basename": "tea",
  "dimensions": { "width": 3158, "height": 4501 },
  "products": {
    "still_1x_avif": "img-1600w.avif",
    "still_1x_webp": "img-1600w.webp",
    "still_1x_jpg":  "img-1600w.jpg",
    "still_2x_avif": "img-3200w.avif",
    ...
  }
}
```

## HEIC 处理

依赖：`sharp@^0.33`（prebuilt 二进制带 HEIF 解码，基于 libde265）。

启动时硬探测：
```js
if (!sharp.format.heif?.input?.file) {
  throw new Error('sharp HEIF decoder unavailable. Need sharp@^0.33 with libvips-heif.');
}
```

每张 HEIC：
```js
const img = sharp(srcPath).rotate();             // 自动方向校正
const meta = await img.metadata();                // 拿到原始宽高
const w1 = Math.min(meta.width, 1600);
const w2 = meta.width >= w1 * 2 ? w1 * 2 : null;  // 2x 仅当原图够大才生成
const sizes = [w1, w2].filter(Boolean);

for (const w of sizes) {
  const base = img.clone().resize({ width: w, withoutEnlargement: true });
  await base.clone().avif({ quality: 65, effort: 4 }).toFile(`${dir}/img-${w}w.avif`);
  await base.clone().webp({ quality: 80 }).toFile(`${dir}/img-${w}w.webp`);
  await base.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(`${dir}/img-${w}w.jpg`);
}
```

输出 HTML：
```html
<picture>
  <source type="image/avif" srcset="/_media/<hash>/img-1600w.avif 1x, /_media/<hash>/img-3200w.avif 2x">
  <source type="image/webp" srcset="/_media/<hash>/img-1600w.webp 1x, /_media/<hash>/img-3200w.webp 2x">
  <img src="/_media/<hash>/img-1600w.jpg"
       srcset="/_media/<hash>/img-3200w.jpg 2x"
       width="3158" height="4501"
       alt="..." loading="lazy" decoding="async">
</picture>
```

## MOV 处理

依赖：系统 `ffmpeg`（ubuntu-latest 预装、本地 macOS 也有）。启动探测：
```sh
ffmpeg -hide_banner -codecs | grep -E 'libx264|hevc' || throw
```

每个 MOV 输出两路：

**HEVC MP4（remux only）**：
```sh
ffmpeg -y -i src.mov -an -c:v copy -tag:v hvc1 \
       -movflags +faststart out.hevc.mp4
```
- `-an`：完全去掉音频流
- `-c:v copy`：不重新编码，秒级
- `-tag:v hvc1`：Safari 要求的 codec tag

**H.264 MP4（转码 fallback）**：
```sh
ffmpeg -y -i src.mov -an -c:v libx264 -preset slow -crf 23 \
       -pix_fmt yuv420p -movflags +faststart out.h264.mp4
```

## Live Photo 组件

```html
<figure class="livephoto" data-livephoto data-state="idle">
  <picture><!-- 三档静帧 --></picture>
  <video data-lp-video muted playsinline preload="none"
         width="..." height="..." aria-hidden="true">
    <source src="/_media/<hash>/clip.hevc.mp4" type="video/mp4; codecs=hvc1">
    <source src="/_media/<hash>/clip.h264.mp4" type="video/mp4">
  </video>
  <button class="livephoto-badge"
          type="button"
          aria-label="Live Photo — 按住或悬停播放">
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <!-- iOS 同心圆 LIVE 图标 -->
    </svg>
    <span>LIVE</span>
  </button>
</figure>
```

### 行为脚本（`is:inline`，~60 行）

伪代码：
```js
for (const fig of document.querySelectorAll('[data-livephoto]')) {
  const video = fig.querySelector('[data-lp-video]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let pressTimer;
  const start = () => {
    fig.dataset.state = 'playing';
    video.currentTime = 0;
    video.play().catch(() => {});
  };
  const stop = () => {
    video.pause();
    video.currentTime = 0;
    fig.dataset.state = 'idle';
  };

  video.addEventListener('ended', stop);

  if (reduce) {
    // 仅可点徽章，按一次播一次
    fig.querySelector('.livephoto-badge').addEventListener('click', () => {
      fig.dataset.state === 'playing' ? stop() : start();
    });
  } else {
    fig.addEventListener('mouseenter', start);
    fig.addEventListener('mouseleave', stop);
    fig.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch') return;
      pressTimer = setTimeout(start, 200);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
      fig.addEventListener(ev, () => { clearTimeout(pressTimer); stop(); })
    );
    // 键盘可访问
    fig.querySelector('.livephoto-badge').addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); start(); }
    });
  }

  // 视口外不预加载（preload=none 已经够省，这里是再保一层）
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting && fig.dataset.state === 'playing') stop();
  }, { rootMargin: '200px' }).observe(fig);
}
```

### 视觉细节（CSS scoped 在组件内）

- 徽章位置：`position: absolute; top: 12px; left: 12px;`
- 徽章背景：light `rgba(0,0,0,0.45)`，dark `rgba(255,255,255,0.12)`
- `backdrop-filter: blur(8px) saturate(1.4)`，圆角 `999px`
- padding `4px 10px 4px 8px`，gap `6px`，font: `--font-mono` 11px / 600 / `letter-spacing: 0.06em`
- 文字 light 模式 `#fff`，dark 模式 `var(--bg)`
- SVG 同心圆（外圈实心 + 内圈空心 + 中心点），白/暗色自适应
- 状态切换：
  - `[data-state="idle"]` → `<picture>` opacity 1, `<video>` opacity 0
  - `[data-state="playing"]` → 反过来
  - 切换 transition `opacity 0.18s ease-out`
- 播放时徽章中心点做 `1.4s ease-in-out infinite` 慢呼吸
- 不加边框/阴影/hover 缩放，与 Zed 风格一致

## Markdown / Remark / Rehype Pipeline

替换 `remark-image-performance.mjs` + `rehype-image-performance.mjs` 为 `remark-media.mjs` + `rehype-media.mjs`。

**remark-media** 拿到 markdown image 节点：
1. 解析 `node.url`，取扩展名
2. 非 HEIC：原行为（lazy/async）
3. HEIC：
   - 通过 vfile.history 拿到 markdown 文件绝对路径 → 推 HEIC 绝对路径
   - 同 basename 的 `.mov` 是否存在 → fs.statSync
   - `await mediaCache.getOrBuild(...)` → 拿到 products 列表
   - 把整个产物清单序列化进 `node.data.hProperties['data-media']`，加 marker class `media-heic` 或 `media-livephoto`

**rehype-media** 看到带 `data-media` 的 `<img>` 节点：
- 解析 JSON
- 替换为完整的 `<picture>`（HEIC alone）或 `<figure>`（LivePhoto）hast 子树
- 保留 `alt` 属性
- **不**把紧邻的 markdown emphasis 段当作 figcaption — 保持现有行为：caption 仍然是独立的 `<p><em>...</em></p>`，与新系统并存

## 错误处理

| 情况 | 行为 |
|---|---|
| sharp 不支持 HEIF | 启动检查 → throw，构建立即失败 |
| ffmpeg 缺失/缺 libx264 | 启动检查 → throw |
| HEIC 损坏 | 单文件 catch → 日志 + 降级渲染 `<img>` 指向源文件 + 警告 alt（构建不中断） |
| MOV 损坏 | 单文件 catch → 退化为纯 `<picture>`（无 LIVE）+ 日志 |
| HEIC > 50MB | 拒绝，构建失败提示压缩 |
| 缓存目录 IO 失败 | 退化为 in-memory 处理（不写缓存）+ 警告 |

## 可访问性

- LivePhoto 用 `<figure>` 语义包裹（仅承载 `<picture>` + `<video>` + 徽章按钮，**不**含 caption）；caption 仍是独立段落
- 徽章是真实 `<button type="button">`，可 tab focus，aria-label 说明用法
- `<video aria-hidden="true">` — 视觉等价由 `<img alt>` 提供
- `prefers-reduced-motion: reduce` → 自动 hover 播放禁用，徽章变成可点切换
- 移动端 long-press 时段拦截 `contextmenu`，避免与系统「保存图片」冲突

## CI 集成

`.github/workflows/deploy_astro.yml` 在 `Install dependencies` 之后、`Build Astro site` 之前插入：

```yaml
- name: Cache media derivatives
  uses: actions/cache@v4
  with:
    path: .cache/media
    key: media-${{ hashFiles('content/posts/**/*.heic', 'content/posts/**/*.mov') }}
    restore-keys: media-

- name: Verify media tooling
  run: |
    ffmpeg -hide_banner -codecs 2>&1 | grep -E 'libx264' >/dev/null || (echo "ffmpeg missing libx264"; exit 1)
    node -e "import('sharp').then(s => { if (!s.default.format.heif?.input?.file) { console.error('sharp HEIF decoder missing'); process.exit(1); } })"
```

不需要换 runner、不需要装额外 apt 包。

## 测试

延续现有 `tests/performance-output.test.mjs` 的快照风格，新增：

1. **媒体产物快照**：`tests/media-output.test.mjs`
   - 引用 HEIC 的页面：`dist/<slug>/index.html` 含 `<picture>`、`<source type="image/avif">`、且不含 `.heic` 字符串
   - 引用 HEIC + MOV 的页面：含 `data-livephoto`、`<source ... codecs=hvc1>`、`<source type="video/mp4">`
2. **缓存幂等性**：连跑两次 build，第二次 processor 调用计数为 0（用 `process.env.MEDIA_TEST_COUNTER=1` 暴露 counter）

## 文件清单

新增：
- `src/utils/media-cache.mjs`
- `src/utils/remark-media.mjs`
- `src/utils/rehype-media.mjs`
- `src/components/LivePhoto.astro`
- `src/components/Picture.astro`
- `tests/media-output.test.mjs`
- `.cache/media/` 入 `.gitignore`
- `public/_media/` 入 `.gitignore`（构建产物）

修改：
- `astro.config.mjs`：换插件名 + 注册新组件路径
- `.github/workflows/deploy_astro.yml`：加 cache + verify steps

删除：
- `src/utils/remark-image-performance.mjs`（功能并入 remark-media）
- `src/utils/rehype-image-performance.mjs`（同上）

## 回滚

整个变更打成单 commit，需要回滚 `git revert <sha>` 即可。`.cache/media/` 和 `public/_media/` 是构建产物、无副作用残留。markdown 文件零修改，旧文章语法保持兼容。

## YAGNI 边界

明确**不做**：
- 多种宽度断点 srcset（只 1×/2× 够用，CLS 已被 width/height 防住）
- 客户端 JS HEIC 解码（heic2any 太重）
- LivePhoto 循环播放（与 iOS 行为一致：单次播放）
- LivePhoto 长按保存原图（浏览器自带功能足够）
- HEIC 动图（image sequences）— 当前测试文件不是这种，先不做
- Lightbox/灯箱放大 — 不在本次范围
