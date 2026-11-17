// Grader self-test: perfect run should score 100%; degraded run must lose points.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)); const tmp = path.join(here, '..', '.selftest');
const secs = ['## 1. Validated Inputs','## 2. Data Quality & Assumptions','## 3. Market Intel & Comps','## 4. Underwriting Calculations','## 5. Stress Matrix','## 6. Decision & Verdict','## 7. Advantage Levers & Offer Strategy'];
for (const mode of ['perfect', 'degraded']) for (const f of fs.readdirSync(path.join(here, 'expected'))) {
  const id = f.replace('.json', ''), exp = JSON.parse(fs.readFileSync(path.join(here, 'expected', f), 'utf8'));
  const d = path.join(tmp, mode, id); fs.mkdirSync(d, { recursive: true });
  let res = exp, rep = secs.map(s => s.startsWith('## 6') && exp.hard_stops?.length ? s + '\n**HARD STOP:** ' + exp.verdict_basis : s).join('\n\n') + (exp.placeholders?.address ? '\nAddress: [not provided]' : '');
  let meta = { first_output_seconds: 30, wall_seconds: 600, tool_calls: 40, cost_usd: 12, looped: false };
  if (mode === 'degraded') { // simulate v3-style failures
    res = JSON.parse(JSON.stringify(exp));
    if (res.status === 'halt') { res = { status: 'ok', verdict: 'PASS', metrics: {} }; }
    else { if (res.metrics.cash_on_cash?.value == null) rep += '\nCoC: Infinity'; res.hard_stops = []; if (exp.hard_stops.length) res.verdict = 'PASS'; res.metrics.dscr.value = (res.metrics.dscr.value ?? 1) * 1.1; res.stress.cells = res.stress.cells.slice(0, 9); }
    meta = { first_output_seconds: 900, wall_seconds: 3600, tool_calls: 400, cost_usd: 60, looped: id.endsWith('lihtc') };
  }
  fs.writeFileSync(path.join(d, 'results.json'), JSON.stringify(res)); fs.writeFileSync(path.join(d, 'report.md'), rep); fs.writeFileSync(path.join(d, 'run_meta.json'), JSON.stringify(meta));
}
console.log('fixtures written to ' + tmp);
