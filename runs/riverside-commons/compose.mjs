// Composes reports/riverside-commons/report.md in the house style (docs/REPORT_STYLE.md, templates/report.md).
// Every number comes from the engine (results.json, levers.json, re-runs below) or a cited source. Usage: node runs/riverside-commons/compose.mjs
import fs from 'node:fs';
import { underwrite } from '../../src/lib/engine.mjs';
const BT = String.fromCharCode(96), code = s => BT + s + BT;
const D = 'runs/riverside-commons', R = 'reports/riverside-commons';
const J = f => JSON.parse(fs.readFileSync(D + '/' + f, 'utf8'));
const intake = J('inputs.json'), I = intake.inputs, res = J('results.json'), lv = J('levers.json'), ami = J('ami_rents.json');
const m = res.metrics, o = res.offer, sc = Object.fromEntries(lv.scenarios.map(s => [s.label[0], s]));
// formatters (display rounding only)
const full = v => (v < 0 ? '-$' : '$') + Math.abs(Math.round(v)).toLocaleString('en-US');
const M$ = v => '$' + (v / 1e6).toFixed(2) + 'M', K$ = v => '$' + Math.round(v / 1e3).toLocaleString('en-US') + 'K';
const S$ = v => Math.abs(v) >= 1e6 ? M$(v) : K$(v);
const p1 = v => v.toFixed(1) + '%', p2 = v => v.toFixed(2) + '%', x = v => v.toFixed(2) + 'x';
// engine re-runs used in the narrative
const kIn = structuredClone(I); kIn.lihtc.eligibleBasis = (I.lihtc.eligibleBasis - I.rehabBudget) + I.rehabBudget * 1.3; kIn.lihtc.basisBoost = false;
const kOff = underwrite(kIn).offer; const kRun = (() => { const d = structuredClone(kIn); d.askingPrice = kOff.walk_away; return underwrite(d); })();
const bIn = structuredClone(I); bIn.lihtc.basisBoost = false; const bOff = underwrite(bIn).offer;
fs.writeFileSync(D + '/06b_conservative_price.json', JSON.stringify({ basis: 'engine offer under rehab-only boost reading (scenario K) and no-boost (scenario B)', K_offer: kOff, B_offer: bOff, K_check_at_walk_away: { price: kOff.walk_away, verdict: kRun.verdict, score: kRun.score.total, dscr: kRun.metrics.dscr.value, equity_required: kRun.metrics.equity_required.value } }, null, 2));
const avail = I.availableEquity, gap = lv.equity_gap, kGap = sc.K.equity_required - avail, bGap = sc.B.equity_required - avail;
const creditDropK = sc.A.lihtc_equity - sc.K.lihtc_equity, creditDropB = sc.A.lihtc_equity - sc.B.lihtc_equity;
const cells = res.stress.cells, minD = Math.min(...cells.map(c => c.dscr)), cell = (r, h) => cells.find(c => c.rent_delta === r && c.rehab_delta === h);
const rehab20 = cell(0, 0.2).equity_required - cell(0, 0).equity_required;
const rent1br = ami.rents[1].max_gross_rent_60;
const name = I.dealName.replace(/\s*\(.*\)$/, ''), today = new Date().toISOString().slice(0, 10);
const LBL = { dscr_floor: 'DSCR 1.25x floor', available_equity: 'Available equity', asking_price: 'Asking price' };
let ex = 0; const exh = t => '**Exhibit ' + (++ex) + ': ' + t + '**';
const L = []; const p = (...s) => L.push(...s);
const table = (head, rows) => { p('| ' + head.join(' | ') + ' |', '|' + head.map((h, i) => i === 0 ? '---' : '---:').join('|') + '|'); rows.forEach(r => p('| ' + r.join(' | ') + ' |')); };
const tableL = (head, rows) => { p('| ' + head.join(' | ') + ' |', '|' + head.map(() => '---').join('|') + '|'); rows.forEach(r => p('| ' + r.join(' | ') + ' |')); };
const SRC_ENGINE = '*Source: ' + res.engine + ', ' + code('runs/riverside-commons/results.json') + '.*';

