/**
 * Buy Box Configuration — swappable criteria per fund/strategy.
 * Addresses blind spot #4: Hardcoded buy box.
 * 
 * Instead of prose baked into the skill prompt, this JSON schema
 * defines the investment criteria that the agent screens against.
 * Multiple funds can maintain separate configs without code changes.
 */

export interface BuyBoxConfig {
  id: string;
  name: string;
  version: string;
  effectiveDate: string;
  
  // Geographic constraints
  targetMarkets: string[];
  excludedMarkets?: string[];
  maxDistanceFromTargetMiles?: number;
  
  // Asset class constraints
  allowedAssetTypes: ("multifamily" | "sfr" | "mixeduse" | "smallcom" | "office" | "industrial" | "retail" | "btr")[];
  unitRange?: { min: number; max: number };
  vintageRange?: { min: number; max: number };
  buildingClass?: ("A" | "B" | "C" | "D")[];
  
  // Deal size constraints
  priceRange: { min: number; max: number };
  equityRange?: { min: number; max: number };
  
  // Return hurdles
  minGoingInCap: number;
  minStabilizedCap: number;
  minLeveredIrr: number;
  minMoic: number;
  minCashOnCash: number;
  minDscr: number;
  maxDscr?: number;
  
  // Leverage constraints
  maxLtv: number;
  maxLtc: number;
  
  // Physical constraints
  maxOccupancyDeficit?: number; // % below stabilized
  maxDeferredMaintenance?: number; // $/unit
  excludedFloodZones?: string[]; // e.g., ["AE", "VE"]
  
  // Strategy filters
  strategyTypes: ("core" | "core-plus" | "value-add" | "opportunistic" | "ground-up")[];
  holdPeriodYears: number;
  
  // Portfolio concentration limits
  concentrationLimits: {
    perMarket?: number;
    perAssetType?: number;
    perSponsor?: number;
    totalFundDeployed?: number;
  };
  
  // Risk exclusions (deal-breakers)
  dealBreakers: {
    rentControlled: boolean;
    activeLitigation: boolean;
    environmentalContamination: boolean;
    structuralDeficiencies: boolean;
    titleIssues: boolean;
  };
}

/**
 * Meridian Residential Partners — Value-Add Multifamily Fund
 * This is the original buy box from the ACQ/1.0 skill prompt,
 * now expressed as structured configuration.
 */
export const MERIDIAN_MF_VADD_Q1_2026: BuyBoxConfig = {
  id: "meridian-mf-vadd",
  name: "Meridian Residential Partners — Value-Add Multifamily",
  version: "q1-2026",
  effectiveDate: "2026-01-01",
  
  targetMarkets: [
    "Austin, TX",
    "Dallas, TX",
    "Houston, TX",
    "San Antonio, TX",
    "Phoenix, AZ",
    "Tampa, FL",
    "Orlando, FL",
    "Jacksonville, FL",
    "Atlanta, GA",
    "Charlotte, NC",
    "Raleigh, NC",
    "Nashville, TN",
    "Memphis, TN",
    "Birmingham, AL",
    "Columbus, OH",
    "Indianapolis, IN",
    "Grand Rapids, MI",
  ],
  
  allowedAssetTypes: ["multifamily"],
  unitRange: { min: 150, max: 400 },
  vintageRange: { min: 1995, max: 2018 },
  buildingClass: ["B", "C"],
  
  priceRange: { min: 5_000_000, max: 50_000_000 },
  equityRange: { min: 2_000_000, max: 15_000_000 },
  
  minGoingInCap: 5.0,
  minStabilizedCap: 6.5,
  minLeveredIrr: 15.0,
  minMoic: 1.8,
  minCashOnCash: 6.0,
  minDscr: 1.25,
  
  maxLtv: 75,
  maxLtc: 80,
  
  maxOccupancyDeficit: 10, // 90%+ occupancy required
  maxDeferredMaintenance: 25000, // $/unit
  
  excludedFloodZones: ["AE", "VE"],
  
  strategyTypes: ["value-add"],
  holdPeriodYears: 5,
  
  concentrationLimits: {
    perMarket: 5,
    perAssetType: 8,
    perSponsor: 3,
  },
  
  dealBreakers: {
    rentControlled: true,
    activeLitigation: true,
    environmentalContamination: true,
    structuralDeficiencies: true,
    titleIssues: true,
  },
};

/**
 * Core-Plus Institutional Fund — more conservative profile
 * Example of how a second fund strategy would look.
 */
