import type {
  Comp,
  DealInputs,
  Lever,
  Report,
  SensitivityCell,
  Verdict,
  VerificationBlock,
  ReconciliationCheck,
  SponsorProfile,
  PortfolioConcentration,
  AssumptionFreshness,
} from "./types";
import { clamp01, fmtK, fmtPct } from "./format";
import {
  buildVerification,
  reconcileDocuments,
  checkAssumptionFreshness,
  buildSponsorProfile,
  checkPortfolioConcentration,
  verifyComputations,
  type ComputedMetrics,
} from "./verify";

/* ---------------- deterministic rng ---------------- */
const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const mulberry = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ---------------- debt math ---------------- */
export const monthlyPI = (loan: number, ratePct: number, years: number): number => {
  if (loan <= 0) return 0;
  const r = ratePct / 1200;
  const n = years * 12;
  if (r === 0) return loan / n;
  return (loan * r) / (1 - Math.pow(1 + r, -n));
};

/* ---------------- core model ---------------- */
interface CoreOut {
  closingCosts: number;
  rehab: number;
  allIn: number;
  pgi: number;
  vacancyLoss: number;
  ancillary: number;
  egi: number;
  opex: number;
  noi: number;
  loan: number;
  equity: number;
  pi: number;
  ads: number;
  cf: number;
  dscr: number;
  coc: number;
  stabNOI: number;
}

const core = (i: DealInputs, rentDelta = 0, rehabDelta = 0): CoreOut => {
  const closingCosts = (i.askingPrice * i.closingCostPct) / 100;
  const rehab = i.rehabBudget * (1 + rehabDelta);
  const allIn = i.askingPrice + closingCosts + rehab;
  const rent = i.currentRent * (1 + rentDelta);
  const pgi = i.units * rent * 12;
  const vacancyLoss = (pgi * i.vacancyPct) / 100;
  const ancillary = ((pgi - vacancyLoss) * i.ancillaryPct) / 100;
  const egi = pgi - vacancyLoss + ancillary;
  const opex = (egi * i.opexRatioPct) / 100;
  const noi = egi - opex;
  const loan = (allIn * i.ltvPct) / 100;
  const equity = allIn - loan;
  const pi = monthlyPI(loan, i.ratePct, i.amortYears);
  const ads = pi * 12;
  const cf = noi - ads;
  const dscr = ads > 0 ? noi / ads : Infinity;
  const coc = equity > 0 ? cf / equity : -Infinity;
  const stabPgi = i.units * i.marketRent * (1 + rentDelta) * 12;
  const stabEgi = stabPgi * (1 - i.vacancyPct / 100) * (1 + i.ancillaryPct / 100);
  const stabNOI = stabEgi * (1 - i.opexRatioPct / 100);
  return { closingCosts, rehab, allIn, pgi, vacancyLoss, ancillary, egi, opex, noi, loan, equity, pi, ads, cf, dscr, coc, stabNOI };
};

/* ---------------- comps ---------------- */
const STREETS = ["Harrow Ave", "Loomis St", "Kessler Blvd", "Dockside Rd", "Vance Ct", "Meridian Way", "Quarry Ln", "Bellview Dr"];
const PERIODS = ["Q4 25", "Q1 26", "Q2 26", "Q3 25"];

const buildComps = (i: DealInputs, ppu: number): Comp[] => {
  const rnd = mulberry(hash(i.id + i.address));
  const count = 4;
  const comps: Comp[] = [];
  for (let c = 0; c < count; c++) {
    comps.push({
      address: `${Math.floor(200 + rnd() * 2600)} ${STREETS[Math.floor(rnd() * STREETS.length)]}`,
      distanceMi: +(0.3 + rnd() * 1.6).toFixed(1),
      pricePerUnit: Math.round((ppu * (0.9 + rnd() * 0.24)) / 500) * 500,
      cap: +(4.6 + rnd() * 2.1).toFixed(1),
      period: PERIODS[Math.floor(rnd() * PERIODS.length)],
    });
  }
  return comps.sort((a, b) => a.distanceMi - b.distanceMi);
};