// ---------- Title block
p('# ' + name + ': 4% LIHTC acquisition/rehab · ' + I.units + ' units · ' + I.market, '');
p('Developer Deal Advantage Report · Prepared ' + today + ' · Engine ' + res.engine + ' · **DRAFT: not for LOI until next steps 1–3 are cleared**', '');

// ---------- Executive summary
p('## Executive summary', '');
p('**Do not proceed at the ' + M$(I.askingPrice) + ' ask. Re-trade with an opening offer of ' + M$(o.opening) + ' and a walk-away of ' + M$(o.walk_away) + ', conditional on three diligence items (next steps 1–3).**', '');
p('**Verdict: ' + res.verdict + '. HARD STOP: equity required ' + full(m.equity_required.value) + ' > available ' + full(avail) + '.** Score before the override: ' + res.score.total + '/100 (STRONG ADVANTAGE ≥ 72; PASS < 52).', '');
p('**Why**', '');
p('1. **Funding, not the property, blocks the deal.** The capital stack is ' + K$(gap) + ' short of available equity. In-place NOI covers debt service ' + x(m.dscr.value) + ', and coverage stays at ' + x(minD) + ' or better in all 20 stress cases.');
p('2. **Tax-credit equity could fall by ' + K$(creditDropK) + '.** If the 130% basis boost covers rehab costs only, the gap widens to ' + S$(kGap) + ' and the walk-away drops to ' + M$(kOff.walk_away) + '.');
p('3. **Rent compliance is unproven.** HUD\'s FY2026 60% AMI gross rent limit for a 1-bedroom is ' + full(rent1br) + '; the average rent is ' + full(I.currentRent) + '. We need the unit mix to know how many units are affected.', '');
p('**Decision required:** Approve a re-trade between ' + M$(o.opening) + ' and ' + M$(o.walk_away) + ' and fund the three pre-LOI diligence items. Do not submit an LOI at the ask.', '');
p(exh('The deal passes every operating test and fails the funding test'), '');
tableL(['Metric', 'Result', 'Test', 'Status'], [
  ['DSCR, in place', x(m.dscr.value), '≥ 1.25x', 'Pass'],
  ['DSCR, worst of 20 stress cases', x(minD), '≥ 1.25x', 'Pass'],
  ['Break-even occupancy', p1(m.breakeven_occ_pct.value), '≤ 85.0%', 'Pass'],
  ['Sponsor equity required', M$(m.equity_required.value), '≤ ' + M$(avail) + ' available', '**Fail**'],
  ['Stabilized yield on cost', p2(m.stab_cap_pct.value), 'vs ' + p2(I.marketCapRate) + ' market cap (unsourced)', 'Watch'],
  ['Average rent vs 1BR 60% AMI gross limit', full(I.currentRent) + ' vs ' + full(rent1br), '≤ limit', 'Watch (unit mix unknown)'],
  ['Sourced sales comps', 'None', '≥ 3 comps', 'Not tested'],
]);
p('', '*Source: ' + res.engine + ' results.json; HUD FY2026 MTSP income limits (Fresno, CA HMFA). Break-even test is the engine anomaly threshold.*', '');
p('**Next steps**', '');
tableL(['#', 'Action', 'Owner', 'By', 'Resolves'], [
  ['1', 'Obtain the rent roll with unit mix and utility allowances', 'Acquisitions analyst', 'Before LOI', 'Rent compliance against the ' + full(rent1br) + ' 1BR limit'],
  ['2', 'Commission a LIHTC consultant memo on basis-boost scope and QCT/DDA status', 'Development lead', 'Before LOI', 'Up to ' + K$(creditDropK) + ' of credit equity; walk-away ' + M$(o.walk_away) + ' vs ' + M$(kOff.walk_away)],
  ['3', 'Obtain the T-12 and 3–5 sourced sales comps', 'Acquisitions analyst', 'Before LOI', 'The ' + I.opexRatioPct + '% opex assumption; a market anchor for price'],
  ['4', 'Request a lender term sheet at ' + lv.solved.min_ltc_clearing_equity_stop_pct + '% LTC', 'Finance lead', 'Before LOI', 'Stretch walk-away of ' + M$(sc.D.offer.walk_away)],
  ['5', 'Confirm the bond-test threshold against actual aggregate basis', 'Tax counsel', 'Before bond application', '25% vs 50% test (see section 7)'],
]);
p('', '*Owners are suggested roles.*', '', '---', '');

