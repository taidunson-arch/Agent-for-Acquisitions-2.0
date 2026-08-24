/**
 * Calibration Fixtures — Regression Test Suite for ACQ Agent
 * Addresses blind spot #10: No calibration or regression test suite.
 * 
 * These fixtures span the full verdict spectrum (PURSUE / CONDITIONAL / PASS)
 * with complete source document references, enabling deterministic testing
 * of prompt changes and model updates.
 */

import type { DealInputs, Verdict } from "./types";

export interface CalibrationFixture {
  id: string;
  name: string;
  description: string;
  inputs: DealInputs;
  expectedVerdict: Verdict;
  expectedScoreRange: [number, number]; // [min, max]
  keyMetrics: {
    goingInCap: number;
    stabilizedCap: number;
    dscr: number;
    cashOnCash: number;
    spreadPct: number;
  };
  trapDescription?: string; // What "trap" does this fixture test?
  sourceDocuments: {
    omUrl: string;
    rentRollUrl: string;
    t12Url: string;
    marketDataUrl: string;
  };
  notes: string;
}

/**
 * Fixture 1: Strong PURSUE deal — clean underwrite, all gates pass
 * Tests that the agent correctly identifies asymmetric entry opportunities.
 */
export const FIXTURE_PURSUE_ASHFORD_PARK: CalibrationFixture = {
  id: "fixture-01-pursue",
  name: "Ashford Park — Pflugerville, TX",
  description: "Value-add multifamily with strong rent gap and favorable basis",
  inputs: {
    id: "ashford-park",
    dealName: "Ashford Park Apartments",
    address: "15800 FM 1825, Pflugerville, TX 78660",
    market: "Austin, TX",
    assetType: "multifamily",
    askingPrice: 42_500_000,
    arv: 52_000_000,
    rehabBudget: 8_640_000, // $30k/unit cosmetic
    units: 288,
    currentRent: 1485,
    marketRent: 1795,
    vacancyPct: 5,
    opexRatioPct: 38,
    ancillaryPct: 5,
    closingCostPct: 2.5,
    ltvPct: 72,
    ratePct: 6.375,
    amortYears: 30,
  },
  expectedVerdict: "STRONG ADVANTAGE",
  expectedScoreRange: [75, 92],
  keyMetrics: {
    goingInCap: 5.8,
    stabilizedCap: 7.2,
    dscr: 1.38,
    cashOnCash: 8.5,
    spreadPct: 12.5,
  },
  trapDescription: "Broker OM highlights Samsung Taylor fab demand but buries 9% submarket supply shock in Market section — agent must catch this or fail.",
  sourceDocuments: {
    omUrl: "https://example.com/fixtures/ashford/OM.pdf",
    rentRollUrl: "https://example.com/fixtures/ashford/RentRoll.xlsx",
    t12Url: "https://example.com/fixtures/ashford/T12.pdf",
    marketDataUrl: "https://example.com/fixtures/ashford/MarketData.pdf",
  },
  notes: "Original worked example from ACQ/1.0. Use as primary regression test for value-add multifamily screen.",
};

/**
 * Fixture 2: NEGOTIATE deal — viable but requires retrade
 * Tests that the agent correctly identifies deals needing price adjustment.
 */
export const FIXTURE_NEGOTIATE_MAPLE_ROW: CalibrationFixture = {
  id: "fixture-02-negotiate",
  name: "Maple Row — Columbus, OH",
  description: "Smaller value-add deal with modest rent gap — needs retrade to clear hurdles",
  inputs: {
    id: "maple-row",
    dealName: "Maple Row Apartments",
    address: "1140 Maple Row Dr, Columbus, OH 43215",
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
  },
  expectedVerdict: "NEGOTIATE",
  expectedScoreRange: [52, 71],
  keyMetrics: {
    goingInCap: 6.2,
    stabilizedCap: 7.8,
    dscr: 1.22,
    cashOnCash: 5.8,
    spreadPct: -3.2,
  },
  trapDescription: "DSCR falls slightly below 1.25× agency floor — agent should flag financing risk and recommend retrade.",
  sourceDocuments: {
    omUrl: "https://example.com/fixtures/maple/OM.pdf",
    rentRollUrl: "https://example.com/fixtures/maple/RentRoll.xlsx",
    t12Url: "https://example.com/fixtures/maple/T12.pdf",
    marketDataUrl: "https://example.com/fixtures/maple/MarketData.pdf",
  },
  notes: "Tests boundary condition where deal is viable but not at ask — should trigger NEGOTIATE verdict.",
};