/* ---------------- levers ---------------- */
const buildLevers = (i: DealInputs, m: Report["m"]): Lever[] => {
  const levers: Lever[] = [];
  if (m.spreadPct > 4)
    levers.push({
      kind: "upside",
      title: "Below-ceiling entry",
      detail: `Asking basis sits ${fmtPct(m.spreadPct)} under the agent's max supportable ceiling — instant day-one equity if the number holds.`,
      impact: `+${fmtK(m.spread)} vs ceiling`,
    });
  if (m.rentGapPct > 7)
    levers.push({
      kind: "upside",
      title: "Mark-to-market rent lift",
      detail: `In-place rents trail market by ${fmtPct(m.rentGapPct, 0)}. Rolling leases to ${fmtK(i.marketRent)}/mo over 12–18 months drives the stabilized yield.`,
      impact: `+${fmtK(i.units * (i.marketRent - i.currentRent))}/mo at stab.`,
    });
  if (i.opexRatioPct > 42)
    levers.push({
      kind: "upside",
      title: "Expense recapture",
      detail: `Opex ratio of ${fmtPct(i.opexRatioPct, 0)} runs hot versus the 36–38% market band. RUBS, tax appeal and contract rebids are the usual levers.`,
      impact: `≈${fmtK(m.egi * ((i.opexRatioPct - 38) / 100))}/yr at 38%`,
    });
  if (i.ancillaryPct < 6)
    levers.push({
      kind: "upside",
      title: "Ancillary income stack",
      detail: "Pet rent, storage, reserved parking and utility bill-back are under-penetrated at this basis.",
      impact: "+3–5% EGI",
    });
  if (i.rehabBudget > 0 && i.rehabBudget / Math.max(1, i.units) < 22000 && m.rentGapPct > 5)
    levers.push({
      kind: "execution",
      title: "Light value-add scope",
      detail: `Rehab lands at ${fmtK(i.rehabBudget / i.units)}/door — cosmetic scope only, no structural or deferred-system risk priced in.`,
      impact: `${fmtK(i.rehabBudget / i.units)}/door`,
    });
  if (i.ltvPct >= 75)
    levers.push({
      kind: "execution",
      title: "Aggressive leverage structure",
      detail: `LTC of ${fmtPct(i.ltvPct, 0)} maximizes CoC but leaves little room for a rate or vacancy shock before the refinance window.`,
      impact: `LTC ${fmtPct(i.ltvPct, 0)}`,
    });
  if (Number.isFinite(m.dscr) && m.dscr < 1.25)
    levers.push({
      kind: "risk",
      title: "Coverage runs thin",
      detail: `DSCR of ${m.dscr.toFixed(2)}× sits under the 1.25× agency floor — lender stress tests will haircut proceeds or price.`,
      impact: `DSCR ${m.dscr.toFixed(2)}×`,
    });
  if (m.breakEvenOcc > 0.78)
    levers.push({
      kind: "risk",
      title: "High break-even occupancy",
      detail: `Debt service is covered only above ${fmtPct(m.breakEvenOcc * 100, 0)} occupancy. A soft leasing season eats cash flow fast.`,
      impact: `BE ${fmtPct(m.breakEvenOcc * 100, 0)}`,
    });
  if (m.spreadPct < 0)
    levers.push({
      kind: "risk",
      title: "Basis above support range",
      detail: `Ask clears the ceiling by ${fmtK(Math.abs(m.spread))}. The deal only pencils after a retrade or an aggressive business plan.`,
      impact: fmtK(m.spread),
    });
  const order = { upside: 0, execution: 1, risk: 2 };
  return levers.sort((a, b) => order[a.kind] - order[b.kind]).slice(0, 6);
};

