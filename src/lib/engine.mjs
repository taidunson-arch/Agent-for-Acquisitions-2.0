#!/usr/bin/env node
// ACQ/2.0 v4.1 underwriting engine. Takes Dana Inputs natively (src/lib/types.ts DealInputs, percents as whole numbers).
// Pure module (no Node APIs): imported by the web app (src/lib/underwrite.ts) and by the agent CLI (tools/underwrite.mjs).
// Rule: every number an agent or the web app reports must come from this engine. Every metric has a formula and a calc string.

export const DEFAULTS = {
  dscr_floor: 1.25,
  rent_steps: [-0.08, -0.04, 0, 0.04, 0.08],   // same axes as src/lib/underwrite.ts
  rehab_steps: [0, 0.10, 0.20, 0.30],
  weights: { spread: 0.30, dscr: 0.25, cap: 0.25, coc: 0.20 },   // as implemented in src/lib/underwrite.ts (README says 35/25/20/20)
  bands: { strong: 72, pass_below: 52 },                         // as implemented (README says 70/45)
  anomaly: { cap_spread_high: 3.0, cap_spread_low: -2.0, min_vacancy: 2, breakeven_high: 85 }
};

const isNum = v => typeof v === 'number' && Number.isFinite(v);
const rd = (x, d = 6) => (isNum(x) ? Math.round(x * 10 ** d) / 10 ** d : null);
const usd = x => (isNum(x) ? (x < 0 ? '-$' : '$') + Math.abs(Math.round(x)).toLocaleString('en-US') : 'n/a');
const pc = x => (isNum(x) ? x.toFixed(2) + '%' : 'n/a');          // x already in percent units
const clamp01 = n => Math.min(1, Math.max(0, n));
const M = (value, formula, calc, note) => ({ value: rd(value), formula, calc, ...(note ? { note } : {}) });
const U = (formula, why) => ({ value: null, formula, undefined_reason: why });

const CRITICAL = [
  ['askingPrice', v => v > 0, 'must be > 0'],
  ['rehabBudget', v => v >= 0, 'must be >= 0'],
  ['units', v => v >= 1 && Number.isInteger(v), 'must be an integer >= 1'],
  ['currentRent', v => v > 0, 'must be > 0 (per unit per MONTH)'],
  ['marketRent', v => v > 0, 'must be > 0 (per unit per MONTH at stabilization)'],
  ['vacancyPct', v => v >= 0 && v <= 30, 'must be 0-30 (whole percent)'],
  ['opexRatioPct', v => v >= 20 && v <= 70, 'must be 20-70 (% of EGI)'],
  ['ancillaryPct', v => v >= 0 && v <= 20, 'must be 0-20 (% of EGI)'],
  ['closingCostPct', v => v >= 0 && v <= 8, 'must be 0-8 (% of ask)'],
  ['ltvPct', v => v >= 30 && v <= 90, 'must be 30-90 (LTC on all-in basis)'],
  ['ratePct', v => v >= 1 && v <= 15, 'must be 1-15 (whole percent, e.g. 6.5)'],
  ['amortYears', v => v >= 5 && v <= 40, 'must be 5-40']
];