// ---------- 1
p('## 1. Validated Inputs: All 12 critical fields pass validation, but no source document supports them yet', '');
p('The engine returned status **' + res.status + '** with no blocking fields. The intake came without an OM, rent roll or T-12, so every value below is as submitted.', '');
p(exh('Every input is taken from the intake file; four that drive value have no named source'), '');
tableL(['Input', 'Value', 'Source'], [
  ['Asking price', full(I.askingPrice), 'Intake'], ['Rehab budget', full(I.rehabBudget), 'Intake (no contractor bid)'], ['Units', String(I.units), 'Intake (no rent roll)'],
  ['Average rent, current / market', full(I.currentRent) + ' / ' + full(I.marketRent) + ' per month', 'Intake (no rent roll)'], ['Vacancy / ancillary income', I.vacancyPct + '% / ' + I.ancillaryPct + '%', 'Intake'],
  ['Opex', I.opexRatioPct + '% of EGI', '**Unsourced** (no T-12)'], ['Closing costs', I.closingCostPct + '% of price', 'Intake'],
  ['Senior loan', I.ltvPct + '% LTC · ' + I.ratePct + '% · ' + I.amortYears + '-yr amortization', 'Intake (no term sheet)'],
  ['Available equity / soft sources', full(avail) + ' / ' + full(I.softSources), 'Intake'],
  ['LIHTC', I.lihtc.type + '% credit · ' + full(I.lihtc.eligibleBasis) + ' eligible basis · 130% boost · $' + I.lihtc.creditPrice + ' credit price', '**Unsourced** (boost scope disputed, section 2)'],
  ['Market cap rate', p2(I.marketCapRate), '**Unsourced**'], ['AMI rent limit', full(I.amiRentLimit), '**Unsourced** (bedroom size not stated)'], ['ARV', '[not provided]', 'n/a'],
]);
p('', '*Source: ' + code('runs/riverside-commons/inputs.json') + '; engine validate().*', '');

// ---------- 2
p('## 2. Data Quality & Assumptions: The tax-credit assumptions, not operations, carry the largest risk', '');
p(exh('Each open item has a priced downside'), '');
tableL(['Risk', 'Impact if adverse (engine re-run)', 'How we will know', 'Mitigant'], [
  ['Basis boost applies to rehab costs only', 'Credit equity −' + K$(creditDropK) + '; gap ' + S$(kGap) + '; walk-away ' + M$(kOff.walk_away), 'LIHTC consultant memo', 'Price at the downside walk-away, or add soft funds'],
  ['Site is not in a QCT or DDA (no boost)', 'Credit equity −' + S$(creditDropB) + '; gap ' + S$(bGap) + '; walk-away ' + M$(bOff.walk_away), 'HUD QCT/DDA lookup by census tract and ZIP', 'Walk away, or find new soft sources'],
  ['1-bedroom rents exceed the 60% AMI limit', 'Rents must fall to the limit, less the utility allowance; not modeled until the unit mix is known', 'Rent roll and utility allowances', 'Re-underwrite at compliant rents before LOI'],
  ['Rehab overruns by 20%', 'Equity +' + K$(rehab20) + ' (loan stays sized on the base budget)', 'Contractor bids and a physical needs assessment', 'Hold a contingency; get a fixed-price contract'],
  ['Opex ratio understates real costs', 'Not modeled; each point of opex ratio lowers NOI', 'T-12', 'Re-run on actual T-12 opex'],
]);
p('', SRC_ENGINE.replace('.*', ', ' + code('levers.json') + ', ' + code('06b_conservative_price.json') + '.*'), '');
p('Other data-quality notes:', '');
for (const w of res.warnings) p('- Engine warning: ' + w + '.');
p('- **Boost scope is my reading, not confirmed.** For an *existing* building, IRC §42(d)(5)(B) appears to apply the 130% boost to rehabilitation expenditures, not to acquisition basis. I could not retrieve the statute text in this run.');
p('- **Bond test changed in 2025.** Pub. L. 119-21 §70422(b)(1) replaced the 50% rule in §42(h)(4)(B). The new threshold is reported as 25%; the new text was not retrieved.');
p('- **QCT/DDA status is unknown.** The address "' + I.address + '" could not be matched to a census tract or ZIP.', '');

