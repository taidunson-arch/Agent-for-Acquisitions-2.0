import type { DealInputs, PipelineDeal } from "../lib/types";

const DAY = 86_400_000;
const now = Date.now();

const mapleRow: DealInputs = {
  id: "maple-row",
  dealName: "Maple Row Apartments",
  address: "1140 Maple Row Dr",
  market: "Columbus, OH",
  assetType: "multifamily",
  askingPrice: 1_050_000,
  arv: 1_640_000,
  rehabBudget: 212_000,
  units: 14,
  currentRent: 940,
  marketRent: 1175,
  vacancyPct: 6,
  opexRatioPct: 39,
  ancillaryPct: 4,
  closingCostPct: 2.5,
  ltvPct: 75,
  ratePct: 6.35,
  amortYears: 30,
};

const foundryLofts: DealInputs = {
  id: "foundry-lofts",
  dealName: "Foundry District Lofts",
  address: "88 Foundry St",
  market: "Grand Rapids, MI",
  assetType: "mixeduse",
  askingPrice: 729_000,
  arv: 935_000,
  rehabBudget: 96_000,
  units: 7,
  currentRent: 1290,
  marketRent: 1525,
  vacancyPct: 5,
  opexRatioPct: 36,
  ancillaryPct: 6,
  closingCostPct: 2.2,
  ltvPct: 70,
  ratePct: 6.1,
  amortYears: 30,
};

const cedarBend: DealInputs = {
  id: "cedar-bend",
  dealName: "Cedar Bend SFR Portfolio",
  address: "2205–2241 Cedar Bend Ct",
  market: "Tulsa, OK",
  assetType: "sfr",
  askingPrice: 1_180_000,
  arv: 1_315_000,
  rehabBudget: 88_000,
  units: 8,
  currentRent: 1195,
  marketRent: 1310,
  vacancyPct: 5,
  opexRatioPct: 34,
  ancillaryPct: 2,
  closingCostPct: 2,
  ltvPct: 72,
  ratePct: 6.5,
  amortYears: 30,
};

const route9: DealInputs = {
  id: "route-9",
  dealName: "Route 9 Wellness Plaza",
  address: "4501 Route 9",
  market: "Syracuse, NY",
  assetType: "smallcom",
  askingPrice: 899_000,
  arv: 1_010_000,
  rehabBudget: 145_000,
  units: 5,
  currentRent: 1450,
  marketRent: 1560,
  vacancyPct: 8,
  opexRatioPct: 41,
  ancillaryPct: 3,
  closingCostPct: 2.5,
  ltvPct: 65,
  ratePct: 6.75,
  amortYears: 25,
};

export const SAMPLE_DEALS: PipelineDeal[] = [
  { id: "foundry-lofts", status: "underwritten", updatedAt: now - 2 * DAY, inputs: foundryLofts },
  { id: "maple-row", status: "negotiation", updatedAt: now - 5 * DAY, inputs: mapleRow },
  { id: "cedar-bend", status: "underwritten", updatedAt: now - 9 * DAY, inputs: cedarBend },
  { id: "route-9", status: "passed", updatedAt: now - 14 * DAY, inputs: route9 },
];

export const blankInputs = (): DealInputs => ({
  id: `deal-${Date.now().toString(36)}`,
  dealName: "",
  address: "",
  market: "",
  assetType: "multifamily",
  askingPrice: 0,
  arv: 0,
  rehabBudget: 0,
  units: 8,
  currentRent: 0,
  marketRent: 0,
  vacancyPct: 5,
  opexRatioPct: 38,
  ancillaryPct: 4,
  closingCostPct: 2.5,
  ltvPct: 75,
  ratePct: 6.4,
  amortYears: 30,
});

export const ASSET_LABELS: Record<string, string> = {
  multifamily: "Multifamily",
  sfr: "SFR Portfolio",
  mixeduse: "Mixed-Use",
  smallcom: "Small Commercial",
};

export const TICKER_ITEMS = [
  "FHA 221(d)(4) — 5.38% / 40Y AMORT",
  "COLUMBUS MBF ASK $118K/DOOR ▼2.1% QoQ",
  "CAP SPREAD +192BP OVER 10Y TREASURY",
  "DANA FEED SYNC 15:19:03Z ✓",
  "REHAB COST INDEX 61.4 ▲0.6",
  "AGENCY DSCR FLOOR 1.25×",
  "PIPELINE: 4 ACTIVE FILES",
  "VACANCY COMPOSITE 5.2% — STABLE",
  "SPONSOR HURDLE 15% IRR / 1.8× EQ MULT",
];
