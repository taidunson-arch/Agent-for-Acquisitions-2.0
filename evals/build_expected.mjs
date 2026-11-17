// Regenerates evals/expected/*.json from the reference engine. Run: node evals/build_expected.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { underwrite } from '../tools/underwrite.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const cdir = path.join(here, 'cases'), edir = path.join(here, 'expected'); fs.mkdirSync(edir, { recursive: true });
const rows = [];
for (const f of fs.readdirSync(cdir).filter(f => f.endsWith('.json')).sort()) {
  const c = JSON.parse(fs.readFileSync(path.join(cdir, f), 'utf8'));
  const r = underwrite(c.inputs);
  fs.writeFileSync(path.join(edir, f), JSON.stringify(r, null, 2));
  rows.push([c.id, r.status, r.verdict ?? '-', r.score?.total ?? '-', (r.hard_stops || []).map(h => h.metric).join(',') || '-',
    (r.anomalies || []).map(a => a.type).join(',') || '-', (r.blocking || []).map(b => b.field).join(',') || '-',
    r.metrics?.noi?.value ?? '-', r.metrics?.dscr?.value ?? '-', r.metrics?.coc_pct?.value ?? '-']);
}
console.log(['case','status','verdict','score','hard_stops','anomalies','blocking','noi','dscr','coc'].join(' | '));
for (const r of rows) console.log(r.join(' | '));