// ---------- 3
p('## 3. Market Intel & Comps: HUD limits put 1-bedroom rents at risk, and no sourced comps support the price', '');
p(exh('Current rents fit the 2-bedroom limit but exceed the 1-bedroom limit'), '');
table(['Bedrooms', 'Imputed household', '60% AMI income limit ($)', 'Max gross rent ($/mo)'], ami.rents.map(r => [String(r.bedrooms), String(r.imputed_persons), r.income_limit_60.toLocaleString('en-US'), (r.bedrooms === 1 ? '**' : '') + r.max_gross_rent_60.toLocaleString('en-US') + (r.bedrooms === 1 ? '**' : '')]));
p('', '*Source: HUD FY2026 MTSP income limits, ' + ami.area + ' (MFI $' + ami.mfi.toLocaleString('en-US') + ', effective ' + ami.effective + '), HERA-Income-Limits-Report-FY26.rtf, downloaded 2026-11-17. Note: gross rent includes the utility allowance; max rent = 30% x income limit / 12 at 1.5 persons per bedroom.*', '');
p('**No usable comps.** The repo has no ' + code('data/comps/') + ' and web search is not configured, so no comps were found. None were invented. The price per unit (' + full(m.price_per_unit.value) + ') and GRM (' + m.grm.value.toFixed(2) + ') are reported without a benchmark.', '');

// ---------- 4
p('## 4. Underwriting Calculations: In-place NOI of ' + K$(m.noi.value) + ' covers debt service ' + x(m.dscr.value) + ', but sponsor equity is ' + K$(gap) + ' short', '');
const tot = m.all_in.value, sh = v => p1(v / tot * 100);
p(exh('Tax credits and the bond loan fund ' + Math.round((m.loan.value + m.lihtc_equity.value) / tot * 100) + '% of cost; the sponsor share is ' + K$(gap) + ' more than available'), '');
tableL(['Uses', '$M', '% of total', '', 'Sources', '$M', '% of total'], [
  ['Purchase price', M$(I.askingPrice), sh(I.askingPrice), '', 'Senior loan (' + I.ltvPct + '% LTC)', M$(m.loan.value), sh(m.loan.value)],
  ['Closing costs', M$(m.closing_costs.value), sh(m.closing_costs.value), '', 'LIHTC equity', M$(m.lihtc_equity.value), sh(m.lihtc_equity.value)],
  ['Rehab', M$(I.rehabBudget), sh(I.rehabBudget), '', 'Soft sources', M$(I.softSources), sh(I.softSources)],
  ['', '', '', '', 'Sponsor equity required', '**' + M$(m.equity_required.value) + '**', sh(m.equity_required.value)],
  ['**Total uses**', '**' + M$(tot) + '**', '100.0%', '', '**Total sources**', '**' + M$(tot) + '**', '100.0%'],
]);
p('', '*Source: ' + res.engine + ' results.json. Note: available sponsor equity is ' + M$(avail) + ', a gap of ' + K$(gap) + '. Deferred developer fee: none assumed.*', '');
p(exh('Operations comfortably carry the debt'), '');
table(['Line item', '$K per year'], [
  ['Gross potential rent', K$(m.gpr.value)], ['Less vacancy (' + I.vacancyPct + '%)', '(' + K$(m.vacancy_loss.value) + ')'], ['Plus ancillary income', K$(m.ancillary.value)],
  ['Effective gross income', K$(m.egi.value)], ['Less operating expenses (' + I.opexRatioPct + '%)', '(' + K$(m.opex.value) + ')'], ['**Net operating income**', '**' + K$(m.noi.value) + '**'],
  ['Less debt service', '(' + K$(m.ads.value) + ')'], ['**Cash flow after debt service**', '**' + K$(m.cash_flow.value) + '**'],
  ['DSCR', x(m.dscr.value)], ['Cash-on-cash return', p1(m.coc_pct.value)],
]);
p('', SRC_ENGINE, '');
p('**Calculation trail.** Every metric with the engine formula and worked calculation:', '');
const fmt = (k, v) => /pct/.test(k) ? p2(v) : k === 'dscr' ? x(v) : k === 'grm' ? v.toFixed(2) : full(v);
tableL(['Metric', 'Value', 'Formula', 'Calculation'], Object.entries(m).map(([k, v]) => [k, v.value == null ? 'n/a (' + v.undefined_reason + ')' : fmt(k, v.value), v.formula.replace(/\|/g, '/'), (v.calc || '').replace(/\|/g, '/')]));
p('', SRC_ENGINE, '');

