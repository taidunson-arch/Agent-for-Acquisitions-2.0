// Before/after: the engine currently in the repo (src/lib/underwrite.ts snapshot) vs the v4.1 engine, on the same eval cases.
// Run: node baseline/compare_engines.mjs   (Node 23.6+ strips TS types natively)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { underwrite as before, validateInputs } from './src-lib-snapshot/underwrite.ts';
import { underwrite as after } from '../tools/underwrite.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const cdir = path.join(here, '..', 'evals', 'cases');
const bad = o => { const hits = []; const walk = (x, p) => { if (typeof x === 'number' && !Number.isFinite(x)) hits.push(p + '=' + x); else if (x === -999) hits.push(p + '=-999'); else if (x && typeof x === 'object') for (const k in x) walk(x[k], p ? p + '.' + k : k); }; walk(o, ''); return hits; };
const rows = [];
for (const f of fs.readdirSync(cdir).sort()) {
  const c = JSON.parse(fs.readFileSync(path.join(cdir, f), 'utf8'));
  const exp = JSON.parse(fs.readFileSync(path.join(here, '..', 'evals', 'expected', f), 'utf8'));
  const bi = { dealName: '', address: '', market: '', assetType: 'multifamily', arv: 0, ...c.inputs };
  let B, berr = null, verrs = {};
  try { verrs = validateInputs(bi); } catch (e) { verrs = { crash: String(e.message) }; }
  try { B = before(bi); } catch (e) { berr = String(e.message).slice(0, 80); }
  const A = after(c.inputs);
  rows.push({ case: c.id, want: exp.status === 'halt' ? 'HALT' : exp.verdict,
    before: berr ? 'CRASH: ' + berr : B.verdict, before_validation_errors: Object.keys(verrs),
    before_nonfinite: B ? bad({ m: B.m, scores: B.scores, matrix: B.matrix }).length : null,
    before_comps_fabricated: B ? B.comps.length : null, before_conf: B ? +B.confidence.toFixed(3) : null,
    before_claims_external_checks: B ? B.verification.externalChecks.map(x => x.source + ': ' + x.result) : null,
    after: A.status === 'halt' ? 'HALT' : A.verdict, after_nonfinite: bad(A).length, after_hard_stops: (A.hard_stops || []).map(h => h.metric) });
}
fs.writeFileSync(path.join(here, 'compare_results.json'), JSON.stringify(rows, null, 2));
console.log('case | expected | before (repo engine) | after (v4.1) | before NaN/Inf/-999 | before fake comps | before random conf | before validation errs');
for (const r of rows) console.log([r.case, r.want, r.before, r.after, r.before_nonfinite, r.before_comps_fabricated, r.before_conf, r.before_validation_errors.join(',') || '-'].join(' | '));
const ok = k => rows.filter(r => r[k] === r.want).length;
console.log('\nverdict/halt correct: before ' + ok('before') + '/' + rows.length + ', after ' + ok('after') + '/' + rows.length);
console.log('sample fabricated external-check claims (before, case 01): ' + JSON.stringify(rows[0].before_claims_external_checks));
