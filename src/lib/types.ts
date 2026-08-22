export type AssetType = "multifamily" | "sfr" | "mixeduse" | "smallcom";

export interface DealInputs {
  id: string;
  dealName: string;
  address: string;
  market: string;
  assetType: AssetType;
  askingPrice: number;
  arv: number;
  rehabBudget: number;
  units: number;
  currentRent: number; // per unit / month
  marketRent: number; // per unit / month at stabilization
  vacancyPct: number;
  opexRatioPct: number; // % of EGI
  ancillaryPct: number; // % of EGI (pets, storage, parking…)
  closingCostPct: number; // % of ask
  ltvPct: number; // LTC on all-in basis
  ratePct: number;
  amortYears: number;
}

export type Verdict = "STRONG ADVANTAGE" | "NEGOTIATE" | "PASS";

export interface Lever {
  title: string;
  detail: string;
  impact: string;
  kind: "upside" | "execution" | "risk";
}

export interface SensitivityCell {
  rentDelta: number;
  rehabDelta: number;
  coc: number;
  dscr: number;
}

export interface Comp {
  address: string;
  distanceMi: number;
  pricePerUnit: number;
  cap: number;
  period: string;
}

export interface ReportMetrics {
  closingCosts: number;
  rehab: number;
  allIn: number;
  equity: number;
  loan: number;
  pgi: number;
  vacancyLoss: number;
  ancillary: number;
  egi: number;
  opex: number;
  noi: number;
  monthlyPI: number;
  ads: number;
  cashFlowAnnual: number;
  cashFlowMonthly: number;
  goingInCap: number;
  stabNOI: number;
  stabCap: number;
  dscr: number;
  coc: number;
  mao70: number;
  supportedOffer: number;
  ceiling: number;
  spread: number;
  spreadPct: number;
  pricePerUnit: number;
  grm: number;
  breakEvenOcc: number;
  rentGapPct: number;
  ltc: number;
}

export interface Report {
  inputs: DealInputs;
  refNo: string;
  generatedAt: number;
  verdict: Verdict;
  verdictLine: string;
  scores: { spread: number; dscr: number; cap: number; coc: number; total: number };
  confidence: number;
  m: ReportMetrics;
  offer: { opening: number; target: number; ceiling: number; credits: number };
  levers: Lever[];
  matrix: SensitivityCell[][];
  rentDeltas: number[];
  rehabDeltas: number[];
  comps: Comp[];
  narrative: string[];
}

export type DealStatus = "underwritten" | "negotiation" | "passed" | "intake";

export interface PipelineDeal {
  id: string;
  status: DealStatus;
  updatedAt: number;
  inputs: DealInputs;
}

export type LogKind = "dim" | "act" | "val" | "warn" | "ok";

export interface LogLine {
  k: LogKind;
  t: string;
}

export interface AgentStep {
  label: string;
  lines: LogLine[];
}
