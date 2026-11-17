#!/usr/bin/env node
// Exports a deal to an Excel workbook that RE-COMPUTES every engine number with live Excel formulas
// and checks each one against the engine, so a reviewer can audit the math independently.
// Usage: node tools/export_xlsx.mjs <deal.json> --out model.xlsx [--levers levers.json] [--ami ami_rents.json]
// Colour convention (banking standard): blue = input, black = formula, green = engine value for comparison.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { underwrite } from '../src/lib/engine.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const inPath = process.argv[2], out = arg('--out');
if (!inPath || !out) { console.error('usage: node tools/export_xlsx.mjs <deal.json> --out model.xlsx [--levers levers.json] [--ami ami_rents.json]'); process.exit(1); }
let d = JSON.parse(fs.readFileSync(inPath, 'utf8')); if (d.inputs) d = d.inputs;
const res = underwrite(d);
if (res.status !== 'ok') { console.error('engine halted; nothing to export: ' + JSON.stringify(res.blocking)); process.exit(2); }
const levers = arg('--levers') ? JSON.parse(fs.readFileSync(arg('--levers'), 'utf8')) : null;
const ami = arg('--ami') ? JSON.parse(fs.readFileSync(arg('--ami'), 'utf8')) : null;
const isNum = v => typeof v === 'number' && Number.isFinite(v);

// ---------- styles
const S = { def: 0, head: 1, inNum: 2, fUsd: 3, fPct: 4, fX: 5, eUsd: 6, ePct: 7, eX: 8, fNum: 9, eNum: 10, bold: 11, text: 12, title: 13, inPct: 14, fTxt: 15, eTxt: 16, note: 17 };
const stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
 + '<numFmts count="5"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0;(&quot;$&quot;#,##0)"/><numFmt numFmtId="165" formatCode="#,##0.00"/><numFmt numFmtId="166" formatCode="0.000&quot;x&quot;"/><numFmt numFmtId="167" formatCode="0.00&quot;%&quot;"/><numFmt numFmtId="168" formatCode="#,##0.####"/></numFmts>'
 + '<fonts count="6"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><sz val="11"/><color rgb="FF0000FF"/><name val="Calibri"/></font><font><sz val="11"/><color rgb="FF008000"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF595959"/><name val="Calibri"/></font></fonts>'
 + '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9E1F2"/><bgColor indexed="64"/></patternFill></fill></fills>'
 + '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FF808080"/></bottom><diagonal/></border></borders>'
 + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="18">'
 + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
 + '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment wrapText="1" vertical="center"/></xf>'
 + '<xf numFmtId="168" fontId="2" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'
 + '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
 + '<xf numFmtId="167" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
 + '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
 + '<xf numFmtId="164" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'
 + '<xf numFmtId="167" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'
 + '<xf numFmtId="166" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'
 + '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
 + '<xf numFmtId="165" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'
 + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
 + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment wrapText="1" vertical="top"/></xf>'
 + '<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
 + '<xf numFmtId="167" fontId="2" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'
 + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
 + '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
 + '<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment wrapText="1" vertical="top"/></xf>'
 + '</cellXfs></styleSheet>';

