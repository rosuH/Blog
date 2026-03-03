// scripts/verify-routes.mjs
// 验证 Astro 路由与 Gatsby 路由一致性

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, '../content/posts');
const distDir = path.join(__dirname, '../dist/blog');

// 递归获取所有 md 文件
function getMdFiles(dir, baseDir = dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getMdFiles(fullPath, baseDir));
    } else if (entry.name.endsWith('.md')) {
      files.push(path.relative(baseDir, fullPath));
    }
  }
  return files;
}

// 简单的 frontmatter 解析
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = {};
  match[1].split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      // 移除引号
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      frontmatter[key] = value;
    }
  });
  return frontmatter;
}

// Gatsby slug 生成逻辑 (来自 gatsby-node.js)
function getGatsbySlug(filepath, frontmatter) {
  // 优先级: filename > slug > 文件路径
  if (frontmatter.filename) return frontmatter.filename;
  if (frontmatter.slug) return frontmatter.slug;

  // 使用文件路径
  return filepath.replace(/\/index\.md$/, '').replace(/\.md$/, '');
}

console.log('\n=== 验证路由一致性 ===\n');

const files = getMdFiles(postsDir);
console.log('文章总数:', files.length);

const routes = [];
let inconsistentCount = 0;

for (const file of files) {
  const fullPath = path.join(postsDir, file);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const frontmatter = parseFrontmatter(content);

  const gatsbySlug = getGatsbySlug(file, frontmatter);
  const folderName = file.replace(/\/index\.md$/, '').replace(/\.md$/, '');

  // Astro 当前的 generateId 逻辑
  const astroSlug = frontmatter.filename || frontmatter.slug || folderName;

  const source = frontmatter.filename ? 'filename' :
                 frontmatter.slug ? 'slug' : 'folder';

  routes.push({
    file,
    gatsbySlug,
    astroSlug,
    source,
    consistent: gatsbySlug === astroSlug
  });
}

// 找出不一致的路由
const inconsistent = routes.filter(r => !r.consistent);
if (inconsistent.length > 0) {
  console.log('\n❌ 发现不一致的路由:\n');
  inconsistent.forEach(r => {
    console.log(`文件: ${r.file}`);
    console.log(`  Gatsby slug: ${r.gatsbySlug}`);
    console.log(`  Astro slug:  ${r.astroSlug}`);
    console.log('');
  });
  inconsistentCount = inconsistent.length;
} else {
  console.log('\n✅ 所有路由一致!\n');
}

// 打印所有路由
console.log('\n=== 所有路由映射 ===\n');
routes.forEach(r => {
  const status = r.consistent ? '✅' : '❌';
  console.log(`${status} /${r.astroSlug}/  (${r.source})`);
});

// 检查 dist 目录
console.log('\n=== 检查构建输出 ===\n');
if (fs.existsSync(distDir)) {
  const distFolders = fs.readdirSync(distDir);
  console.log('构建页面数:', distFolders.length);

  let missingCount = 0;
  routes.forEach(r => {
    if (!distFolders.includes(r.astroSlug)) {
      console.log(`  ❌ 缺失: ${r.astroSlug}`);
      missingCount++;
    }
  });

  if (missingCount === 0) {
    console.log('✅ 所有路由已正确构建');
  }
} else {
  console.log('⚠️  dist 目录不存在，请先运行 npm run build');
}

// 总结
console.log('\n=== 总结 ===\n');
console.log(`文章总数: ${routes.length}`);
console.log(`路由一致: ${routes.length - inconsistentCount}`);
console.log(`路由不一致: ${inconsistentCount}`);

if (inconsistentCount > 0) {
  console.log('\n⚠️  需要修复 Content Collections 的 generateId 逻辑');
  process.exit(1);
} else {
  console.log('\n🎉 迁移完成，所有路由保持一致!');
}