export const INSTITUTIONAL_CORE_PLUS_Q1_2026: BuyBoxConfig = {
  id: "inst-core-plus",
  name: "Institutional Core-Plus Fund",
  version: "q1-2026",
  effectiveDate: "2026-01-01",
  
  targetMarkets: [
    "Boston, MA",
    "New York, NY",
    "Washington, DC",
    "San Francisco, CA",
    "Los Angeles, CA",
    "Seattle, WA",
    "Denver, CO",
  ],
  
  allowedAssetTypes: ["multifamily", "office", "industrial"],
  unitRange: { min: 200, max: 600 },
  vintageRange: { min: 2005, max: 2025 },
  buildingClass: ["A", "B"],
  
  priceRange: { min: 25_000_000, max: 150_000_000 },
  equityRange: { min: 10_000_000, max: 50_000_000 },
  
  minGoingInCap: 4.0,
  minStabilizedCap: 5.0,
  minLeveredIrr: 12.0,
  minMoic: 1.5,
  minCashOnCash: 5.0,
  minDscr: 1.35,
  
  maxLtv: 65,
  maxLtc: 70,
  
  maxOccupancyDeficit: 5,
  maxDeferredMaintenance: 15000,
  
  excludedFloodZones: ["AE", "VE", "X"],
  
  strategyTypes: ["core", "core-plus"],
  holdPeriodYears: 7,
  
  concentrationLimits: {
    perMarket: 3,
    perAssetType: 6,
    perSponsor: 2,
  },
  
  dealBreakers: {
    rentControlled: false, // May consider with appropriate pricing
    activeLitigation: true,
    environmentalContamination: true,
    structuralDeficiencies: true,
    titleIssues: true,
  },
};

/**
 * Opportunistic Ground-Up BTR Fund
 * Example of a completely different strategy profile.
 */
export const OPPORTUNISTIC_BTR_Q1_2026: BuyBoxConfig = {
  id: "opp-btr",
  name: "Opportunistic Build-to-Rent Fund",
  version: "q1-2026",
  effectiveDate: "2026-01-01",
  
  targetMarkets: [
    "Phoenix, AZ",
    "Las Vegas, NV",
    "Boise, ID",
    "Spokane, WA",
    "Tulsa, OK",
    "Knoxville, TN",
    "Greenville, SC",
  ],
  
  allowedAssetTypes: ["btr", "sfr"],
  unitRange: { min: 50, max: 200 },
  vintageRange: { min: 2024, max: 2028 }, // New construction only
  buildingClass: ["A"],
  
  priceRange: { min: 10_000_000, max: 40_000_000 },
  equityRange: { min: 5_000_000, max: 20_000_000 },
  
  minGoingInCap: 5.5,
  minStabilizedCap: 7.0,
  minLeveredIrr: 18.0,
  minMoic: 2.2,
  minCashOnCash: 4.0, // Lower initial cash flow acceptable for ground-up
  minDscr: 1.20,
  
  maxLtv: 70,
  maxLtc: 85, // Higher LTC for construction
  
  maxOccupancyDeficit: 25, // Stabilization period expected
  maxDeferredMaintenance: 0, // New construction
  
  excludedFloodZones: ["AE", "VE"],
  
  strategyTypes: ["ground-up", "opportunistic"],
  holdPeriodYears: 7,
  
  concentrationLimits: {
    perMarket: 4,
    perAssetType: 10,
    perSponsor: 4,
  },
  
  dealBreakers: {
    rentControlled: true,
    activeLitigation: true,
    environmentalContamination: true,
    structuralDeficiencies: true,
    titleIssues: true,
  },
};

/**
 * Registry of all available buy box configurations.
 * In production, this could be loaded from external JSON/YAML files
 * or fetched from an API for dynamic fund onboarding.
 */
export const BUY_BOX_REGISTRY: Record<string, BuyBoxConfig> = {
  "meridian-mf-vadd-q1-2026": MERIDIAN_MF_VADD_Q1_2026,
  "inst-core-plus-q1-2026": INSTITUTIONAL_CORE_PLUS_Q1_2026,
  "opp-btr-q1-2026": OPPORTUNISTIC_BTR_Q1_2026,
};

/**
 * Get buy box config by ID.
 * Falls back to Meridian MF if not found.
 */
export const getBuyBox = (id?: string): BuyBoxConfig => {
  if (!id) return MERIDIAN_MF_VADD_Q1_2026;
  return BUY_BOX_REGISTRY[id] || MERIDIAN_MF_VADD_Q1_2026;
};

/**
 * Screen a deal against a buy box config.
 * Returns pass/fail status with specific failure reasons.
 */