/**
 * Fixture 3: PASS deal — basis too high, no path to returns
 * Tests that the agent correctly rejects overpriced assets.
 */
export const FIXTURE_PASS_RIVERSONG: CalibrationFixture = {
  id: "fixture-03-pass",
  name: "Riversong — Tampa, FL",
  description: "Overpriced core-plus asset in hurricane zone — no retrade can fix",
  inputs: {
    id: "riversong",
    dealName: "Riversong Towers",
    address: "4200 W Cypress St, Tampa, FL 33607",
    market: "Tampa, FL",
    assetType: "multifamily",
    askingPrice: 68_000_000,
    arv: 65_000_000, // ARV below ask — immediate red flag
    rehabBudget: 2_500_000,
    units: 320,
    currentRent: 1890,
    marketRent: 1950, // Minimal rent gap
    vacancyPct: 4,
    opexRatioPct: 42, // High opex
    ancillaryPct: 3,
    closingCostPct: 2.5,
    ltvPct: 65,
    ratePct: 6.625,
    amortYears: 30,
  },
  expectedVerdict: "PASS",
  expectedScoreRange: [15, 45],
  keyMetrics: {
    goingInCap: 4.2,
    stabilizedCap: 4.8,
    dscr: 1.08,
    cashOnCash: 2.1,
    spreadPct: -22.5,
  },
  trapDescription: "ARV below asking price + minimal rent gap + high opex + hurricane exposure — multiple deal-breakers.",
  sourceDocuments: {
    omUrl: "https://example.com/fixtures/riversong/OM.pdf",
    rentRollUrl: "https://example.com/fixtures/riversong/RentRoll.xlsx",
    t12Url: "https://example.com/fixtures/riversong/T12.pdf",
    marketDataUrl: "https://example.com/fixtures/riversong/MarketData.pdf",
  },
  notes: "Tests multi-factor failure mode — should clearly articulate why no retrade works.",
};

/**
 * Fixture 4: PASS deal — environmental/flood deal-breaker
 * Tests that the agent correctly identifies climate/environmental risks.
 */
export const FIXTURE_PASS_BAYOU_VISTA: CalibrationFixture = {
  id: "fixture-04-pass-environmental",
  name: "Bayou Vista — Houston, TX",
  description: "Appears viable on returns but 18% of units in FEMA AE zone",
  inputs: {
    id: "bayou-vista",
    dealName: "Bayou Vista Gardens",
    address: "8900 Bayou Blvd, Houston, TX 77034",
    market: "Houston, TX",
    assetType: "multifamily",
    askingPrice: 28_500_000,
    arv: 35_000_000,
    rehabBudget: 4_320_000,
    units: 240,
    currentRent: 1285,
    marketRent: 1520,
    vacancyPct: 7,
    opexRatioPct: 40,
    ancillaryPct: 4,
    closingCostPct: 2.5,
    ltvPct: 70,
    ratePct: 6.5,
    amortYears: 30,
  },
  expectedVerdict: "PASS",
  expectedScoreRange: [20, 48],
  keyMetrics: {
    goingInCap: 5.5,
    stabilizedCap: 6.8,
    dscr: 1.28,
    cashOnCash: 7.2,
    spreadPct: 8.5,
  },
  trapDescription: "Returns clear hurdles but 18% of units in FEMA AE flood zone with $62k/yr insurance — environmental deal-breaker per buy box.",
  sourceDocuments: {
    omUrl: "https://example.com/fixtures/bayou/OM.pdf",
    rentRollUrl: "https://example.com/fixtures/bayou/RentRoll.xlsx",
    t12Url: "https://example.com/fixtures/bayou/T12.pdf",
    marketDataUrl: "https://example.com/fixtures/bayou/FEMA_Map.pdf",
  },
  notes: "Tests climate/flood screening — returns may pencil but environmental risk should trigger PASS.",
};

