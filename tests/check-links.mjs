// Dependency-free link + asset checker (Node built-in fetch, no packages).
//   node tests/check-links.mjs            → check internal refs + external URLs
//   node tests/check-links.mjs --internal → skip the network (deterministic, fast)
// Exits non-zero if any internal asset/anchor is missing or any external URL is dead.
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const internalOnly = process.argv.includes('--internal');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) link-check/1.0';

const read = (rel) => readFile(path.join(ROOT, rel), 'utf8');
const exists = (rel) => access(path.join(ROOT, rel)).then(() => true, () => false);

const problems = [];
const seenExternal = new Map();

function refsFromHtml(html) {
  const out = [];
  for (const m of html.matchAll(/(?:href|src)\s*=\s*"([^"]+)"/g)) out.push(m[1]);
  // og/twitter/canonical image+url meta
  for (const m of html.matchAll(/<(?:meta|link)[^>]*(?:content|href)="(https?:\/\/[^"]+)"/g)) out.push(m[1]);
  return out;
}
function urlsFromCss(css) {
  return [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map(m => m[1]);
}

function idsOf(html) {
  return new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
}

async function checkExternal(url) {
  if (seenExternal.has(url)) return seenExternal.get(url);
  let lastErr = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ctrl = AbortSignal.timeout(12000);
      let res = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: { 'user-agent': UA }, signal: ctrl });
      if (res.status === 405 || res.status === 403 || res.status === 501) {
        res = await fetch(url, { method: 'GET', redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(12000) });
      }
      const ok = res.status < 400;
      seenExternal.set(url, ok);
      if (!ok) lastErr = `HTTP ${res.status}`;
      if (ok) return true;
    } catch (e) {
      lastErr = e.message || String(e);
    }
    await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
  }
  seenExternal.set(url, false);
  problems.push(`EXTERNAL  ${url}  (${lastErr})`);
  return false;
}

async function checkDoc(file, html, allIds) {
  for (const ref of refsFromHtml(html)) {
    if (ref.startsWith('#')) {
      if (!allIds.has(ref.slice(1))) problems.push(`ANCHOR    ${file} → ${ref} (no matching id)`);
    } else if (/^https?:\/\//.test(ref)) {
      if (!internalOnly) await checkExternal(ref);
    } else if (/^(mailto:|tel:|data:)/.test(ref)) {
      /* skip */
    } else {
      let rel = ref.split(/[?#]/)[0];
      // GitHub Pages serves this repo under /schematic/ — resolve that base to the repo root
      if (rel.startsWith('/schematic/')) rel = rel.slice('/schematic/'.length);
      else if (rel.startsWith('/')) rel = rel.slice(1);
      if (rel === '' || rel.endsWith('/')) rel += 'index.html';
      if (!(await exists(rel))) problems.push(`MISSING   ${file} → ${ref} (file not found)`);
    }
  }
}

const index = await read('index.html');
const notFound = await read('404.html');
const styles = await read('styles.css');
const fontsCss = await read('assets/fonts/fonts.css');

const indexIds = idsOf(index);
await checkDoc('index.html', index, indexIds);
await checkDoc('404.html', notFound, idsOf(notFound));

// CSS url() references (fonts.css paths are relative to assets/fonts/)
for (const u of urlsFromCss(styles)) {
  if (!/^(https?:|data:)/.test(u) && !(await exists(u.split(/[?#]/)[0]))) problems.push(`MISSING   styles.css → ${u}`);
}
for (const u of urlsFromCss(fontsCss)) {
  if (!/^(https?:|data:)/.test(u) && !(await exists(path.join('assets/fonts', u.split(/[?#]/)[0])))) {
    problems.push(`MISSING   assets/fonts/fonts.css → ${u}`);
  }
}

const nExt = seenExternal.size;
if (problems.length) {
  console.error(`\n✖ ${problems.length} link problem(s)` + (internalOnly ? ' (internal only)' : `, ${nExt} external URLs checked`) + ':\n');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
} else {
  console.log(`✓ links OK — internal refs resolve` + (internalOnly ? ' (external skipped)' : `, ${nExt} external URLs live`));
}