export interface ScreenResult {
  passes: boolean;
  failures: { field: string; reason: string; actual: any; required: any }[];
  warnings: { field: string; message: string }[];
}

export const screenAgainstBuyBox = (
  inputs: {
    market: string;
    assetType: string;
    units: number;
    askingPrice: number;
    yearBuilt?: number;
    occupancyPct?: number;
    goingInCap?: number;
    stabilizedCap?: number;
    dscr?: number;
    cashOnCash?: number;
  },
  config: BuyBoxConfig
): ScreenResult => {
  const failures: ScreenResult["failures"] = [];
  const warnings: ScreenResult["warnings"] = [];
  
  // Market check
  if (!config.targetMarkets.includes(inputs.market)) {
    failures.push({
      field: "market",
      reason: `Market '${inputs.market}' not in target list`,
      actual: inputs.market,
      required: config.targetMarkets.join(", "),
    });
  }
  
  // Asset type check
  if (!config.allowedAssetTypes.includes(inputs.assetType as any)) {
    failures.push({
      field: "asset_type",
      reason: `Asset type '${inputs.assetType}' not permitted`,
      actual: inputs.assetType,
      required: config.allowedAssetTypes.join(", "),
    });
  }
  
  // Unit range check
  if (config.unitRange) {
    if (inputs.units < config.unitRange.min || inputs.units > config.unitRange.max) {
      failures.push({
        field: "units",
        reason: `Unit count outside allowed range (${config.unitRange.min}-${config.unitRange.max})`,
        actual: inputs.units,
        required: `${config.unitRange.min}-${config.unitRange.max}`,
      });
    }
  }
  
  // Vintage check
  if (config.vintageRange && inputs.yearBuilt) {
    if (inputs.yearBuilt < config.vintageRange.min || inputs.yearBuilt > config.vintageRange.max) {
      failures.push({
        field: "vintage",
        reason: `Year built outside allowed range (${config.vintageRange.min}-${config.vintageRange.max})`,
        actual: inputs.yearBuilt,
        required: `${config.vintageRange.min}-${config.vintageRange.max}`,
      });
    }
  }
  
  // Price range check
  if (inputs.askingPrice < config.priceRange.min || inputs.askingPrice > config.priceRange.max) {
    failures.push({
      field: "price",
      reason: `Asking price outside allowed range ($${config.priceRange.min.toLocaleString()}–$${config.priceRange.max.toLocaleString()})`,
      actual: inputs.askingPrice,
      required: `$${config.priceRange.min.toLocaleString()}–$${config.priceRange.max.toLocaleString()}`,
    });
  }
  
  // Going-in cap check
  if (inputs.goingInCap && inputs.goingInCap < config.minGoingInCap) {
    failures.push({
      field: "going_in_cap",
      reason: `Going-in cap below minimum ${config.minGoingInCap}%`,
      actual: inputs.goingInCap.toFixed(2),
      required: `≥${config.minGoingInCap}%`,
    });
  }
  
  // Stabilized cap check
  if (inputs.stabilizedCap && inputs.stabilizedCap < config.minStabilizedCap) {
    failures.push({
      field: "stabilized_cap",
      reason: `Stabilized yield below minimum ${config.minStabilizedCap}%`,
      actual: inputs.stabilizedCap.toFixed(2),
      required: `≥${config.minStabilizedCap}%`,
    });
  }
  
  // DSCR check
  if (inputs.dscr && inputs.dscr < config.minDscr) {
    failures.push({
      field: "dscr",
      reason: `DSCR below minimum ${config.minDscr}x`,
      actual: inputs.dscr.toFixed(2),
      required: `≥${config.minDscr}x`,
    });
  }
  
  // Cash-on-cash check
  if (inputs.cashOnCash && inputs.cashOnCash < config.minCashOnCash) {
    failures.push({
      field: "cash_on_cash",
      reason: `Cash-on-cash below minimum ${config.minCashOnCash}%`,
      actual: inputs.cashOnCash.toFixed(2),
      required: `≥${config.minCashOnCash}%`,
    });
  }
  
  // Occupancy warning
  if (inputs.occupancyPct && config.maxOccupancyDeficit) {
    const deficit = 100 - inputs.occupancyPct;
    if (deficit > config.maxOccupancyDeficit) {
      warnings.push({
        field: "occupancy",
        message: `Current occupancy deficit (${deficit.toFixed(1)}%) exceeds maximum allowed (${config.maxOccupancyDeficit}%)`,
      });
    }
  }
  
  return {
    passes: failures.length === 0,
    failures,
    warnings,
  };
};