export function validate(d) {
  const blocking = [], warnings = [], placeholders = {};
  for (const [f, ok, why] of CRITICAL) {
    const v = d[f];
    if (v === undefined || v === null || v === '') blocking.push({ field: f, reason: 'missing' });
    else if (!isNum(v)) blocking.push({ field: f, reason: 'non-numeric (' + JSON.stringify(v) + ')' });
    else if (!ok(v)) blocking.push({ field: f, reason: why + ' (got ' + v + ')' });
  }
  // Unit ambiguity: ask, don't assume
  for (const f of ['currentRent', 'marketRent']) if (isNum(d[f]) && d[f] > 15000) blocking.push({ field: f, reason: 'ambiguous: ' + d[f] + ' looks annual, contract is per unit per month. Confirm' });
  for (const f of ['vacancyPct', 'opexRatioPct', 'ratePct', 'ltvPct']) if (isNum(d[f]) && d[f] > 0 && d[f] < 1) blocking.push({ field: f, reason: 'ambiguous: ' + d[f] + ' looks like a decimal; contract uses whole percents. Confirm' });
  // dedupe by field (keep first reason)
  const seen = new Set(); const b2 = blocking.filter(b => (seen.has(b.field) ? false : seen.add(b.field)));
  // Optional extensions
  for (const f of ['availableEquity', 'opexAnnual', 'softSources', 'deferredDevFee', 'marketCapRate', 'amiRentLimit'])
    if (d[f] != null && !(isNum(d[f]) && d[f] >= 0)) b2.push({ field: f, reason: 'must be a number >= 0 when provided' });
  if (d.lihtc) {
    const L = d.lihtc;
    if (![4, 9].includes(L.type)) b2.push({ field: 'lihtc.type', reason: 'must be 4 or 9' });
    if (!(isNum(L.eligibleBasis) && L.eligibleBasis >= 0)) b2.push({ field: 'lihtc.eligibleBasis', reason: 'must be >= 0' });
    if (!(isNum(L.applicableFraction) && L.applicableFraction > 0 && L.applicableFraction <= 1)) b2.push({ field: 'lihtc.applicableFraction', reason: 'must be in (0,1]' });
    if (!(isNum(L.creditPrice) && L.creditPrice > 0 && L.creditPrice <= 1.5)) b2.push({ field: 'lihtc.creditPrice', reason: 'equity $ per $1 of credit, e.g. 0.88' });
  }
  // Minor fields -> placeholders
  for (const f of ['dealName', 'address', 'market', 'assetType']) if (!d[f] || !String(d[f]).trim()) { placeholders[f] = '[not provided]'; warnings.push(f + ' not provided; placeholder used'); }
  if (!(isNum(d.arv) && d.arv > 0)) warnings.push('arv not provided; 70%-rule MAO undefined and ceiling uses DSCR-supported offer only');
  if (!isNum(d.availableEquity)) warnings.push('availableEquity not provided; equity hard-stop NOT evaluated');
  if (!isNum(d.marketCapRate)) warnings.push('marketCapRate not provided; cap-rate anomaly check skipped');
  if (!Array.isArray(d.comps) || !d.comps.length) warnings.push('no sourced comps supplied; comp-dependent items (price/unit benchmark, offer anchor) unsupported');
  else d.comps.forEach((c, i) => { if (!c.source) warnings.push('comp ' + (i + 1) + ' has no source; excluded'); });
  if (!b2.length && isNum(d.opexAnnual)) {
    const b = model(d), er = b.opex / b.egi;
    if (er > 1 && !(d.confirmedOverrides || []).includes('expense_ratio'))
      b2.push({ field: 'opexAnnual', reason: 'expense ratio ' + pc(er * 100) + ' > 100% of EGI. Correct it, or add "expense_ratio" to confirmedOverrides (deal will hard-stop on negative NOI)' });
  }
  return { blocking: b2, warnings, placeholders };
}

const monthlyPI = (loan, ratePct, years) => { if (loan <= 0) return 0; const r = ratePct / 1200, n = years * 12; return r === 0 ? loan / n : (loan * r) / (1 - (1 + r) ** -n); };
const lihtcCalc = d => {
  if (!d.lihtc) return { annual: 0, equity: 0 };
  const L = d.lihtc, rate = L.creditRate ?? (L.type === 4 ? 0.04 : 0.09), boost = L.basisBoost ? 1.3 : 1;
  const annual = L.eligibleBasis * boost * L.applicableFraction * rate; return { annual, equity: annual * 10 * L.creditPrice, rate, boost };
};

export function model(d, rs = 0, ro = 0) {
  const closing = d.askingPrice * d.closingCostPct / 100;
  const baseAllIn = d.askingPrice + closing + d.rehabBudget;
  const rehab = d.rehabBudget * (1 + ro);
  const allIn = d.askingPrice + closing + rehab;
  const gpr = d.units * d.currentRent * (1 + rs) * 12;
  const vacLoss = gpr * d.vacancyPct / 100;
  const ancillary = (gpr - vacLoss) * d.ancillaryPct / 100;
  const egi = gpr - vacLoss + ancillary;
  const opex = isNum(d.opexAnnual) ? d.opexAnnual : egi * d.opexRatioPct / 100;
  const noi = egi - opex;
  const loan = baseAllIn * d.ltvPct / 100;           // sized on base budget; overruns are equity-funded
  const ads = monthlyPI(loan, d.ratePct, d.amortYears) * 12;
  const lihtc = lihtcCalc(d), soft = d.softSources || 0, ddf = d.deferredDevFee || 0;
  const equity = allIn - loan - soft - lihtc.equity - ddf;
  const cf = noi - ads;
  const stabGpr = d.units * d.marketRent * (1 + rs) * 12;
  const stabEgi = stabGpr * (1 - d.vacancyPct / 100) * (1 + d.ancillaryPct / 100);
  const stabNOI = stabEgi - (isNum(d.opexAnnual) ? d.opexAnnual : stabEgi * d.opexRatioPct / 100);
  return { closing, rehab, allIn, gpr, vacLoss, ancillary, egi, opex, noi, loan, ads, lihtc, soft, ddf, equity, cf, stabNOI,
    dscr: ads > 0 ? noi / ads : null, coc: equity > 0 ? cf / equity : null };
}

