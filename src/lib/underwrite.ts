import type { Comp, DealInputs, Lever, Report, SensitivityCell, Verdict, VerificationBlock } from "./types";
import { fmtK, fmtPct } from "./format";
import { underwrite as runEngine, validate } from "./engine.mjs";
import type { EngineOk } from "./engine.mjs";

/*
 * ACQ/2.0 v4: the web app is a view over the shared engine (src/lib/engine.mjs).
 * The agent CLI (tools/underwrite.mjs) runs the same engine, so app and agent numbers always match.
 * Nothing in this file invents data: no generated comps, no random confidence, no unperformed "verified" checks.
 */

export const monthlyPI = (loan: number, ratePct: number, years: number): number => {
  if (loan <= 0) return 0;
  const r = ratePct / 1200;
  const n = years * 12;
  if (r === 0) return loan / n;
  return (loan * r) / (1 - Math.pow(1 + r, -n));
};

const val = (e: EngineOk, k: string): number => {
  const v = e.metrics[k]?.value;
  return typeof v === "number" ? v : NaN; // NaN renders as "—" via format.ts; the reason is in e.metrics[k].undefined_reason
};

/* Only critical fields block. Identity fields fall back to "[not provided]" placeholders. */
export const validateInputs = (i: DealInputs): Partial<Record<keyof DealInputs, string>> => {
  const out: Partial<Record<keyof DealInputs, string>> = {};
  for (const b of validate(i).blocking) {
    const key = b.field.split(".")[0] as keyof DealInputs;
    if (!out[key]) out[key] = b.reason;
  }
  return out;
};

const buildLevers = (i: DealInputs, m: Report["m"]): Lever[] => {
  const levers: Lever[] = [];
  if (Number.isFinite(m.spreadPct) && m.spreadPct > 4)
    levers.push({ kind: "upside", title: "Below-ceiling entry", detail: "Asking basis sits " + fmtPct(m.spreadPct) + " under the DSCR-supported ceiling.", impact: "+" + fmtK(m.spread) + " vs ceiling" });
  if (m.rentGapPct > 7)
    levers.push({ kind: "upside", title: "Rent gap to stabilized", detail: "In-place rents trail the stabilized assumption by " + fmtPct(m.rentGapPct, 0) + ". For regulated units, confirm the stabilized rent is at or below the AMI limit before counting it.", impact: "+" + fmtK(i.units * (i.marketRent - i.currentRent)) + "/mo at stab." });
  if (i.lihtc || (i.softSources ?? 0) > 0)
    levers.push({ kind: "execution", title: "Soft-source and credit discipline", detail: "LIHTC equity and soft funds carry this stack. Confirm commitment status (committed / conditional / aspirational) for each source before relying on them.", impact: fmtK(m.equity) + " equity after sources" });
  if (i.opexRatioPct > 55)
    levers.push({ kind: "upside", title: "Expense review", detail: "Opex at " + fmtPct(i.opexRatioPct, 0) + " of EGI is above the ~40-55% band typical for affordable operations. Check taxes (PILOT/abatement eligibility), insurance, and utilities.", impact: "~" + fmtK(m.egi * ((i.opexRatioPct - 55) / 100)) + "/yr at 55%" });
  if (i.ltvPct >= 75)
    levers.push({ kind: "execution", title: "High leverage", detail: "LTC of " + fmtPct(i.ltvPct, 0) + " leaves little room for a rate or vacancy shock.", impact: "LTC " + fmtPct(i.ltvPct, 0) });
  if (Number.isFinite(m.dscr) && m.dscr < 1.25)
    levers.push({ kind: "risk", title: "Coverage below 1.25x floor", detail: "DSCR of " + m.dscr.toFixed(2) + "x is under the 1.25x floor. Lenders will cut proceeds; more soft funds or a lower basis are needed.", impact: "DSCR " + m.dscr.toFixed(2) + "x" });
  if (m.breakEvenOcc > 0.85)
    levers.push({ kind: "risk", title: "High break-even occupancy", detail: "Expenses and debt service are covered only above " + fmtPct(m.breakEvenOcc * 100, 0) + " occupancy.", impact: "BE " + fmtPct(m.breakEvenOcc * 100, 0) });
  if (Number.isFinite(m.spreadPct) && m.spreadPct < 0)
    levers.push({ kind: "risk", title: "Basis above support", detail: "Ask is " + fmtK(Math.abs(m.spread)) + " above the supported ceiling.", impact: fmtK(m.spread) });
  const order = { upside: 0, execution: 1, risk: 2 };
  return levers.sort((a, b) => order[a.kind] - order[b.kind]).slice(0, 6);
};