/**
 * Fixture 5: CONDITIONAL PURSUE — sponsor/execution risk
 * Tests that the agent correctly flags counterparty risk even when numbers work.
 */
export const FIXTURE_CONDITIONAL_CEDAR_POINTE: CalibrationFixture = {
  id: "fixture-05-conditional",
  name: "Cedar Pointe — Indianapolis, IN",
  description: "Strong numbers but first-time sponsor with limited track record",
  inputs: {
    id: "cedar-pointe",
    dealName: "Cedar Pointe Commons",
    address: "5600 Cedar Lake Rd, Indianapolis, IN 46214",
    market: "Indianapolis, IN",
    assetType: "multifamily",
    askingPrice: 18_200_000,
    arv: 23_500_000,
    rehabBudget: 5_400_000,
    units: 180,
    currentRent: 1120,
    marketRent: 1385,
    vacancyPct: 6,
    opexRatioPct: 37,
    ancillaryPct: 5,
    closingCostPct: 2.5,
    ltvPct: 75,
    ratePct: 6.375,
    amortYears: 30,
  },
  expectedVerdict: "STRONG ADVANTAGE", // Numbers are strong
  expectedScoreRange: [72, 88],
  keyMetrics: {
    goingInCap: 6.1,
    stabilizedCap: 7.5,
    dscr: 1.35,
    cashOnCash: 8.2,
    spreadPct: 10.8,
  },
  trapDescription: "Underwriting is strong but sponsor has only 2 prior deals — agent should flag execution risk and recommend JV partner or enhanced oversight.",
  sourceDocuments: {
    omUrl: "https://example.com/fixtures/cedar/OM.pdf",
    rentRollUrl: "https://example.com/fixtures/cedar/RentRoll.xlsx",
    t12Url: "https://example.com/fixtures/cedar/T12.pdf",
    marketDataUrl: "https://example.com/fixtures/cedar/MarketData.pdf",
  },
  notes: "Tests sponsor diligence dimension — numbers warrant PURSUE but team risk requires conditions.",
};

/**
 * Fixture 6: PASS deal — portfolio concentration breach
 * Tests portfolio-awareness: fund already at limit in this market.
 */
export const FIXTURE_PASS_SUNSET_GARDENS: CalibrationFixture = {
  id: "fixture-06-pass-concentration",
  name: "Sunset Gardens — Phoenix, AZ",
  description: "Solid deal but fund already has 5 Phoenix assets (at limit)",
  inputs: {
    id: "sunset-gardens",
    dealName: "Sunset Gardens",
    address: "3300 W Thunderbird Rd, Phoenix, AZ 85053",
    market: "Phoenix, AZ",
    assetType: "multifamily",
    askingPrice: 32_000_000,
    arv: 38_000_000,
    rehabBudget: 4_800_000,
    units: 220,
    currentRent: 1340,
    marketRent: 1580,
    vacancyPct: 5,
    opexRatioPct: 36,
    ancillaryPct: 6,
    closingCostPct: 2.5,
    ltvPct: 72,
    ratePct: 6.375,
    amortYears: 30,
  },
  expectedVerdict: "PASS",
  expectedScoreRange: [45, 65], // Would be good if not for concentration
  keyMetrics: {
    goingInCap: 5.9,
    stabilizedCap: 7.1,
    dscr: 1.32,
    cashOnCash: 7.8,
    spreadPct: 9.2,
  },
  trapDescription: "Deal fundamentals are solid but fund concentration limit is 5 Phoenix deals and portfolio already has 5 — IC will reject on concentration alone.",
  sourceDocuments: {
    omUrl: "https://example.com/fixtures/sunset/OM.pdf",
    rentRollUrl: "https://example.com/fixtures/sunset/RentRoll.xlsx",
    t12Url: "https://example.com/fixtures/sunset/T12.pdf",
    marketDataUrl: "https://example.com/fixtures/sunset/MarketData.pdf",
  },
  notes: "Tests portfolio-awareness blind spot — good deal that must be passed due to fund-level constraints.",
};