// ---------- 5
p('## 5. Stress Matrix: Debt holds in all 20 cases; available equity covers none of them', '');
p(exh('Coverage never drops below ' + x(minD) + ', but every case needs more than ' + M$(avail) + ' of equity'), '');
const rs = res.stress.rehab_steps;
tableL(['Rent change ↓ / Rehab overrun →'].concat(rs.map(r => '+' + Math.round(r * 100) + '%')), res.stress.rent_steps.map(rd => [(rd >= 0 ? '+' : '') + Math.round(rd * 100) + '%'].concat(rs.map(hd => { const c = cell(rd, hd); const ok = c.dscr >= 1.25 && c.equity_required <= avail; return x(c.dscr) + ' · ' + p1(c.coc_pct) + ' · ' + M$(c.equity_required) + ' · ' + (ok ? 'Pass' : 'Fail'); }))));
p('', '*Source: ' + res.engine + ' stress grid. Each cell: DSCR · cash-on-cash · equity required · status. Pass = DSCR ≥ 1.25x and equity ≤ ' + M$(avail) + '. The loan is sized on the base budget, so overruns are equity-funded.*', '');
p('**Reading:** the deal fails on funding, not cash flow. Each 10% rehab overrun adds ' + K$(cell(0, 0.1).equity_required - cell(0, 0).equity_required) + ' of equity.', '');

// ---------- 6
p('## 6. Decision & Verdict: The equity hard stop forces PASS despite a score of ' + res.score.total, '');
p('**HARD STOP: ' + res.hard_stops.map(h => h.rule).join('; ') + '.** Verdict: **' + res.verdict + '**.', '');
p(exh('Three of four score components are maxed; stabilized yield is the weak point'), '');
const drv = { spread: 'Spread ' + p1(m.spread_pct.value) + ' (DSCR-supported ceiling vs ask)', dscr: 'DSCR ' + x(m.dscr.value), cap: 'Yield on cost ' + p2(m.stab_cap_pct.value), coc: 'Cash-on-cash ' + p1(m.coc_pct.value) };
table(['Component', 'Weight', 'Score (0–100)', 'Driver'], Object.keys(res.score.components).map(k => [k === 'cap' ? 'Stabilized yield' : k === 'coc' ? 'Cash-on-cash' : k === 'dscr' ? 'DSCR' : 'Spread', Math.round(res.config.weights[k] * 100) + '%', String(res.score.components[k]), drv[k]]).concat([['**Total**', '100%', '**' + res.score.total + '**', 'STRONG ADVANTAGE band ≥ 72']]));
p('', SRC_ENGINE, '');
p('- **Anomalies:** ' + (res.anomalies.length ? res.anomalies.map(a => a.type).join(', ') : 'none flagged by the engine') + '. The engine\'s AMI check used the unsourced ' + full(I.amiRentLimit) + ' limit, so the 1-bedroom risk from section 3 is not in its anomaly list.');
p('- **Calibration note:** low yield on cost is typical of LIHTC acquisition/rehab, where credit equity pays for the rehab. The weight on this component may need to change for credit deals.', '');

