// Usage: node compare.js <baselineDir> <currentDir> <diffDir>
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

const [baseDir, curDir, diffDir] = process.argv.slice(2);
fs.mkdirSync(diffDir, { recursive: true });

const read = (f) => PNG.sync.read(fs.readFileSync(f));
const rows = [];
for (const file of fs.readdirSync(baseDir).filter((f) => f.endsWith('.png')).sort()) {
  const curFile = path.join(curDir, file);
  if (!fs.existsSync(curFile)) { rows.push({ file, status: 'MISSING' }); continue; }
  const a = read(path.join(baseDir, file));
  const b = read(curFile);
  if (a.width !== b.width || a.height !== b.height) {
    rows.push({ file, status: 'SIZE', base: `${a.width}x${a.height}`, cur: `${b.width}x${b.height}` });
    continue;
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  const pct = ((n / (a.width * a.height)) * 100).toFixed(3);
  if (n > 0) fs.writeFileSync(path.join(diffDir, file), PNG.sync.write(diff));
  rows.push({ file, status: n === 0 ? 'SAME' : 'DIFF', pixels: n, pct: `${pct}%`, size: `${a.width}x${a.height}` });
}
for (const r of rows) console.log(JSON.stringify(r));
fs.writeFileSync(path.join(diffDir, 'summary.json'), JSON.stringify(rows, null, 2));
