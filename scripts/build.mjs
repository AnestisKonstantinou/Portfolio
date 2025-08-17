// scripts/build.mjs
import { promises as fs } from "fs";
import path from "path";
import posthtml from "posthtml";
import include from "posthtml-include";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "dist");

// folders we should skip while scanning
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", ".github", "netlify", "partials"]);

// collect all .html files under a directory (recursively), skipping SKIP_DIRS
async function collectHtml(startDir) {
  const files = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return; // dir may not exist
    }
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      const rel = path.relative(ROOT, abs);
      if (e.isDirectory()) {
        const top = rel.split(path.sep)[0];
        if (SKIP_DIRS.has(top)) continue;
        await walk(abs);
      } else if (e.isFile() && e.name.toLowerCase().endsWith(".html")) {
        files.push(rel);
      }
    }
  }
  await walk(path.join(ROOT, startDir));
  return files;
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function copyDir(src, dest) {
  try {
    const stat = await fs.stat(src);
    if (!stat.isDirectory()) return;
  } catch {
    return; // src doesn't exist, skip
  }
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      await copyDir(s, d);
    } else if (e.isFile()) {
      await fs.copyFile(s, d);
    }
  }
}

async function main() {
  // clean dist
  await fs.rm(OUT, { recursive: true, force: true });
  await ensureDir(OUT);

  // gather pages: /en/**, /el/**, and root *.html
  const enPages = await collectHtml("en");
  const elPages = await collectHtml("el");
  const rootPages = (await collectHtml(".")).filter(f => !f.startsWith("en/") && !f.startsWith("el/"));

  const pages = [...new Set([...enPages, ...elPages, ...rootPages])];

  const processor = posthtml([include({ root: ROOT })]);

  // process each page and write to dist preserving relative paths
  for (const rel of pages) {
    const src = path.join(ROOT, rel);
    const out = path.join(OUT, rel);
    const html = await fs.readFile(src, "utf8");
    const result = await processor.process(html);
    await ensureDir(path.dirname(out));
    await fs.writeFile(out, result.html, "utf8");
  }

  // if there is no root index.html in pages, create one that redirects to /en/
  if (!pages.some(p => p.toLowerCase() === "index.html")) {
    const redirect = `<!doctype html><meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=/en/">
<link rel="canonical" href="/en/">`;
    await fs.writeFile(path.join(OUT, "index.html"), redirect, "utf8");
  }

  // copy assets if they exist
  await copyDir(path.join(ROOT, "images"), path.join(OUT, "images"));
  await copyDir(path.join(ROOT, "css"), path.join(OUT, "css"));
  await copyDir(path.join(ROOT, "js"), path.join(OUT, "js"));

  console.log(`Built ${pages.length} HTML file(s) into dist/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