// ---------- 7
p('## 7. Advantage Levers & Offer Strategy: Four levers close the ' + K$(gap) + ' gap; only a deeper price cut also survives the downside case', '');
p(exh('Each lever clears the hard stop on its own if the full boost is confirmed'), '');
tableL(['Lever', 'Change', 'Verdict', 'Score', 'DSCR', 'Equity required'], [
  ['Upsize the bond loan', I.ltvPct + '% → ' + lv.solved.min_ltc_clearing_equity_stop_pct + '% LTC (' + M$(sc.D.loan) + ')', sc.D.verdict, sc.D.score, x(sc.D.dscr), M$(sc.D.equity_required)],
  ['Defer developer fee', K$(gap) + ' deferred', sc.G.verdict, sc.G.score, x(sc.G.dscr), M$(sc.G.equity_required)],
  ['Add soft funds', '+' + K$(gap), sc.F.verdict, sc.F.score, x(sc.F.dscr), M$(sc.F.equity_required)],
  ['Cut the price', M$(I.askingPrice) + ' → ' + M$(lv.solved.max_price_clearing_equity_stop), sc.C.verdict, sc.C.score, x(sc.C.dscr), M$(sc.C.equity_required)],
  ['*Downside: boost on rehab only*', '*Loan to 1.25x maximum (' + lv.solved.max_ltc_at_125_dscr_pct + '% LTC)*', '*' + sc.L.verdict + '*', '*' + sc.L.score + '*', '*' + x(sc.L.dscr) + '*', '*' + M$(sc.L.equity_required) + '*'],
  ['*Downside: boost on rehab only*', '*Price to ' + M$(kOff.walk_away) + '*', '*' + kRun.verdict + '*', '*' + kRun.score.total + '*', '*' + x(kRun.metrics.dscr.value) + '*', '*' + M$(kRun.metrics.equity_required.value) + '*'],
]);
p('', '*Source: engine re-runs, ' + code('runs/riverside-commons/levers.mjs') + ' → ' + code('levers.json') + '. Each row is a full re-underwrite; all 12 scenarios are in Appendix B.*', '');
p(exh('The engine sets the walk-away at ' + M$(o.walk_away) + ', the most current equity can fund'), '');
tableL(['Case', 'Opening ($M)', 'Target ($M)', 'Walk-away ($M)', 'Binding constraint'], [
  ['**Base: as submitted**', '**' + M$(o.opening) + '**', '**' + M$(o.target) + '**', '**' + M$(o.walk_away) + '**', LBL[o.binding_constraint]],
  ['Downside: boost on rehab only', M$(kOff.opening), M$(kOff.target), M$(kOff.walk_away), LBL[kOff.binding_constraint]],
  ['Stretch: loan at ' + lv.solved.min_ltc_clearing_equity_stop_pct + '% LTC', M$(sc.D.offer.opening), M$(sc.D.offer.target), M$(sc.D.offer.walk_away), LBL[sc.D.offer.binding_constraint]],
]);
p('', '*Source: ' + res.engine + ' offer block (walk-away = lowest of the DSCR, equity and ask limits; target 96%, opening 92%). Base limits: DSCR ' + M$(o.limits[0].price) + ', equity ' + M$(o.limits[1].price) + ', ask ' + M$(o.limits[2].price) + '. LOI figures: opening ' + full(o.opening) + ', walk-away ' + full(o.walk_away) + '.*', '');
p('**How to use it**', '');
p('- **Open at ' + M$(o.opening) + '.** This price is fundable today without any lever.');
p('- **Hold at ' + M$(o.walk_away) + '.** Above that price the equity hard stop returns.');
p('- **Drop to ' + M$(kOff.walk_away) + ' if the consultant confirms the boost covers rehab only.** That is the only lever that survives this case at an acceptable score.');
p('- **Go to the ' + M$(sc.D.offer.walk_away) + ' ask only with a written lender commitment at ' + lv.solved.min_ltc_clearing_equity_stop_pct + '% LTC.**');
p('- **Bond test:** the loan is ' + I.ltvPct + '% of all-in cost (a stand-in for aggregate basis). That fails the old 50% test and passes 25%, if the 25% threshold applies and the whole loan is tax-exempt. Reaching 50% takes about 50% LTC (' + x(sc.I.dscr) + ' DSCR, score ' + sc.I.score + '). Counsel must confirm.', '');
p('---', '');