export const underwrite = (inputs: DealInputs): Report => {
  const res = runEngine(inputs);
  if (res.status === "halt") {
    throw new Error("Dana Inputs blocked: " + res.blocking.map((b) => b.field + " (" + b.reason + ")").join("; "));
  }
  const e = res;
  const i = inputs;
  const loan = val(e, "loan");
  const ads = val(e, "ads");
  const cf = val(e, "cash_flow");
  const m: Report["m"] = {
    closingCosts: val(e, "closing_costs"),
    rehab: i.rehabBudget,
    allIn: val(e, "all_in"),
    equity: val(e, "equity_required"),
    loan,
    pgi: val(e, "gpr"),
    vacancyLoss: val(e, "vacancy_loss"),
    ancillary: val(e, "ancillary"),
    egi: val(e, "egi"),
    opex: val(e, "opex"),
    noi: val(e, "noi"),
    monthlyPI: ads / 12,
    ads,
    cashFlowAnnual: cf,
    cashFlowMonthly: cf / 12,
    goingInCap: val(e, "going_in_cap_pct"),
    yieldOnAllIn: val(e, "yield_on_all_in_pct"),
    stabNOI: val(e, "stab_noi"),
    stabCap: val(e, "stab_cap_pct"),
    dscr: val(e, "dscr"),
    coc: val(e, "coc_pct"),
    mao70: val(e, "mao70"),
    supportedOffer: val(e, "supported_offer"),
    ceiling: val(e, "ceiling"),
    spread: val(e, "ceiling") - i.askingPrice,
    spreadPct: val(e, "spread_pct"),
    pricePerUnit: val(e, "price_per_unit"),
    grm: val(e, "grm"),
    breakEvenOcc: val(e, "breakeven_occ_pct") / 100,
    rentGapPct: val(e, "rent_gap_pct"),
    ltc: i.ltvPct,
  };

  const verdict: Verdict = e.verdict;
  const verdictLine = e.hard_stops.length
    ? "HARD STOP: " + e.hard_stops.map((h) => h.rule).join("; ") + ". Declined regardless of score."
    : verdict === "STRONG ADVANTAGE"
      ? "Clears the score bands with margin. Confirm sources and diligence before the LOI."
      : verdict === "NEGOTIATE"
        ? "Viable at the right number. Retrade toward the supported ceiling."
        : "Score below the pass band at this basis. Monitor for a reprice.";

  const rentDeltas = e.stress.rent_steps;
  const rehabDeltas = e.stress.rehab_steps;
  const matrix: SensitivityCell[][] = rentDeltas.map((rd) =>
    rehabDeltas.map((hd) => {
      const c = e.stress.cells.find((x) => x.rent_delta === rd && x.rehab_delta === hd)!;
      return { rentDelta: rd, rehabDelta: hd, coc: c.coc_pct ?? NaN, dscr: c.dscr ?? NaN };
    })
  );

  const offer = "unsupported" in e.offer
    ? { opening: NaN, target: NaN, ceiling: NaN, credits: NaN }
    : { opening: e.offer.opening, target: e.offer.target, ceiling: e.offer.walk_away, credits: Math.round(Math.min(i.rehabBudget * 0.15, i.askingPrice * 0.025)) };

  const comps: Comp[] = e.comps_used;
  const levers = buildLevers(i, m);
  const name = i.dealName?.trim() || "[not provided]";
  const where = i.address?.trim() || "[address not provided]";
  const avgPpu = comps.length ? comps.reduce((s, x) => s + x.pricePerUnit, 0) / comps.length : NaN;
  const narrative = [
    name + " at " + where + " is offered at " + fmtK(i.askingPrice) + " (" + fmtK(m.pricePerUnit) + "/unit). " +
      (comps.length ? "Against " + comps.length + " sourced comps averaging " + fmtK(avgPpu) + "/unit. " : "No sourced comps were supplied, so the price/unit benchmark and comp-anchored offer are unsupported. ") +
      (Number.isFinite(m.ceiling) ? "The engine's supported ceiling is " + fmtK(m.ceiling) + "." : "No supported ceiling could be computed."),
    "In-place NOI " + fmtK(m.noi) + " (" + fmtPct(m.goingInCap) + " on price, " + fmtPct(m.yieldOnAllIn) + " on all-in); stabilized yield on cost " + fmtPct(m.stabCap) + ". " +
      "Debt " + fmtK(loan) + " at " + fmtPct(i.ratePct, 2) + " gives " + (Number.isFinite(m.dscr) ? m.dscr.toFixed(2) + "x DSCR" : "no DSCR") + " and " +
      (Number.isFinite(m.coc) ? m.coc.toFixed(1) + "% cash-on-cash" : "undefined cash-on-cash (" + (e.metrics.coc_pct.undefined_reason ?? "") + ")") + ".",
    e.hard_stops.length
      ? "Recommendation: decline as structured. Hard stop: " + e.hard_stops.map((h) => h.rule).join("; ") + "."
      : "Recommendation: " + (verdict === "STRONG ADVANTAGE" ? "advance to LOI" : verdict === "NEGOTIATE" ? "counter toward the supported ceiling" : "pass at this basis") + ". " + e.verdict_basis + ".",
  ];

  const verification: VerificationBlock = {
    primarySources: [],
    externalChecks: [],
    items: [
      { item: "Underwriting math", status: "verified", source: e.engine, note: "Every figure computed by the shared engine; formulas in the agent results.json" },
      { item: "Comparable sales", status: comps.length ? "verified" : "not_performed", source: comps.length ? comps.map((c) => c.source).join("; ") : "none supplied", note: comps.length ? comps.length + " sourced comps" : "Comp-dependent items unsupported" },
      { item: "External checks (assessor, FEMA flood, HUD AMI limits)", status: "not_performed", source: "not run by the web app", note: "The agent must perform and cite these; the app never claims them" },
      { item: "Equity hard stop", status: typeof i.availableEquity === "number" ? "verified" : "not_performed", source: "availableEquity input", note: typeof i.availableEquity === "number" ? "Evaluated" : "availableEquity not provided" },
      ...e.anomalies.map((a) => ({ item: "Anomaly: " + a.type, status: "flagged" as const, source: e.engine, note: a.detail })),
    ],
    confidenceZones: [],
    overallConfidence: null,
  };

  return {
    inputs: i,
    refNo: "DDAR-2026-" + (i.id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() || "000000"),
    generatedAt: Date.now(),
    verdict,
    verdictLine,
    scores: {
      spread: e.score.components.spread ?? 0,
      dscr: e.score.components.dscr ?? 0,
      cap: e.score.components.cap ?? 0,
      coc: e.score.components.coc ?? 0,
      total: e.score.total,
    },
    confidence: null,
    m,
    offer,
    levers,
    matrix,
    rentDeltas,
    rehabDeltas,
    comps,
    narrative,
    verification,
    hardStops: e.hard_stops.map((h) => ({ metric: h.metric, rule: h.rule })),
    anomalies: e.anomalies,
    warnings: e.warnings,
    engine: e.engine,
  };
};
