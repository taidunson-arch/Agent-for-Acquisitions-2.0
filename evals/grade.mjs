// Grades an agent's eval outputs against evals/expected.
// Usage: node evals/grade.mjs <agent_runs_dir> [--label v4] [--json out.json]
// Expected layout per case: <agent_runs_dir>/<case_id>/results.json (engine-shaped), report.md, run_meta.json
//   run_meta.json: { "first_output_seconds": n, "wall_seconds": n, "tool_calls": n, "cost_usd": n, "looped": bool }
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const runs = process.argv[2]; if (!runs) { console.error('usage: node evals/grade.mjs <agent_runs_dir> [--label x] [--json out.json]'); process.exit(1); }
const arg = k => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const label = arg('--label') || path.basename(runs);
const KEY = ['noi', 'egi', 'going_in_cap_pct', 'yield_on_all_in_pct', 'stab_cap_pct', 'dscr', 'supported_offer', 'mao70', 'ceiling', 'grm', 'breakeven_occ_pct', 'coc_pct', 'equity_required'];
const SECTIONS = [/validated inputs/i, /data quality/i, /market intel|comps/i, /underwriting/i, /stress/i, /decision|verdict/i, /advantage levers|offer strategy/i];
const LIMITS = { first_output_seconds: 120, cost_usd: 250 };
const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const close = (a, b) => (a == null || b == null) ? a == null && b == null : Math.abs(a - b) <= Math.max(0.005 * Math.abs(b), 1e-6);
const setEq = (a, b) => JSON.stringify([...new Set(a)].sort()) === JSON.stringify([...new Set(b)].sort());
const results = [];
for (const f of fs.readdirSync(path.join(here, 'expected')).filter(f => f.endsWith('.json')).sort()) {
  const id = f.replace('.json', ''), exp = JSON.parse(read(path.join(here, 'expected', f)));
  const dir = path.join(runs, id), chk = [];
  const c = (name, ok, w = 1, detail = '') => chk.push({ name, ok: !!ok, w, detail });
  const resTxt = read(path.join(dir, 'results.json')), rep = read(path.join(dir, 'report.md')) || '', meta = JSON.parse(read(path.join(dir, 'run_meta.json')) || '{}');
  let res = null; try { res = resTxt ? JSON.parse(resTxt) : null; } catch {}
  c('produced_output', res || rep, 3);
  c('status_match', res?.status === exp.status, 3, 'got ' + res?.status + ' want ' + exp.status);
  if (exp.status === 'halt') {
    c('blocking_fields_match', setEq((res?.blocking || []).map(b => b.field), exp.blocking.map(b => b.field)), 3);
    c('no_math_on_halt', !res?.metrics, 2);
  } else {
    c('verdict_match', res?.verdict === exp.verdict, 3, 'got ' + res?.verdict + ' want ' + exp.verdict);
    c('hard_stops_match', setEq((res?.hard_stops || []).map(h => h.metric), exp.hard_stops.map(h => h.metric)), 3);
    for (const k of KEY) if (exp.metrics[k]) c('metric:' + k, close(res?.metrics?.[k]?.value ?? null, exp.metrics[k].value), 1, 'got ' + res?.metrics?.[k]?.value + ' want ' + exp.metrics[k].value);
    c('no_nan_inf', !/\b(NaN|Infinity|inf)\b/.test(rep + (resTxt || '')), 2);
    c('stress_20_cells', res?.stress?.cells?.length === 20, 2);
    c('anomalies_flagged', exp.anomalies.every(a => (res?.anomalies || []).some(x => x.type === a.type)), 2);
    let pos = -1, ordered = true; for (const s of SECTIONS) { const m = rep.slice(pos + 1).search(s); if (m < 0) { ordered = false; break; } pos += 1 + m; }
    c('report_7_sections_in_order', ordered, 2);
    if (exp.hard_stops.length) { const dec = rep.search(/decision|verdict/i); c('hard_stop_prominent', dec > -1 && /hard[- ]stop/i.test(rep.slice(dec, dec + 1500)), 2); }
    if (exp.placeholders && Object.keys(exp.placeholders).length) c('placeholders_labeled', /\[not provided\]/.test(rep), 1);
  }
  c('first_output_within_' + LIMITS.first_output_seconds + 's', meta.first_output_seconds != null && meta.first_output_seconds <= LIMITS.first_output_seconds, 2, 'got ' + meta.first_output_seconds);
  c('cost_within_$' + LIMITS.cost_usd, meta.cost_usd == null || meta.cost_usd <= LIMITS.cost_usd, 1);
  c('no_loop', meta.looped !== true, 3);
  const tot = chk.reduce((a, x) => a + x.w, 0), got = chk.reduce((a, x) => a + (x.ok ? x.w : 0), 0);
  results.push({ id, score: Math.round((got / tot) * 1000) / 10, failed: chk.filter(x => !x.ok).map(x => x.name + (x.detail ? ' (' + x.detail + ')' : '')), meta });
}
const avg = Math.round(results.reduce((a, r) => a + r.score, 0) / results.length * 10) / 10;
console.log('# ' + label + ': mean ' + avg + '% over ' + results.length + ' cases');
for (const r of results) console.log(r.id.padEnd(30) + String(r.score).padStart(6) + '%  ' + (r.failed.length ? 'FAILED: ' + r.failed.join('; ') : 'all checks pass'));
const jo = arg('--json'); if (jo) fs.writeFileSync(jo, JSON.stringify({ label, mean: avg, results }, null, 2));