// ---------- Appendix
p('## Appendix', '');
p('### A. Glossary', '');
tableL(['Term', 'Meaning'], [
  ['DSCR', 'Debt service coverage ratio: NOI divided by annual debt service. Lenders typically require 1.25x or more.'],
  ['LTC', 'Loan-to-cost: loan as a share of total cost (price + closing + rehab).'],
  ['AMI / MTSP', 'Area median income. HUD publishes the Multifamily Tax Subsidy Project income limits that set LIHTC rents.'],
  ['LIHTC (4%)', 'Low-Income Housing Tax Credit, paired with tax-exempt bonds. Equity = eligible basis x boost x applicable fraction x 4% x 10 years x credit price.'],
  ['Basis boost', 'A 130% increase in eligible basis for projects in a QCT or DDA.'],
  ['QCT / DDA', 'Qualified Census Tract / Difficult Development Area, designated annually by HUD.'],
  ['Hard stop', 'A rule that forces PASS whatever the score: NOI < 0, DSCR < 1.00x, or equity required > available.'],
  ['Walk-away', 'The highest price the engine supports: the lowest of the DSCR, equity and ask limits.'],
]);
p('', '### B. Scenario detail', '');
tableL(['Scenario', 'Verdict', 'Score', 'DSCR', 'LIHTC equity', 'Equity required', 'Cash-on-cash', 'Walk-away'], lv.scenarios.map(s => [s.label, s.verdict, String(s.score), x(s.dscr), M$(s.lihtc_equity), M$(s.equity_required), p1(s.coc_pct), s.offer && s.offer.walk_away ? M$(s.offer.walk_away) : 'n/a']));
p('', '*Source: ' + code('runs/riverside-commons/levers.json') + '.*', '');
p('### C. Verification log (checks actually run in this run)', '');
tableL(['Check', 'Source', 'When', 'Result'], [
  ['HUD FY2026 MTSP limits, Fresno CA HMFA', 'huduser.gov/portal/datasets/mtsp/mtsp26/HERA-Income-Limits-Report-FY26.rtf', '2026-11-17 07:27 PST', 'Retrieved; copy in ' + code('runs/riverside-commons/sources/')],
  ['§42(h)(4)(B) amendment, Pub. L. 119-21 §70422(b)(1)', 'law.cornell.edu/uscode/text/26/42', '2026-11-17 15:29 UTC', 'Amendment confirmed; new text not retrieved'],
  ['QCT/DDA status', 'n/a', 'n/a', 'Not performed: address not geocoded'],
  ['Sales comps', 'n/a', 'n/a', 'Not performed: no data source'],
]);
p('', 'No confidence percentage is stated because none was computed.', '');
p('### D. Check the math in Excel', '');
p(code('riverside-commons_model.xlsx') + ' (same folder as this report) recomputes every metric, the score, verdict, offer, the 20-cell stress grid and the HUD rent limits with live Excel formulas. Each sits next to the engine value with an OK/CHECK status. Blue cells are inputs: change one and the formulas recalculate. Built with ' + code('tools/export_xlsx.mjs') + ' and recalculated in Microsoft Excel before saving.', '');
p('### E. Reproduce', '');
p(code('node tools/underwrite.mjs runs/riverside-commons/inputs.json --out runs/riverside-commons/results.json') + ', then ' + code('node runs/riverside-commons/levers.mjs') + ', ' + code('node runs/riverside-commons/ami_rents.mjs') + ' and ' + code('node runs/riverside-commons/compose.mjs') + '.', '');
p('*Prepared under the Acquisitions Desk Agent v4 run contract (' + code('agent.v4.yaml') + ') in house style (' + code('docs/REPORT_STYLE.md') + '). This run was executed by the OpenClaw main agent, not the configured model. Generated ' + new Date().toISOString() + '.*');
fs.mkdirSync(R, { recursive: true });
fs.writeFileSync(R + '/report.md', L.join('\n') + '\n');
fs.copyFileSync(D + '/results.json', R + '/results.json');
const es = L.slice(L.indexOf('## Executive summary'), L.findIndex(l => l.startsWith('**Exhibit 1'))).join(' ');
console.log('lines', L.length, 'exhibits', ex, 'exec-summary words (before Exhibit 1)', es.split(/\s+/).length);