export function underwrite(d, cfg = {}) {
  const C = { ...DEFAULTS, ...cfg, weights: { ...DEFAULTS.weights, ...(cfg.weights || {}) }, bands: { ...DEFAULTS.bands, ...(cfg.bands || {}) } };
  const v = validate(d);
  if (v.blocking.length) return { status: 'halt', engine: 'acq2-underwrite v4.1', blocking: v.blocking, warnings: v.warnings, message: 'Critical Dana Inputs invalid; no calculations run.' };
  const b = model(d), m = {}, hard_stops = [], anomalies = [], floor = C.dscr_floor;
  m.closing_costs = M(b.closing, 'askingPrice x closingCostPct', usd(d.askingPrice) + ' x ' + d.closingCostPct + '% = ' + usd(b.closing));
  m.all_in = M(b.allIn, 'askingPrice + closing + rehab', usd(d.askingPrice) + ' + ' + usd(b.closing) + ' + ' + usd(b.rehab) + ' = ' + usd(b.allIn));
  m.gpr = M(b.gpr, 'units x currentRent x 12', d.units + ' x ' + usd(d.currentRent) + ' x 12 = ' + usd(b.gpr));
  m.vacancy_loss = M(b.vacLoss, 'GPR x vacancyPct', usd(b.gpr) + ' x ' + d.vacancyPct + '% = ' + usd(b.vacLoss));
  m.ancillary = M(b.ancillary, '(GPR - vacancy) x ancillaryPct', '(' + usd(b.gpr) + ' - ' + usd(b.vacLoss) + ') x ' + d.ancillaryPct + '% = ' + usd(b.ancillary));
  m.egi = M(b.egi, 'GPR - vacancy + ancillary', usd(b.gpr) + ' - ' + usd(b.vacLoss) + ' + ' + usd(b.ancillary) + ' = ' + usd(b.egi));
  m.opex = isNum(d.opexAnnual) ? M(b.opex, 'opexAnnual (dollar override)', usd(b.opex)) : M(b.opex, 'EGI x opexRatioPct', usd(b.egi) + ' x ' + d.opexRatioPct + '% = ' + usd(b.opex));
  m.noi = M(b.noi, 'EGI - opex', usd(b.egi) + ' - ' + usd(b.opex) + ' = ' + usd(b.noi));
  m.going_in_cap_pct = M(b.noi / d.askingPrice * 100, 'NOI / askingPrice', usd(b.noi) + ' / ' + usd(d.askingPrice) + ' = ' + pc(b.noi / d.askingPrice * 100), 'buy-box definition (in-place NOI / price)');
  m.yield_on_all_in_pct = M(b.noi / b.allIn * 100, 'NOI / all-in', usd(b.noi) + ' / ' + usd(b.allIn) + ' = ' + pc(b.noi / b.allIn * 100), 'what src/lib/underwrite.ts labels "goingInCap"');
  m.stab_noi = M(b.stabNOI, 'units x marketRent x 12 x (1-vac) x (1+anc) - opex', usd(b.stabNOI));
  m.stab_cap_pct = M(b.stabNOI / b.allIn * 100, 'stabNOI / all-in (yield on cost)', usd(b.stabNOI) + ' / ' + usd(b.allIn) + ' = ' + pc(b.stabNOI / b.allIn * 100));
  m.loan = M(b.loan, 'base all-in x ltvPct', usd(d.askingPrice + b.closing + d.rehabBudget) + ' x ' + d.ltvPct + '% = ' + usd(b.loan));
  m.ads = M(b.ads, 'loan x r/(1-(1+r)^-n) x 12; r = ratePct/1200, n = amortYears x 12', usd(b.loan) + ' @ ' + d.ratePct + '% / ' + d.amortYears + 'yr = ' + usd(b.ads));
  m.dscr = b.ads > 0 ? M(b.dscr, 'NOI / ADS', usd(b.noi) + ' / ' + usd(b.ads) + ' = ' + rd(b.dscr, 3) + 'x') : U('NOI / ADS', 'no debt service');
  if (d.lihtc) m.lihtc_equity = M(b.lihtc.equity, 'eligibleBasis x boost x applicableFraction x creditRate x 10 x creditPrice', usd(d.lihtc.eligibleBasis) + ' x ' + b.lihtc.boost + ' x ' + d.lihtc.applicableFraction + ' x ' + b.lihtc.rate + ' x 10 x ' + d.lihtc.creditPrice + ' = ' + usd(b.lihtc.equity));
  m.equity_required = M(b.equity, 'all-in - loan - softSources - LIHTC equity - deferredDevFee', usd(b.allIn) + ' - ' + usd(b.loan) + ' - ' + usd(b.soft) + ' - ' + usd(b.lihtc.equity) + ' - ' + usd(b.ddf) + ' = ' + usd(b.equity));
  m.cash_flow = M(b.cf, 'NOI - ADS', usd(b.noi) + ' - ' + usd(b.ads) + ' = ' + usd(b.cf));
  m.coc_pct = b.equity > 0 ? M(b.coc * 100, 'cash flow / equity required', usd(b.cf) + ' / ' + usd(b.equity) + ' = ' + pc(b.coc * 100))
    : U('cash flow / equity required', 'equity required ' + usd(b.equity) + ' <= 0; CoC undefined. Verify sources are committed');
  const k = monthlyPI(1, d.ratePct, d.amortYears);
  let supported = null;
  if (b.noi > 0) {
    const maxLoan = b.noi / (floor * 12 * k);
    supported = (maxLoan / (d.ltvPct / 100) - d.rehabBudget) / (1 + d.closingCostPct / 100);
    m.supported_offer = M(supported, '((NOI / (floor x 12 x PI_per_$)) / LTC - rehab) / (1 + closing%)', 'maxLoan ' + usd(maxLoan) + ' at ' + floor + 'x -> price ' + usd(supported));
  } else m.supported_offer = U('DSCR-supported price', 'NOI <= 0; no debt supportable');
  const mao = isNum(d.arv) && d.arv > 0 ? 0.7 * d.arv - d.rehabBudget : null;
  m.mao70 = isNum(mao) ? M(mao, '0.70 x ARV - rehab', '0.70 x ' + usd(d.arv) + ' - ' + usd(d.rehabBudget) + ' = ' + usd(mao), 'flip heuristic; weak signal for income property') : U('0.70 x ARV - rehab', 'ARV not provided');
  const cands = [mao, supported].filter(isNum);
  const ceiling = cands.length ? Math.max(...cands) : null;
  const spreadPct = isNum(ceiling) ? (ceiling - d.askingPrice) / d.askingPrice * 100 : null;
  m.ceiling = isNum(ceiling) ? M(ceiling, 'max(MAO70, supported offer)', usd(ceiling), 'v4 drops the 0.55 x ask floor used in src/lib/underwrite.ts') : U('max(MAO70, supported offer)', 'neither MAO70 nor supported offer defined');
  m.spread_pct = isNum(spreadPct) ? M(spreadPct, '(ceiling - ask) / ask', '(' + usd(ceiling) + ' - ' + usd(d.askingPrice) + ') / ' + usd(d.askingPrice) + ' = ' + pc(spreadPct)) : U('(ceiling - ask)/ask', 'ceiling undefined');
  m.price_per_unit = M(d.askingPrice / d.units, 'ask / units', usd(d.askingPrice) + ' / ' + d.units + ' = ' + usd(d.askingPrice / d.units));
  m.grm = M(d.askingPrice / b.gpr, 'ask / GPR (annual)', usd(d.askingPrice) + ' / ' + usd(b.gpr) + ' = ' + rd(d.askingPrice / b.gpr, 2));
  const beo = (b.opex + b.ads) / (b.gpr * (1 + d.ancillaryPct / 100)) * 100;
  m.breakeven_occ_pct = M(beo, '(opex + ADS) / (GPR x (1 + anc%))', '(' + usd(b.opex) + ' + ' + usd(b.ads) + ') / ' + usd(b.gpr * (1 + d.ancillaryPct / 100)) + ' = ' + pc(beo), beo > 100 ? 'RED FLAG: cannot break even at 100% occupancy (not clamped)' : undefined);
  m.rent_gap_pct = M((d.marketRent - d.currentRent) / d.currentRent * 100, '(marketRent - currentRent) / currentRent', pc((d.marketRent - d.currentRent) / d.currentRent * 100));

  if (b.noi < 0) hard_stops.push({ metric: 'noi', value: rd(b.noi, 2), rule: 'NOI < 0' });
  if (b.ads > 0 && b.dscr < 1) hard_stops.push({ metric: 'dscr', value: rd(b.dscr, 4), rule: 'DSCR ' + rd(b.dscr, 2) + 'x < 1.00x at proposed terms' });
  if (isNum(d.availableEquity) && b.equity > d.availableEquity) hard_stops.push({ metric: 'equity_required', value: rd(b.equity, 2), rule: 'equity required ' + usd(b.equity) + ' > available ' + usd(d.availableEquity) });

  const gic = b.noi / d.askingPrice * 100;
  if (isNum(d.marketCapRate)) { const s = gic - d.marketCapRate; if (s > C.anomaly.cap_spread_high) anomalies.push({ type: 'cap_rate_high', detail: 'going-in ' + pc(gic) + ' vs market ' + pc(d.marketCapRate) }); if (s < C.anomaly.cap_spread_low) anomalies.push({ type: 'cap_rate_low', detail: 'going-in ' + pc(gic) + ' vs market ' + pc(d.marketCapRate) }); }
  if (isNum(d.amiRentLimit) && d.currentRent > d.amiRentLimit) anomalies.push({ type: 'rent_above_ami_limit', detail: usd(d.currentRent) + ' > ' + usd(d.amiRentLimit) });
  if (d.vacancyPct < C.anomaly.min_vacancy) anomalies.push({ type: 'vacancy_optimistic', detail: d.vacancyPct + '% vacancy' });
  if (beo > 100) anomalies.push({ type: 'breakeven_above_100', detail: pc(beo) });
  if (b.equity <= 0) anomalies.push({ type: 'zero_or_negative_equity', detail: 'sources exceed all-in by ' + usd(-b.equity) });
  if (isNum(spreadPct) && spreadPct < -8) anomalies.push({ type: 'ask_above_ceiling', detail: 'ask is ' + pc(-spreadPct) + ' above ceiling (old code auto-PASSed this; v4 scores it)' });

  const cells = [];
  for (const rs of C.rent_steps) for (const ro of C.rehab_steps) { const s = model(d, rs, ro); cells.push({ rent_delta: rs, rehab_delta: ro, noi: rd(s.noi, 2), dscr: rd(s.dscr, 4), coc_pct: isNum(s.coc) ? rd(s.coc * 100, 4) : null, equity_required: rd(s.equity, 2) }); }

  const comp = {};
  if (isNum(spreadPct)) comp.spread = clamp01((spreadPct + 5) / 25) * 100;
  if (isNum(b.dscr)) comp.dscr = clamp01((Math.min(b.dscr, 2) - 0.9) / 0.6) * 100;
  comp.cap = clamp01((b.stabNOI / b.allIn * 100 - 4.5) / 3.5) * 100;
  if (isNum(b.coc)) comp.coc = clamp01((b.coc * 100 + 2) / 12) * 100;
  const ws = Object.keys(comp).reduce((a, k2) => a + C.weights[k2], 0);
  const total = Math.round(Object.keys(comp).reduce((a, k2) => a + comp[k2] * C.weights[k2], 0) / ws);
  const verdict = hard_stops.length ? 'PASS' : total >= C.bands.strong ? 'STRONG ADVANTAGE' : total < C.bands.pass_below ? 'PASS' : 'NEGOTIATE';

  const comps = (d.comps || []).filter(c => c.source);
  const offer = isNum(supported) && supported > 0 ? { opening: Math.round(Math.min(ceiling, supported) * 0.92), target: Math.round(Math.min(ceiling, supported)), walk_away: Math.round(ceiling), basis: 'DSCR-supported offer at ' + floor + 'x' + (comps.length ? '; cross-check vs ' + comps.length + ' sourced comps' : '; NO sourced comps, so the anchor is unsupported') } : { unsupported: 'no positive DSCR-supported offer' };

  return { status: 'ok', engine: 'acq2-underwrite v4.1', config: { dscr_floor: floor, weights: C.weights, bands: C.bands },
    warnings: v.warnings, placeholders: v.placeholders, metrics: m,
    stress: { rent_steps: C.rent_steps, rehab_steps: C.rehab_steps, cells },
    score: { components: Object.fromEntries(Object.entries(comp).map(([k2, x]) => [k2, Math.round(x)])), weights_used: Object.fromEntries(Object.keys(comp).map(k2 => [k2, rd(C.weights[k2] / ws, 4)])), total },
    hard_stops, anomalies, verdict, verdict_basis: hard_stops.length ? 'HARD STOP: ' + hard_stops.map(h => h.rule).join('; ') : 'score ' + total + ' (STRONG >= ' + C.bands.strong + ', PASS < ' + C.bands.pass_below + ')',
    comps_used: comps, offer,
    verification: { performed: [], note: 'Engine performs no external checks. Agent must list only checks it actually ran, with URL and timestamp.' } };
}