/**
 * Full calibration suite for regression testing.
 */
export const CALIBRATION_SUITE: CalibrationFixture[] = [
  FIXTURE_PURSUE_ASHFORD_PARK,
  FIXTURE_NEGOTIATE_MAPLE_ROW,
  FIXTURE_PASS_RIVERSONG,
  FIXTURE_PASS_BAYOU_VISTA,
  FIXTURE_CONDITIONAL_CEDAR_POINTE,
  FIXTURE_PASS_SUNSET_GARDENS,
];

/**
 * Run a single fixture through the underwriter and validate results.
 * Returns pass/fail status with detailed error messages.
 */
export interface TestResult {
  fixtureId: string;
  passed: boolean;
  errors: string[];
  actualVerdict: Verdict;
  actualScore: number;
  expectedVerdict: Verdict;
  expectedScoreRange: [number, number];
}

export const runFixtureTest = async (
  fixture: CalibrationFixture,
  underwriteFn: (inputs: DealInputs) => any
): Promise<TestResult> => {
  const errors: string[] = [];
  
  try {
    const report = await underwriteFn(fixture.inputs);
    const actualVerdict = report.verdict;
    const actualScore = report.scores.total;
    
    // Check verdict match
    if (actualVerdict !== fixture.expectedVerdict) {
      errors.push(`Verdict mismatch: expected ${fixture.expectedVerdict}, got ${actualVerdict}`);
    }
    
    // Check score range
    if (actualScore < fixture.expectedScoreRange[0] || actualScore > fixture.expectedScoreRange[1]) {
      errors.push(`Score out of range: expected ${fixture.expectedScoreRange[0]}-${fixture.expectedScoreRange[1]}, got ${actualScore}`);
    }
    
    // Check key metrics (within 10% tolerance)
    const tolerance = 0.10;
    if (Math.abs(report.m.goingInCap - fixture.keyMetrics.goingInCap) / fixture.keyMetrics.goingInCap > tolerance) {
      errors.push(`Going-in cap variance >${tolerance * 100}%: expected ${fixture.keyMetrics.goingInCap}, got ${report.m.goingInCap.toFixed(2)}`);
    }
    
    if (Math.abs(report.m.dscr - fixture.keyMetrics.dscr) / fixture.keyMetrics.dscr > tolerance) {
      errors.push(`DSCR variance >${tolerance * 100}%: expected ${fixture.keyMetrics.dscr.toFixed(2)}, got ${report.m.dscr.toFixed(2)}`);
    }
    
    return {
      fixtureId: fixture.id,
      passed: errors.length === 0,
      errors,
      actualVerdict,
      actualScore,
      expectedVerdict: fixture.expectedVerdict,
      expectedScoreRange: fixture.expectedScoreRange,
    };
  } catch (err: any) {
    return {
      fixtureId: fixture.id,
      passed: false,
      errors: [`Execution error: ${err.message}`],
      actualVerdict: "PASS" as Verdict,
      actualScore: 0,
      expectedVerdict: fixture.expectedVerdict,
      expectedScoreRange: fixture.expectedScoreRange,
    };
  }
};

/**
 * Run full calibration suite and return summary.
 */
export interface SuiteResults {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
  summary: string;
}

export const runCalibrationSuite = async (
  underwriteFn: (inputs: DealInputs) => any
): Promise<SuiteResults> => {
  const results: TestResult[] = [];
  
  for (const fixture of CALIBRATION_SUITE) {
    const result = await runFixtureTest(fixture, underwriteFn);
    results.push(result);
  }
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  return {
    total: results.length,
    passed,
    failed,
    results,
    summary: `Calibration Suite: ${passed}/${results.length} passed (${((passed / results.length) * 100).toFixed(0)}%)`,
  };
};

export default {
  CALIBRATION_SUITE,
  runFixtureTest,
  runCalibrationSuite,
};