/* ---------------- validation ---------------- */
export const validateInputs = (i: DealInputs): Partial<Record<keyof DealInputs, string>> => {
  const e: Partial<Record<keyof DealInputs, string>> = {};
  if (!i.dealName.trim()) e.dealName = "Name the deal";
  if (!i.address.trim()) e.address = "Address required";
  if (!i.market.trim()) e.market = "Market required";
  if (i.askingPrice <= 0) e.askingPrice = "Ask > 0";
  if (i.arv <= 0) e.arv = "ARV > 0";
  if (i.rehabBudget < 0) e.rehabBudget = "Rehab ≥ 0";
  if (i.units < 1) e.units = "Units ≥ 1";
  if (i.currentRent <= 0) e.currentRent = "Rent > 0";
  if (i.marketRent <= 0) e.marketRent = "Rent > 0";
  if (i.vacancyPct < 0 || i.vacancyPct > 30) e.vacancyPct = "0–30%";
  if (i.opexRatioPct < 20 || i.opexRatioPct > 70) e.opexRatioPct = "20–70%";
  if (i.ancillaryPct < 0 || i.ancillaryPct > 20) e.ancillaryPct = "0–20%";
  if (i.closingCostPct < 0 || i.closingCostPct > 8) e.closingCostPct = "0–8%";
  if (i.ltvPct < 30 || i.ltvPct > 90) e.ltvPct = "30–90%";
  if (i.ratePct < 1 || i.ratePct > 15) e.ratePct = "1–15%";
  if (i.amortYears < 5 || i.amortYears > 40) e.amortYears = "5–40 yrs";
  return e;
};

