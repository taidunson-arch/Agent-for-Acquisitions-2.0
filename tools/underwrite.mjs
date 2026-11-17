#!/usr/bin/env node
// Agent CLI for the ACQ/2.0 engine. Same math as the web app (src/lib/engine.mjs).
// Usage: node tools/underwrite.mjs <deal.json> [--out results.json] [--config cfg.json]
// Exit: 0 ok, 2 halt (blocking validation), 1 usage error.
import fs from 'node:fs';
import { underwrite, validate, DEFAULTS } from '../src/lib/engine.mjs';
export { underwrite, validate, DEFAULTS };

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('underwrite.mjs')) {
  const a = process.argv.slice(2);
  if (!a[0]) { console.error('usage: node tools/underwrite.mjs <deal.json> [--out results.json] [--config cfg.json]'); process.exit(1); }
  let d = JSON.parse(fs.readFileSync(a[0], 'utf8')); if (d.inputs) d = d.inputs;
  const ci = a.indexOf('--config'); const res = underwrite(d, ci > -1 ? JSON.parse(fs.readFileSync(a[ci + 1], 'utf8')) : {});
  const out = JSON.stringify(res, null, 2); const oi = a.indexOf('--out'); if (oi > -1) fs.writeFileSync(a[oi + 1], out); else console.log(out);
  process.exit(res.status === 'halt' ? 2 : 0);
}
