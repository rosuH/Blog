// Add safe default loading hints for markdown images.
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  const children = node.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      walk(child, visit);
    }
  }
}

export default function rehypeImagePerformance() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== 'element' || node.tagName !== 'img') return;
      node.properties ||= {};
      if (node.properties.loading == null) node.properties.loading = 'lazy';
      if (node.properties.decoding == null) node.properties.decoding = 'async';
    });
  };
}
