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
  // ---- v4 optional extensions (affordable-housing capital stack + sourced evidence) ----
  availableEquity?: number; // enables the equity hard stop
  opexAnnual?: number; // dollar T-12 opex; overrides opexRatioPct
  softSources?: number; // HOME, HTF, CDBG, local soft debt
  deferredDevFee?: number;
  marketCapRate?: number; // whole percent
  amiRentLimit?: number; // per unit / month
  lihtc?: { type: 4 | 9; eligibleBasis: number; applicableFraction: number; basisBoost?: boolean; creditPrice: number; creditRate?: number };
  confirmedOverrides?: string[];
  comps?: Comp[]; // must carry a source; unsourced comps are ignored
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
  source?: string; // URL or document reference (required for use)
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
  goingInCap: number; // NOI / askingPrice (buy-box definition)
  yieldOnAllIn: number; // NOI / all-in (what v2 labeled goingInCap)
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

export interface VerificationItem {
  item: string;
  status: "verified" | "flagged" | "not_performed";
  source: string;
  note?: string;
}

export interface VerificationBlock {
  primarySources: { name: string; type: string; receivedAt: string }[];
  externalChecks: { source: string; url?: string; checkedAt: string; result: string }[];
  items: VerificationItem[];
  confidenceZones: { zone: "high" | "medium" | "low"; fields: string[]; reason: string }[];
  overallConfidence: number | null; // null = not computed (v4 never invents a confidence)
}

export interface ReconciliationCheck {
  field: string;
  omValue: number | string;
  rentRollValue: number | string;
  t12Value: number | string;
  matches: boolean;
  discrepancy?: string;
}

export interface SponsorProfile {
  name: string;
  trackRecordYears?: number;
  dealsClosed?: number;
  avgReturnPct?: number;
  reliabilityScore?: number; // 0-100
  notes?: string;
}

export interface PortfolioConcentration {
  market: string;
  assetType: AssetType;
  currentCount: number;
  fundLimit?: number;
  withinLimit: boolean;
  note?: string;
}

export interface AssumptionFreshness {
  assumption: string;
  modeledValue: number;
  currentValue: number;
  variancePct: number;
  stale: boolean;
  source?: string;
}

export interface Report {
  inputs: DealInputs;
  refNo: string;
  generatedAt: number;
  verdict: Verdict;
  verdictLine: string;
  scores: { spread: number; dscr: number; cap: number; coc: number; total: number };
  confidence: number | null;
  m: ReportMetrics;
  hardStops?: { metric: string; rule: string }[];
  anomalies?: { type: string; detail: string }[];
  warnings?: string[];
  engine?: string;
  offer: { opening: number; target: number; ceiling: number; credits: number };
  levers: Lever[];
  matrix: SensitivityCell[][];
  rentDeltas: number[];
  rehabDeltas: number[];
  comps: Comp[];
  narrative: string[];
  verification?: VerificationBlock;
  reconciliation?: ReconciliationCheck[];
  sponsor?: SponsorProfile;
  portfolioConcentration?: PortfolioConcentration[];
  assumptionFreshness?: AssumptionFreshness[];
  buyBoxVersion?: string;
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
