// Reproducible lever runs for riverside-commons. Usage: node runs/riverside-commons/levers.mjs
import fs from 'node:fs';
import { underwrite } from '../../src/lib/engine.mjs';
const dir = 'runs/riverside-commons';
const base = JSON.parse(fs.readFileSync(dir + '/inputs.json', 'utf8')).inputs;
const pick = (r) => ({ verdict: r.verdict, score: r.score?.total ?? null, hard_stops: (r.hard_stops||[]).map(h => h.rule),
  dscr: r.metrics?.dscr?.value, loan: r.metrics?.loan?.value, all_in: r.metrics?.all_in?.value,
  lihtc_equity: r.metrics?.lihtc_equity?.value, equity_required: r.metrics?.equity_required?.value, coc_pct: r.metrics?.coc_pct?.value, offer: r.offer });
const run = (label, patch) => { const d = structuredClone(base); patch(d); return { label, changes: patch.toString(), ...pick(underwrite(d)) }; };
const avail = base.availableEquity;
// solve: lowest price change that clears the equity hard stop (bisection, engine-evaluated)
const solve = (lo, hi, f, ok) => { for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; ok(f(m)) ? (lo = m) : (hi = m); } return lo; };
const priceOk = solve(0, base.askingPrice, p => { const d = structuredClone(base); d.askingPrice = p; return underwrite(d); }, r => r.metrics.equity_required.value <= avail);
const ltcMaxDscr = solve(base.ltvPct, 90, l => { const d = structuredClone(base); d.ltvPct = l; return underwrite(d); }, r => r.metrics.dscr.value >= 1.25);
const ltcClear = (() => { let lo = base.ltvPct, hi = 90; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; const d = structuredClone(base); d.ltvPct = m; underwrite(d).metrics.equity_required.value <= avail ? (hi = m) : (lo = m); } return hi; })();
const gap = underwrite(base).metrics.equity_required.value - avail;
const out = {
  engine: underwrite(base).engine, generated: new Date().toISOString(), equity_gap: gap,
  solved: { max_price_clearing_equity_stop: Math.floor(priceOk / 1000) * 1000, min_ltc_clearing_equity_stop_pct: Math.ceil(ltcClear * 100) / 100, max_ltc_at_125_dscr_pct: Math.floor(ltcMaxDscr * 100) / 100 },
  scenarios: [
    run('A. Base case (as submitted)', d => {}),
    run('B. No 130% basis boost (site not in QCT/DDA)', d => { d.lihtc.basisBoost = false; }),
    run('C. Price cut to clear equity stop', d => { d.askingPrice = Math.floor(priceOk / 1000) * 1000; }),
    run('D. Raise loan LTC to clear equity stop', d => { d.ltvPct = Math.ceil(ltcClear * 100) / 100; }),
    run('E. Loan LTC 48% (headroom)', d => { d.ltvPct = 48; }),
    run('F. Add soft sources equal to gap', d => { d.softSources = (d.softSources || 0) + Math.ceil(gap); }),
    run('G. Defer developer fee equal to gap', d => { d.deferredDevFee = Math.ceil(gap); }),
    run('H. No boost + LTC at 1.25x max', d => { d.lihtc.basisBoost = false; d.ltvPct = Math.floor(ltcMaxDscr * 100) / 100; }),
    run('I. Loan LTC 50% (bonds ~50% of all-in; legacy 50% test)', d => { d.ltvPct = 50; }),
    run('J. Rehab +20% overrun, loan resized on new budget', d => { d.rehabBudget = d.rehabBudget * 1.2; }),
    // K: boost applied to rehab basis only (existing building). Assumes acquisition basis = eligibleBasis - rehabBudget. UNVERIFIED legal reading; confirm with LIHTC consultant.
    run('K. Boost on rehab basis only (acq basis unboosted)', d => { const reh = d.rehabBudget; d.lihtc.eligibleBasis = (d.lihtc.eligibleBasis - reh) + reh * 1.3; d.lihtc.basisBoost = false; }),
    run('L. K + loan LTC at 1.25x max', d => { const reh = d.rehabBudget; d.lihtc.eligibleBasis = (d.lihtc.eligibleBasis - reh) + reh * 1.3; d.lihtc.basisBoost = false; d.ltvPct = Math.floor(ltcMaxDscr * 100) / 100; }),
  ],
};
fs.writeFileSync(dir + '/levers.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
