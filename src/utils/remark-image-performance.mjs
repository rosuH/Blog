// Add safe default loading hints for markdown image nodes.
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

export default function remarkImagePerformance() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== 'image') return;
      node.data ||= {};
      node.data.hProperties ||= {};
      if (node.data.hProperties.loading == null) node.data.hProperties.loading = 'lazy';
      if (node.data.hProperties.decoding == null) node.data.hProperties.decoding = 'async';
    });
  };
}
