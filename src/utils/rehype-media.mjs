// Replaces <img data-media-marker="1"> nodes with the final <picture> or
// <figure data-livephoto> hast subtree, using the JSON payload that
// remark-media stored on data-media.

function h(tag, props = {}, children = []) {
  return { type: 'element', tagName: tag, properties: props, children };
}
function text(value) { return { type: 'text', value }; }

function captionNode(alt) {
  if (typeof alt !== 'string' || alt.trim() === '') return null;
  return h('figcaption', {}, [text(alt.trim())]);
}

function figureNode(children, alt, className = 'media-figure', props = {}) {
  const caption = captionNode(alt);
  return h('figure', { class: className, ...props }, caption ? [...children, caption] : children);
}

function pictureNode({ key, alt, width, height, products, loading = 'lazy' }) {
  const base = `/_media/${key}`;
  const has2x = !!products.still_2x_jpg;
  const avifSrcset = has2x
    ? `${base}/${products.still_1x_avif} 1x, ${base}/${products.still_2x_avif} 2x`
    : `${base}/${products.still_1x_avif} 1x`;
  const webpSrcset = has2x
    ? `${base}/${products.still_1x_webp} 1x, ${base}/${products.still_2x_webp} 2x`
    : `${base}/${products.still_1x_webp} 1x`;
  const img = h('img', {
    src: `${base}/${products.still_1x_jpg}`,
    width, height, alt,
    loading, decoding: 'async',
  });
  if (has2x) img.properties.srcset = `${base}/${products.still_2x_jpg} 2x`;
  return h('picture', {}, [
    h('source', { type: 'image/avif', srcset: avifSrcset }),
    h('source', { type: 'image/webp', srcset: webpSrcset }),
    img,
  ]);
}

function livePhotoNode({ stillKey, videoKey, alt, width, height, products }) {
  const videoBase = `/_media/${videoKey}`;
  const picture = pictureNode({ key: stillKey, alt, width, height, products });
  const video = h('video', {
    class: 'livephoto-video',
    'data-lp-video': '',
    muted: true,
    playsinline: true,
    preload: 'none',
    width, height,
    'aria-hidden': 'true',
  }, [
    h('source', { src: `${videoBase}/${products.video_hevc}`, type: 'video/mp4; codecs="hvc1"' }),
    h('source', { src: `${videoBase}/${products.video_h264}`, type: 'video/mp4' }),
  ]);
  const badge = h('button', {
    type: 'button',
    class: 'livephoto-badge',
    'aria-label': 'Live Photo — 悬停或长按播放',
  }, [
    {
      type: 'element', tagName: 'svg',
      properties: { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true' },
      children: [
        h('circle', { cx: 8, cy: 8, r: 6.5, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.2 }),
        h('circle', { cx: 8, cy: 8, r: 3.6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.2 }),
        h('circle', { cx: 8, cy: 8, r: 1.4, fill: 'currentColor', class: 'livephoto-dot' }),
      ],
    },
    h('span', {}, [text('LIVE')]),
  ]);
  return figureNode([picture, video, badge], alt, 'livephoto media-figure', {
    'data-livephoto': '',
    'data-state': 'idle',
    style: `aspect-ratio: ${width} / ${height};`,
  });
}

function generatedPictureNode(payload) {
  return pictureNode({
    key: payload.stillKey,
    alt: payload.alt,
    width: payload.width,
    height: payload.height,
    products: payload.products,
  });
}

function isWhitespace(node) {
  return node.type === 'text' && /^\s*$/.test(node.value || '');
}

function paragraphHasOnlyChild(paragraph, child) {
  if (!paragraph || paragraph.type !== 'element' || paragraph.tagName !== 'p') return false;
  return paragraph.children.every((node) => node === child || isWhitespace(node));
}

function replaceStandaloneParagraph(parent, index, grandparent, parentIndex, replacement) {
  if (parent && paragraphHasOnlyChild(parent, parent.children[index]) && grandparent && parentIndex >= 0) {
    grandparent.children[parentIndex] = replacement;
    return true;
  }
  return false;
}

function walk(node, visit, parent = null, index = -1, grandparent = null, parentIndex = -1) {
  if (!node || typeof node !== 'object') return;
  visit(node, parent, index, grandparent, parentIndex);
  if (Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      walk(node.children[i], visit, node, i, parent, index);
    }
  }
}

export default function rehypeMedia() {
  return (tree) => {
    walk(tree, (node, parent, index, grandparent, parentIndex) => {
      if (node.type !== 'element' || node.tagName !== 'img') return;
      // Defaults from non-HEIC pass-through (already preserved by remark)
      const props = node.properties || {};
      if (!props['dataMediaMarker'] && !props['data-media-marker']) {
        // ensure loading/decoding hints (works for property-cased and dash-cased)
        if (props.alt == null) props.alt = '';
        if (props.loading == null) props.loading = 'lazy';
        if (props.decoding == null) props.decoding = 'async';
        if (parent?.tagName === 'a') return;
        const figure = figureNode([node], props.alt);
        replaceStandaloneParagraph(parent, index, grandparent, parentIndex, figure);
        return;
      }
      // Marker is set — this img MUST be replaced. If anything goes wrong
      // (missing payload, parse error), drop the node entirely rather than
      // leaving a broken <img src=".heic"> in the output.
      if (!parent) return;
      const raw = props.dataMedia ?? props['data-media'];
      let payload = null;
      if (raw) {
        try { payload = JSON.parse(raw); } catch { payload = null; }
      }
      if (!payload) {
        // Replace with a comment instead of splicing so the walker's index
        // stays correct for any siblings. The comment is a diagnostic
        // breadcrumb and renders as nothing visible.
        parent.children[index] = {
          type: 'comment',
          value: ' rehype-media: media payload missing or unparseable ',
        };
        return;
      }
      const picture = generatedPictureNode(payload);
      const figure = payload.kind === 'livephoto'
        ? livePhotoNode(payload)
        : figureNode([picture], payload.alt, 'media-figure media-figure--generated');
      if (replaceStandaloneParagraph(parent, index, grandparent, parentIndex, figure)) return;
      parent.children[index] = picture;
    });
  };
}