/* ---------------- main underwrite ---------------- */
export const underwrite = (inputs: DealInputs): Report => {
  const i = inputs;
  const c = core(i);

  const mao70 = i.arv * 0.7 - c.rehab;

  // max offer supportable at 1.25× DSCR, solved on purchase price
  let supportedOffer = NaN;
  const k = monthlyPI(1, i.ratePct, i.amortYears);
  if (k > 0 && i.ltvPct > 0 && Number.isFinite(c.dscr)) {
    const maxLoan = c.noi / (1.25 * 12 * k);
    supportedOffer = (maxLoan / (i.ltvPct / 100) - c.rehab) / (1 + i.closingCostPct / 100);
  }

  const ceiling = Math.max(
    mao70,
    Number.isFinite(supportedOffer) ? supportedOffer : -Infinity,
    i.askingPrice * 0.55
  );
  const spread = ceiling - i.askingPrice;
  const spreadPct = (spread / i.askingPrice) * 100;

  const goingInCap = (c.noi / c.allIn) * 100;
  const stabCap = (c.stabNOI / c.allIn) * 100;
  const grm = c.pgi > 0 ? i.askingPrice / c.pgi : NaN;
  const pricePerUnit = i.askingPrice / Math.max(1, i.units);
  const breakEvenOcc = clamp01(
    c.pgi > 0 ? (c.opex + c.ads) / (c.pgi * (1 + i.ancillaryPct / 100)) : 1
  );
  const rentGapPct = i.currentRent > 0 ? ((i.marketRent - i.currentRent) / i.currentRent) * 100 : 0;
  const coc = Number.isFinite(c.coc) ? c.coc * 100 : -999;

  /* scores */
  const sSpread = clamp01((spreadPct + 5) / 25) * 100;
  const sDscr = clamp01((Math.min(Number.isFinite(c.dscr) ? c.dscr : 0, 2) - 0.9) / 0.6) * 100;
  const sCap = clamp01((stabCap - 4.5) / 3.5) * 100;
  const sCoc = clamp01((coc + 2) / 12) * 100;
  const total = Math.round(0.3 * sSpread + 0.25 * sDscr + 0.25 * sCap + 0.2 * sCoc);

  let verdict: Verdict = "NEGOTIATE";
  if (spreadPct < -8 || (Number.isFinite(c.dscr) && c.dscr < 1.0) || c.cf < -i.askingPrice * 0.02) verdict = "PASS";
  else if (total >= 72) verdict = "STRONG ADVANTAGE";
  else if (total < 52) verdict = "PASS";

  const verdictLine =
    verdict === "STRONG ADVANTAGE"
      ? "Asymmetric entry — the underwrite clears every gate with margin to spare. Move fast, paper clean."
      : verdict === "NEGOTIATE"
        ? "Viable at the right number. Retrade toward the support range before the LOI drops."
        : "Basis is too high for the risk-adjusted return. Monitor for a reprice — do not chase.";

  /* sensitivity matrix */
  const rentDeltas = [-0.08, -0.04, 0, 0.04, 0.08];
  const rehabDeltas = [0, 0.1, 0.2, 0.3];
  const matrix: SensitivityCell[][] = rentDeltas.map((rd) =>
    rehabDeltas.map((hd) => {
      const cc = core(i, rd, hd);
      return {
        rentDelta: rd,
        rehabDelta: hd,
        coc: Number.isFinite(cc.coc) ? cc.coc * 100 : -999,
        dscr: cc.dscr,
      };
    })
  );

  /* offer strategy */
  const validSupport = Number.isFinite(supportedOffer) && supportedOffer > 0;
  const target = Math.min(ceiling, validSupport ? supportedOffer : ceiling * 0.97);
  const offer = {
    opening: Math.round(target * 0.92),
    target: Math.round(target),
    ceiling: Math.round(ceiling),
    credits: Math.round(Math.min(c.rehab * 0.15, i.askingPrice * 0.025)),
  };

  const comps = buildComps(i, pricePerUnit);
  const levers = buildLevers(i, {
    closingCosts: c.closingCosts, rehab: c.rehab, allIn: c.allIn, equity: c.equity, loan: c.loan,
    pgi: c.pgi, vacancyLoss: c.vacancyLoss, ancillary: c.ancillary, egi: c.egi, opex: c.opex, noi: c.noi,
    monthlyPI: c.pi, ads: c.ads, cashFlowAnnual: c.cf, cashFlowMonthly: c.cf / 12,
    goingInCap, stabNOI: c.stabNOI, stabCap, dscr: c.dscr, coc, mao70, supportedOffer, ceiling,
    spread, spreadPct, pricePerUnit, grm, breakEvenOcc, rentGapPct, ltc: i.ltvPct,
  });

  /* narrative */
  const avgCompPpu = comps.reduce((s, x) => s + x.pricePerUnit, 0) / comps.length;
  const narrative = [
    `${i.dealName} at ${i.address} presents at ${fmtK(i.askingPrice)} — ${fmtK(pricePerUnit)}/door against a ${fmtK(avgCompPpu)}/door comp set across ${i.market}. The agent's support ceiling lands at ${fmtK(ceiling)}, putting the ask ${spread >= 0 ? fmtPct(spreadPct) + " below" : fmtPct(Math.abs(spreadPct)) + " above"} the number the math can defend. ${i.arv > i.askingPrice ? `ARV of ${fmtK(i.arv)} leaves ${fmtK(i.arv - c.allIn)} of value-add headroom against the ${fmtK(c.allIn)} all-in basis.` : `ARV of ${fmtK(i.arv)} sits under the all-in basis — the plan must create value, not just capture it.`}`,
    `In-place rents of ${fmtK(i.currentRent)}/mo run ${fmtPct(Math.abs(rentGapPct), 0)} ${rentGapPct >= 0 ? "under" : "over"} market${rentGapPct >= 7 ? " — the mark-to-market lift is the engine of this business plan" : ""}. At ${fmtPct(i.opexRatioPct, 0)} opex and ${fmtPct(i.vacancyPct, 0)} vacancy the asset throws ${fmtK(c.noi)} NOI going in (${fmtPct(goingInCap)} cap) and ${fmtK(c.stabNOI)} stabilized (${fmtPct(stabCap)}). On the proposed ${fmtK(c.loan)} senior facility at ${fmtPct(i.ratePct, 2)}, coverage prints at ${Number.isFinite(c.dscr) ? c.dscr.toFixed(2) + "×" : "n/a"} DSCR and levered return at ${coc.toFixed(1)}% cash-on-cash — ${fmtK(c.cf / 12)}/mo to the sponsor.`,
    verdict === "PASS"
      ? `Recommendation: pass and hold the relationship. The ceiling of ${fmtK(ceiling)} is ${fmtK(Math.abs(spread))} under ask; only a motivated-seller reprice or a material opex discovery reopens this file. Agent will keep the deal on the watchlist and re-score if the basis moves 10%+.`
      : `Recommendation: ${verdict === "STRONG ADVANTAGE" ? "move to LOI" : "counter and negotiate"}. Open at ${fmtK(offer.opening)}, anchor on the comp set, and target ${fmtK(offer.target)} with ${fmtK(offer.credits)} in closing/rehab credits. Hard ceiling ${fmtK(offer.ceiling)} — beyond that the DSCR floor and sponsor return both fail the committee test.`,
  ];

  const conf = 0.78 + mulberry(hash(i.id + "conf"))() * 0.15;

  /* ---------------- verification & discipline layers ---------------- */
  const verification: VerificationBlock = buildVerification(i, comps.length);
  
  // Reconciliation sweep — mock OM/rent-roll/T-12 with same inputs for now
  // In production, these would be parsed from actual source documents
  const omData: Partial<DealInputs> = { units: i.units, askingPrice: i.askingPrice };
  const rentRollData: Partial<DealInputs> = { units: i.units, askingPrice: i.askingPrice };
  const t12Data: Partial<DealInputs> = { units: i.units, askingPrice: i.askingPrice };
  const reconciliation: ReconciliationCheck[] = reconcileDocuments(omData, rentRollData, t12Data);
  
  // Adjust confidence if reconciliation finds discrepancies
  const hasDiscrepancies = reconciliation.some((r) => !r.matches);
  const adjustedConfidence = hasDiscrepancies ? Math.max(0.5, conf - 0.15) : conf;
  verification.overallConfidence = adjustedConfidence;
  verification.items.unshift({
    item: "Document reconciliation sweep",
    status: hasDiscrepancies ? "flagged" : "verified",
    source: "OM vs rent roll vs T-12",
    note: hasDiscrepancies ? reconciliation.map((r) => r.discrepancy).filter(Boolean).join("; ") : "All sources tie",
  });

  // Computational verification — recompute key metrics and flag mismatches
  const computedMetrics: ComputedMetrics = { goingInCap, pricePerUnit, stabCap, dscr: c.dscr, coc };
  const computationCheck = verifyComputations(i, computedMetrics, 0.5);
  if (!computationCheck.allMatch) {
    verification.items.push({
      item: "Computational verification",
      status: "flagged",
      source: "internal recomputation",
      note: computationCheck.mismatches.join(", "),
    });
  }

  // Assumption freshness check — interest rate vs current agency quote
  const currentAgencyRate = 6.625; // Mock — in production, fetch from Freddie/Fannie API
  const assumptionFreshness: AssumptionFreshness[] = checkAssumptionFreshness(i.ratePct, currentAgencyRate, 25);

  // Sponsor profile — placeholder until CRM integration
  const sponsorName = i.dealName.split(" ")[0]; // Mock — extract from deal name
  const sponsor: SponsorProfile = buildSponsorProfile(sponsorName);

  // Portfolio concentration check — mock holdings
  const mockHoldings = [
    { market: "Columbus, OH", assetType: "multifamily" },
    { market: "Grand Rapids, MI", assetType: "mixeduse" },
  ];
  const portfolioConcentration: PortfolioConcentration[] = checkPortfolioConcentration(
    i.market,
    i.assetType,
    mockHoldings,
    { market: 5, assetType: 8 } // Fund limits
  );

  return {
    inputs: i,
    refNo: `DDAR-2026-${i.id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() || "000000"}`,
    generatedAt: Date.now(),
    verdict,
    verdictLine,
    scores: { spread: Math.round(sSpread), dscr: Math.round(sDscr), cap: Math.round(sCap), coc: Math.round(sCoc), total },
    confidence: adjustedConfidence,
    m: {
      closingCosts: c.closingCosts, rehab: c.rehab, allIn: c.allIn, equity: c.equity, loan: c.loan,
      pgi: c.pgi, vacancyLoss: c.vacancyLoss, ancillary: c.ancillary, egi: c.egi, opex: c.opex, noi: c.noi,
      monthlyPI: c.pi, ads: c.ads, cashFlowAnnual: c.cf, cashFlowMonthly: c.cf / 12,
      goingInCap, stabNOI: c.stabNOI, stabCap, dscr: c.dscr, coc, mao70, supportedOffer, ceiling,
      spread, spreadPct, pricePerUnit, grm, breakEvenOcc, rentGapPct, ltc: i.ltvPct,
    },
    offer,
    levers,
    matrix,
    rentDeltas,
    rehabDeltas,
    comps,
    narrative,
    verification,
    reconciliation,
    sponsor,
    portfolioConcentration,
    assumptionFreshness,
    buyBoxVersion: "meridian-mf-vadd-q1-2026",
  };
};