// ---------- sheet builder
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const colL = n => { let s = ''; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
function Sheet(name, widths) { this.name = name; this.rows = []; this.widths = widths || []; }
Sheet.prototype.row = function (cells) { this.rows.push(cells); return this.rows.length; };
Sheet.prototype.xml = function () {
  const cols = this.widths.length ? '<cols>' + this.widths.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols>' : '';
  const body = this.rows.map((cells, ri) => '<row r="' + (ri + 1) + '">' + cells.map((c, ci) => {
    if (c == null) return '';
    const ref = colL(ci) + (ri + 1), st = c.s != null ? ' s="' + c.s + '"' : '';
    if (c.f != null) return '<c r="' + ref + '"' + st + '><f>' + esc(c.f) + '</f></c>';
    if (isNum(c.v)) return '<c r="' + ref + '"' + st + '><v>' + c.v + '</v></c>';
    if (c.v == null || c.v === '') return '<c r="' + ref + '"' + st + '/>';
    return '<c r="' + ref + '"' + st + ' t="inlineStr"><is><t xml:space="preserve">' + esc(c.v) + '</t></is></c>';
  }).join('') + '</row>').join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0">' + (this.freeze ? '<pane ySplit="' + this.freeze + '" topLeftCell="A' + (this.freeze + 1) + '" activePane="bottomLeft" state="frozen"/>' : '') + '</sheetView></sheetViews>' + cols + '<sheetData>' + body + '</sheetData></worksheet>';
};
const T = (v, s = S.text) => ({ v, s }), N = (v, s) => ({ v, s }), F = (f, s) => ({ f, s });
const names = [];
const nm = (name, sheet, ref) => names.push([name, "'" + sheet + "'!" + ref]);

// ---------- Inputs
const inputs = new Sheet('Inputs', [34, 18, 14, 60]); inputs.freeze = 3;
inputs.row([T('Inputs (blue = change these and every formula recalculates)', S.title)]);
inputs.row([T('Source: ' + inPath, S.note)]);
inputs.row([T('Input', S.head), T('Value', S.head), T('Name', S.head), T('Note', S.head)]);
const L = d.lihtc || null;
const IN = [
  ['in_Price', 'Asking price ($)', d.askingPrice], ['in_Rehab', 'Rehab budget ($)', d.rehabBudget], ['in_Units', 'Units', d.units],
  ['in_CurRent', 'Current rent ($/unit/month)', d.currentRent], ['in_MktRent', 'Market rent ($/unit/month)', d.marketRent],
  ['in_Vac', 'Vacancy (%)', d.vacancyPct], ['in_Opex', 'Opex ratio (% of EGI)', d.opexRatioPct],
  ['in_OpexAnnual', 'Opex annual override ($; blank = use ratio)', isNum(d.opexAnnual) ? d.opexAnnual : null],
  ['in_Anc', 'Ancillary income (% of EGI)', d.ancillaryPct], ['in_Closing', 'Closing costs (% of price)', d.closingCostPct],
  ['in_LTC', 'Loan-to-cost (%)', d.ltvPct], ['in_Rate', 'Interest rate (%)', d.ratePct], ['in_Amort', 'Amortization (years)', d.amortYears],
  ['in_ARV', 'ARV ($; 0 = not provided)', isNum(d.arv) ? d.arv : 0],
  ['in_AvailEq', 'Available equity ($; blank = not provided)', isNum(d.availableEquity) ? d.availableEquity : null],
  ['in_Soft', 'Soft sources ($)', d.softSources || 0], ['in_DDF', 'Deferred developer fee ($)', d.deferredDevFee || 0],
  ['in_MktCap', 'Market cap rate (%)', isNum(d.marketCapRate) ? d.marketCapRate : null], ['in_AMI', 'AMI rent limit ($/month)', isNum(d.amiRentLimit) ? d.amiRentLimit : null],
  ['in_Basis', 'LIHTC eligible basis ($)', L ? L.eligibleBasis : 0], ['in_Boost', 'LIHTC 130% basis boost (1 = yes, 0 = no)', L ? (L.basisBoost ? 1 : 0) : 0],
  ['in_AppFrac', 'LIHTC applicable fraction', L ? L.applicableFraction : 0], ['in_CreditRate', 'LIHTC credit rate', L ? (L.creditRate ?? (L.type === 4 ? 0.04 : 0.09)) : 0],
  ['in_CreditPrice', 'LIHTC credit price ($ per $1 of credit)', L ? L.creditPrice : 0],
  ['in_Floor', 'DSCR floor (x)', res.config.dscr_floor], ['w_spread', 'Score weight: spread', res.config.weights.spread], ['w_dscr', 'Score weight: DSCR', res.config.weights.dscr],
  ['w_cap', 'Score weight: stabilized yield', res.config.weights.cap], ['w_coc', 'Score weight: cash-on-cash', res.config.weights.coc],
  ['b_strong', 'STRONG ADVANTAGE at or above', res.config.bands.strong], ['b_pass', 'PASS below', res.config.bands.pass_below],
];
for (const [n, label, v] of IN) { const r = inputs.row([T(label, S.def), v == null ? T('', S.inNum) : N(v, S.inNum), T(n, S.note)]); nm(n, 'Inputs', '$B$' + r); }

// ---------- Calc
const calc = new Sheet('Calc', [26, 18, 18, 12, 9, 52, 58]); calc.freeze = 4;
calc.row([T('Calculation check: Excel formula vs engine', S.title)]);
calc.row([T('Column B recomputes each metric from the Inputs sheet with live formulas. Column C is the engine output. Column E (Status) says OK when they agree, CHECK when they differ.', S.note)]);
calc.row([F('IF(COUNTIF(E:E,"CHECK")=0,"All "&COUNTIF(E:E,"OK")&" checks agree","MISMATCH: "&COUNTIF(E:E,"CHECK")&" check(s) differ")', S.bold)]);
calc.row([T('Metric', S.head), T('Excel formula', S.head), T('Engine', S.head), T('Difference', S.head), T('Status', S.head), T('Formula (engine)', S.head), T('Engine calculation', S.head)]);
const m = res.metrics, hasOA = isNum(d.opexAnnual), hasEq = isNum(d.availableEquity);
const kind = k => /pct/.test(k) ? 'pct' : k === 'dscr' ? 'x' : k === 'grm' ? 'num' : 'usd';
const fS = { usd: S.fUsd, pct: S.fPct, x: S.fX, num: S.fNum }, eS = { usd: S.eUsd, pct: S.ePct, x: S.eX, num: S.eNum };
const lihtcEq = L ? 'm_lihtc_equity' : '0';
const FX = {
  closing_costs: 'in_Price*in_Closing/100', all_in: 'in_Price+m_closing_costs+in_Rehab', gpr: 'in_Units*in_CurRent*12',
  vacancy_loss: 'm_gpr*in_Vac/100', ancillary: '(m_gpr-m_vacancy_loss)*in_Anc/100', egi: 'm_gpr-m_vacancy_loss+m_ancillary',
  opex: hasOA ? 'in_OpexAnnual' : 'm_egi*in_Opex/100', noi: 'm_egi-m_opex',
  going_in_cap_pct: 'm_noi/in_Price*100', yield_on_all_in_pct: 'm_noi/m_all_in*100',
  stab_noi: hasOA ? 'in_Units*in_MktRent*12*(1-in_Vac/100)*(1+in_Anc/100)-in_OpexAnnual' : 'in_Units*in_MktRent*12*(1-in_Vac/100)*(1+in_Anc/100)*(1-in_Opex/100)',
  stab_cap_pct: 'm_stab_noi/m_all_in*100', loan: '(in_Price+m_closing_costs+in_Rehab)*in_LTC/100',
  ads: 'IF(m_loan<=0,0,-PMT(in_Rate/1200,in_Amort*12,m_loan)*12)', dscr: 'IF(m_ads>0,m_noi/m_ads,"n/a")',
  lihtc_equity: 'in_Basis*IF(in_Boost=1,1.3,1)*in_AppFrac*in_CreditRate*10*in_CreditPrice',
  equity_required: 'm_all_in-m_loan-in_Soft-' + lihtcEq + '-in_DDF', cash_flow: 'm_noi-m_ads',
  coc_pct: 'IF(m_equity_required>0,m_cash_flow/m_equity_required*100,"n/a")',
  supported_offer: 'IF(m_noi>0,((m_noi/(in_Floor*12*-PMT(in_Rate/1200,in_Amort*12,1)))/(in_LTC/100)-in_Rehab)/(1+in_Closing/100),"n/a")',
  equity_supported_offer: hasEq ? '((in_AvailEq+in_Soft+' + lihtcEq + '+in_DDF)/(1-in_LTC/100)-in_Rehab)/(1+in_Closing/100)' : '"n/a"',
  mao70: 'IF(in_ARV>0,0.7*in_ARV-in_Rehab,"n/a")', ceiling: 'IF(COUNT(m_mao70,m_supported_offer)=0,"n/a",MAX(m_mao70,m_supported_offer))',
  spread_pct: 'IF(ISNUMBER(m_ceiling),(m_ceiling-in_Price)/in_Price*100,"n/a")', price_per_unit: 'in_Price/in_Units', grm: 'in_Price/m_gpr',
  breakeven_occ_pct: '(m_opex+m_ads)/(m_gpr*(1+in_Anc/100))*100', rent_gap_pct: '(in_MktRent-in_CurRent)/in_CurRent*100',
};
const checkF = (r, mode) => mode === 'text' ? 'IF(B' + r + '=C' + r + ',"OK","CHECK")'
  : mode === 'round0' ? 'IF(AND(ISNUMBER(B' + r + '),ISNUMBER(C' + r + ')),IF(ROUND(B' + r + ',0)=C' + r + ',"OK","CHECK"),IF(AND(ISTEXT(B' + r + '),ISTEXT(C' + r + ')),"OK","CHECK"))'
  : 'IF(AND(ISNUMBER(B' + r + '),ISNUMBER(C' + r + ')),IF(ABS(B' + r + '-C' + r + ')<=MAX(0.01,ABS(C' + r + ')*0.000001),"OK","CHECK"),IF(AND(ISTEXT(B' + r + '),ISTEXT(C' + r + ')),"OK","CHECK"))';
const addRow = (key, label, f, ev, k, mode, formulaTxt, calcTxt) => {
  const r = calc.rows.length + 1;
  calc.row([T(label, S.def), F(f, fS[k] ?? S.fTxt), ev == null ? T('n/a', S.eTxt) : (typeof ev === 'string' ? T(ev, S.eTxt) : N(ev, eS[k] ?? S.eNum)),
    F('IF(AND(ISNUMBER(B' + r + '),ISNUMBER(C' + r + ')),B' + r + '-C' + r + ',"")', S.fNum), F(checkF(r, mode), S.bold), T(formulaTxt || '', S.note), T(calcTxt || '', S.note)]);
  nm('m_' + key, 'Calc', '$B$' + r);
};
for (const [k, v] of Object.entries(m)) { if (!FX[k]) continue; addRow(k, k, FX[k], v.value, kind(k), 'num', v.formula, v.calc || v.undefined_reason); }
calc.row([]); calc.row([T('Score', S.head)]);
const comp = res.score.components;
const SC = {
  spread: 'IF(ISNUMBER(m_spread_pct),MAX(0,MIN(1,(m_spread_pct+5)/25))*100,"n/a")', dscr: 'IF(ISNUMBER(m_dscr),MAX(0,MIN(1,(MIN(m_dscr,2)-0.9)/0.6))*100,"n/a")',
  cap: 'MAX(0,MIN(1,(m_stab_cap_pct-4.5)/3.5))*100', coc: 'IF(ISNUMBER(m_coc_pct),MAX(0,MIN(1,(m_coc_pct+2)/12))*100,"n/a")' };
for (const k of ['spread', 'dscr', 'cap', 'coc']) addRow('score_' + k, 'score component: ' + k, SC[k], isNum(comp[k]) ? comp[k] : null, 'num', 'round0', 'engine rounds the displayed component');
const wsum = ['spread', 'dscr', 'cap', 'coc'].map(k => 'IF(ISNUMBER(m_score_' + k + '),w_' + k + ',0)').join('+');
const psum = ['spread', 'dscr', 'cap', 'coc'].map(k => 'IF(ISNUMBER(m_score_' + k + '),m_score_' + k + '*w_' + k + ',0)').join('+');
addRow('score_total', 'score total', '(' + psum + ')/(' + wsum + ')', res.score.total, 'num', 'round0', 'weights renormalized over defined components');
calc.row([]); calc.row([T('Hard stops and verdict', S.head)]);
const hsSet = new Set(res.hard_stops.map(h => h.metric));
addRow('hs_noi', 'hard stop: NOI < 0', 'IF(m_noi<0,"HARD STOP","ok")', hsSet.has('noi') ? 'HARD STOP' : 'ok', 'txt', 'text');
addRow('hs_dscr', 'hard stop: DSCR < 1.00x', 'IF(AND(m_ads>0,ISNUMBER(m_dscr)),IF(m_dscr<1,"HARD STOP","ok"),"ok")', hsSet.has('dscr') ? 'HARD STOP' : 'ok', 'txt', 'text');
addRow('hs_equity', 'hard stop: equity > available', hasEq ? 'IF(m_equity_required>in_AvailEq,"HARD STOP","ok")' : '"not evaluated"', hasEq ? (hsSet.has('equity_required') ? 'HARD STOP' : 'ok') : 'not evaluated', 'txt', 'text');
addRow('verdict', 'verdict', 'IF(OR(m_hs_noi="HARD STOP",m_hs_dscr="HARD STOP",m_hs_equity="HARD STOP"),"PASS",IF(ROUND(m_score_total,0)>=b_strong,"STRONG ADVANTAGE",IF(ROUND(m_score_total,0)<b_pass,"PASS","NEGOTIATE")))', res.verdict, 'txt', 'text');
if (isNum(res.offer.walk_away)) {
  calc.row([]); calc.row([T('Offer (walk-away = lowest of DSCR, equity and ask limits)', S.head)]);
  const mins = ['m_supported_offer'].concat(hasEq ? ['m_equity_supported_offer'] : []).concat(['in_Price']).join(',');
  addRow('offer_walk_away', 'offer: walk-away', 'MIN(' + mins + ')', res.offer.walk_away, 'usd', 'round0');
  addRow('offer_target', 'offer: target (96%)', 'm_offer_walk_away*0.96', res.offer.target, 'usd', 'round0');
  addRow('offer_opening', 'offer: opening (92%)', 'm_offer_walk_away*0.92', res.offer.opening, 'usd', 'round0');
  addRow('offer_binding', 'offer: binding constraint', 'IF(m_offer_walk_away=m_supported_offer,"dscr_floor",' + (hasEq ? 'IF(m_offer_walk_away=m_equity_supported_offer,"available_equity","asking_price")' : '"asking_price"') + ')', res.offer.binding_constraint, 'txt', 'text');
}

// ---------- Stress
const stress = new Sheet('Stress', [12, 13, 14, 10, 15, 10, 14, 10, 15, 10, 9]); stress.freeze = 4;
stress.row([T('Stress grid: rent change x rehab overrun (loan sized on base budget; overruns funded with equity)', S.title)]);
stress.row([T('Black = Excel formula from Inputs; green = engine. Status = OK when NOI, DSCR, equity and cash-on-cash all agree.', S.note)]);
stress.row([F('IF(COUNTIF(K:K,"CHECK")=0,"All "&COUNTIF(K:K,"OK")&" cells agree","MISMATCH: "&COUNTIF(K:K,"CHECK")&" cell(s) differ")', S.bold)]);
stress.row(['Rent change', 'Rehab overrun', 'NOI (Excel)', 'DSCR (Excel)', 'Equity (Excel)', 'CoC % (Excel)', 'NOI (engine)', 'DSCR (engine)', 'Equity (engine)', 'CoC % (engine)', 'Status'].map(h => T(h, S.head)));
const noiF = r => hasOA ? 'in_Units*in_CurRent*(1+A' + r + ')*12*(1-in_Vac/100)*(1+in_Anc/100)-in_OpexAnnual' : 'in_Units*in_CurRent*(1+A' + r + ')*12*(1-in_Vac/100)*(1+in_Anc/100)*(1-in_Opex/100)';
for (const c of res.stress.cells) {
  const r = stress.rows.length + 1;
  stress.row([N(c.rent_delta, S.fNum), N(c.rehab_delta, S.fNum), F(noiF(r), S.fUsd), F('IF(m_ads>0,C' + r + '/m_ads,"n/a")', S.fX),
    F('in_Price+m_closing_costs+in_Rehab*(1+B' + r + ')-m_loan-in_Soft-' + lihtcEq + '-in_DDF', S.fUsd), F('IF(E' + r + '>0,(C' + r + '-m_ads)/E' + r + '*100,"n/a")', S.fPct),
    N(c.noi, S.eUsd), c.dscr == null ? T('n/a', S.eTxt) : N(c.dscr, S.eX), N(c.equity_required, S.eUsd), c.coc_pct == null ? T('n/a', S.eTxt) : N(c.coc_pct, S.ePct),
    F('IF(AND(ABS(C' + r + '-G' + r + ')<=0.01,IF(ISNUMBER(H' + r + '),ABS(D' + r + '-H' + r + ')<=0.0001,TRUE),ABS(E' + r + '-I' + r + ')<=0.01,IF(ISNUMBER(J' + r + '),ABS(F' + r + '-J' + r + ')<=0.0001,TRUE)),"OK","CHECK")', S.bold)]);
}

// ---------- Scenarios (static engine re-runs)
const sheets = [];
let scen = null;
if (levers) {
  scen = new Sheet('Scenarios', [58, 18, 8, 9, 15, 15, 10, 15, 50]); scen.freeze = 3;
  scen.row([T('Lever and downside scenarios (engine re-runs; values, not live formulas)', S.title)]);
  scen.row([T('Each row is a full engine re-underwrite of the inputs with the change shown. To test one in Excel, change the blue inputs on the Inputs sheet the same way.', S.note)]);
  scen.row(['Scenario', 'Verdict', 'Score', 'DSCR', 'LIHTC equity', 'Equity required', 'CoC %', 'Walk-away', 'Change (code)'].map(h => T(h, S.head)));
  for (const s of levers.scenarios) scen.row([T(s.label, S.def), T(s.verdict, S.eTxt), N(s.score, S.eNum), N(s.dscr, S.eX), N(s.lihtc_equity, S.eUsd), N(s.equity_required, S.eUsd), isNum(s.coc_pct) ? N(s.coc_pct, S.ePct) : T('n/a', S.eTxt), s.offer && isNum(s.offer.walk_away) ? N(s.offer.walk_away, S.eUsd) : T('n/a', S.eTxt), T(s.changes, S.note)]);
}

// ---------- AMI
let amiS = null;
if (ami) {
  amiS = new Sheet('AMI', [12, 18, 22, 22, 22, 9]); amiS.freeze = 6;
  amiS.row([T('HUD FY' + ami.fy + ' MTSP 60% AMI rent limits: ' + ami.area, S.title)]);
  amiS.row([T('Max gross rent = 30% x income limit at imputed household size / 12 (1.5 persons per bedroom; studio = 1). Gross rent includes the utility allowance.', S.note)]);
  amiS.row([T('Household size', S.head)].concat(ami.limits_60.map((_, i) => T(String(i + 1), S.head))));
  const limRow = amiS.row([T('60% limit ($)', S.def)].concat(ami.limits_60.map(v => N(v, S.inNum))));
  nm('ami_lim', 'AMI', '$B$' + limRow + ':$' + colL(ami.limits_60.length) + '$' + limRow);
  amiS.row([]);
  amiS.row(['Bedrooms', 'Imputed persons', 'Income limit (Excel)', 'Max gross rent (Excel)', 'Max gross rent (engine run)', 'Status'].map(h => T(h, S.head)));
  for (const a of ami.rents) { const r = amiS.rows.length + 1;
    amiS.row([N(a.bedrooms, S.inNum), F('IF(A' + r + '=0,1,A' + r + '*1.5)', S.fNum), F('AVERAGE(INDEX(ami_lim,INT(B' + r + ')),INDEX(ami_lim,ROUNDUP(B' + r + ',0)))', S.fUsd), F('ROUNDDOWN(C' + r + '*0.3/12,0)', S.fUsd), N(a.max_gross_rent_60, S.eUsd), F('IF(D' + r + '=E' + r + ',"OK","CHECK")', S.bold)]); }
}

// ---------- Summary
const sum = new Sheet('Summary', [30, 70]);
sum.row([T((d.dealName || 'Deal') + ': underwriting audit workbook', S.title)]);
sum.row([T('Engine', S.bold), T(res.engine)]);
sum.row([T('Generated', S.bold), T(new Date().toISOString())]);
sum.row([T('Inputs file', S.bold), T(inPath)]);
sum.row([T('Verdict (engine)', S.bold), T(res.verdict + ' · score ' + res.score.total + ' · ' + res.verdict_basis)]);
sum.row([T('Calc checks', S.bold), F("'Calc'!A3", S.bold)]);
sum.row([T('Stress checks', S.bold), F("'Stress'!A3", S.bold)]);
if (amiS) sum.row([T('AMI checks', S.bold), F('IF(COUNTIF(AMI!F:F,"CHECK")=0,"All "&COUNTIF(AMI!F:F,"OK")&" rows agree","MISMATCH")', S.bold)]);
sum.row([]);
sum.row([T('How to use', S.head), T('', S.head)]);
for (const [a, b] of [
  ['Colours', 'Blue = input (change these). Black = Excel formula. Green = engine value, kept for comparison.'],
  ['Audit the math', 'Calc recomputes every engine metric from the Inputs sheet with live formulas and shows OK or CHECK next to each.'],
  ['What-if', 'Change a blue input. The Excel columns recalculate. The green engine columns do not change, so their checks will show CHECK. That is expected, because you are now testing a new case.'],
  ['Debt service', 'Uses Excel PMT: monthly rate = rate / 1200, term = years x 12, times 12 for an annual figure.'],
  ['Scenarios', 'Engine re-runs, stored as values. Each row records the code change it applies.'],
  ['Named cells', 'Inputs are named in_*, calc results m_*. Use Formulas > Name Manager to trace them.'],
]) sum.row([T(a, S.bold), T(b)]);

// ---------- assemble
const all = [sum, inputs, calc, stress].concat(scen ? [scen] : []).concat(amiS ? [amiS] : []);
const files = [];
files.push(['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + all.map((s, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>']);
files.push(['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>']);
files.push(['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + all.map((s, i) => '<sheet name="' + esc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets><definedNames>' + names.map(([n, r]) => '<definedName name="' + n + '">' + esc(r) + '</definedName>').join('') + '</definedNames><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>']);
files.push(['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + all.map((s, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '<Relationship Id="rId' + (all.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>']);
files.push(['xl/styles.xml', stylesXml]);
all.forEach((s, i) => files.push(['xl/worksheets/sheet' + (i + 1) + '.xml', s.xml()]));

// ---------- minimal zip writer (deflate)
const parts = [], central = []; let offset = 0;
for (const [name, content] of files) {
  const data = Buffer.from(content, 'utf8'), comp = zlib.deflateRawSync(data), crc = zlib.crc32(data) >>> 0, nameB = Buffer.from(name, 'utf8');
  const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6); lh.writeUInt16LE(8, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0x21, 12);
  lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nameB.length, 26); lh.writeUInt16LE(0, 28);
  parts.push(lh, nameB, comp);
  const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0, 8); ch.writeUInt16LE(8, 10); ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0x21, 14);
  ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nameB.length, 28); ch.writeUInt32LE(offset, 42);
  central.push(ch, nameB); offset += 30 + nameB.length + comp.length;
}
const cd = Buffer.concat(central), eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(files.length, 8); eocd.writeUInt16LE(files.length, 10); eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16);
fs.writeFileSync(out, Buffer.concat([...parts, cd, eocd]));
console.log('wrote ' + out + ' (' + all.map(s => s.name).join(', ') + '; ' + names.length + ' named cells)');
