// Replaces <img data-media-marker="1"> nodes with the final <picture> or
// <figure data-livephoto> hast subtree, using the JSON payload that
// remark-media stored on data-media.

function h(tag, props = {}, children = []) {
  return { type: 'element', tagName: tag, properties: props, children };
}
function text(value) { return { type: 'text', value }; }

function pictureNode({ hash, alt, width, height, products, loading = 'lazy' }) {
  const base = `/_media/${hash}`;
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

function livePhotoNode({ stillHash, videoHash, alt, width, height, products }) {
  const videoBase = `/_media/${videoHash}`;
  const picture = pictureNode({ hash: stillHash, alt, width, height, products });
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
  return h('figure', {
    class: 'livephoto',
    'data-livephoto': '',
    'data-state': 'idle',
    style: `aspect-ratio: ${width} / ${height};`,
  }, [picture, video, badge]);
}

function walk(node, visit, parent = null, index = -1) {
  if (!node || typeof node !== 'object') return;
  visit(node, parent, index);
  if (Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      walk(node.children[i], visit, node, i);
    }
  }
}

export default function rehypeMedia() {
  return (tree) => {
    walk(tree, (node, parent, index) => {
      if (node.type !== 'element' || node.tagName !== 'img') return;
      // Defaults from non-HEIC pass-through (already preserved by remark)
      const props = node.properties || {};
      if (!props['dataMediaMarker'] && !props['data-media-marker']) {
        // ensure loading/decoding hints (works for property-cased and dash-cased)
        if (props.loading == null) props.loading = 'lazy';
        if (props.decoding == null) props.decoding = 'async';
        return;
      }
      const raw = props.dataMedia ?? props['data-media'];
      if (!raw || !parent) return;
      let payload;
      try { payload = JSON.parse(raw); } catch { return; }
      const node2 = payload.kind === 'livephoto'
        ? livePhotoNode(payload)
        : pictureNode({
            hash: payload.stillHash,
            alt: payload.alt,
            width: payload.width,
            height: payload.height,
            products: payload.products,
          });
      parent.children[index] = node2;
    });
  };
}
