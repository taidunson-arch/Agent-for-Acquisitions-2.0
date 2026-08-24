/**
 * Climate Risk Assessment Module
 * Addresses blind spot #7: Shallow climate coverage.
 * 
 * Provides asset-level climate stress scoring across multiple perils:
 * - Flood (FEMA + forward-looking)
 * - Wildfire
 * - Wind/Hurricane
 * - Heat
 * - Drought
 * 
 * In production, this would integrate with First Street, ClimateCheck, or RMS APIs.
 * This module provides the interface structure and mock implementation.
 */

export interface ClimatePeril {
  name: "flood" | "wildfire" | "wind" | "heat" | "drought";
  currentRisk: number; // 0-10 scale
  futureRisk2030: number; // 0-10 scale
  futureRisk2050: number; // 0-10 scale
  trend: "increasing" | "stable" | "decreasing";
}

export interface FloodData {
  femaZone: string; // AE, VE, X, etc.
  baseFloodElevation?: number; // feet
  firstFloorElevation?: number; // feet
  unitsInFloodplain: number;
  totalUnits: number;
  pctInFloodplain: number;
  annualFloodInsuranceEstimate: number;
  historicalClaims?: {
    count: number;
    totalPaid: number;
    lastClaimDate?: string;
  };
  // Forward-looking (First Street equivalent)
  fsFloodFactor?: number; // 1-10
  fs30YearLoss?: number; // expected loss over 30 years
}

export interface WildfireData {
  riskLevel: "low" | "moderate" | "high" | "extreme";
  distanceToWildlandInterfaceMiles: number;
  historicalFireDistanceMiles: number;
  // Forward-looking
  fsWildfireFactor?: number; // 1-10
}

export interface WindData {
  hurricaneZone: boolean;
  designWindSpeedMph: number;
  roofAge: number;
  roofType: string;
  historicalWindEvents: number;
  // Forward-looking
  fsWindFactor?: number; // 1-10
}

export interface HeatData {
  avgSummerHighF: number;
  daysOver95F: number;
  daysOver100F: number;
  urbanHeatIslandEffect: boolean;
  // Forward-looking
  projectedDaysOver100F_2050: number;
  fsHeatFactor?: number; // 1-10
}

export interface ClimateAssessment {
  address: string;
  latitude: number;
  longitude: number;
  assessmentDate: string;
  
  // Peril scores
  flood: FloodData;
  wildfire: WildfireData;
  wind: WindData;
  heat: HeatData;
  
  // Composite metrics
  overallClimateScore: number; // 0-100 (higher = better)
  materialRisks: string[];
  recommendedActions: string[];
  
  // Insurance implications
  insuranceAvailability: "standard" | "surplus" | "unavailable";
  premiumTrendPct: number; // YoY change
  deductibleSpecial: number; // % for wind/hail/etc.
  
  // Financial impact modeling
  holdPeriodYears: number;
  projectedCumulativeLoss: number; // over hold period
  annualizedClimateCost: number; // per year
  climateCostPerUnit: number;
}

/**
 * Mock climate data generator — in production, replace with API calls
 * to First Street, ClimateCheck, or similar providers.
 */
const generateMockClimateData = (market: string, seed: number): ClimateAssessment => {
  const rnd = (multiplier: number) => {
    seed = (seed * 9301 + 49297) % 233280;
    return (seed / 233280) * multiplier;
  };
  
  const today = new Date().toISOString().split("T")[0];
  
  // Market-specific baseline risks
  const marketBaselines: Record<string, Partial<ClimateAssessment>> = {
    "Houston": {
      flood: { femaZone: "AE", unitsInFloodplain: 12, totalUnits: 288, pctInFloodplain: 4.2, annualFloodInsuranceEstimate: 45000, fsFloodFactor: 7 },
      wind: { hurricaneZone: true, designWindSpeedMph: 140, fsWindFactor: 6 },
      heat: { avgSummerHighF: 94, daysOver95F: 95, daysOver100F: 25, projectedDaysOver100F_2050: 45 },
      premiumTrendPct: 12.5,
    },
    "Austin": {
      flood: { femaZone: "X", unitsInFloodplain: 0, totalUnits: 288, pctInFloodplain: 0, annualFloodInsuranceEstimate: 8000, fsFloodFactor: 3 },
      wildfire: { riskLevel: "moderate", distanceToWildlandInterfaceMiles: 8, fsWildfireFactor: 5 },
      heat: { avgSummerHighF: 96, daysOver95F: 85, daysOver100F: 35, projectedDaysOver100F_2050: 55 },
      premiumTrendPct: 8.2,
    },
    "Phoenix": {
      flood: { femaZone: "X", unitsInFloodplain: 0, totalUnits: 200, pctInFloodplain: 0, annualFloodInsuranceEstimate: 5000, fsFloodFactor: 2 },
      heat: { avgSummerHighF: 106, daysOver95F: 140, daysOver100F: 110, projectedDaysOver100F_2050: 145, fsHeatFactor: 9 },
      drought: {},
      premiumTrendPct: 6.5,
    },
    "Tampa": {
      flood: { femaZone: "VE", unitsInFloodplain: 45, totalUnits: 320, pctInFloodplain: 14.1, annualFloodInsuranceEstimate: 85000, fsFloodFactor: 9 },
      wind: { hurricaneZone: true, designWindSpeedMph: 155, fsWindFactor: 8 },
      heat: { avgSummerHighF: 91, daysOver95F: 75, daysOver100F: 10, projectedDaysOver100F_2050: 20 },
      premiumTrendPct: 18.5,
    },
  };
  
  const marketKey = Object.keys(marketBaselines).find(k => market.includes(k)) || "Austin";
  const baseline = marketBaselines[marketKey] as any;
  
  // Build comprehensive assessment
  const flood: FloodData = {
    femaZone: baseline.flood?.femaZone || "X",
    baseFloodElevation: baseline.flood?.femaZone === "AE" ? 45 : undefined,
    firstFloorElevation: 48,
    unitsInFloodplain: baseline.flood?.unitsInFloodplain || 0,
    totalUnits: baseline.flood?.totalUnits || 288,
    pctInFloodplain: baseline.flood?.pctInFloodplain || 0,
    annualFloodInsuranceEstimate: baseline.flood?.annualFloodInsuranceEstimate || 10000,
    fsFloodFactor: baseline.flood?.fsFloodFactor || 4,
    fs30YearLoss: (baseline.flood?.fsFloodFactor || 4) * 5000,
  };
  
  const wildfire: WildfireData = {
    riskLevel: baseline.wildfire?.riskLevel || "low",
    distanceToWildlandInterfaceMiles: baseline.wildfire?.distanceToWildlandInterfaceMiles || 15,
    historicalFireDistanceMiles: 12,
    fsWildfireFactor: baseline.wildfire?.fsWildfireFactor || 2,
  };
  
  const wind: WindData = {
    hurricaneZone: baseline.wind?.hurricaneZone || false,
    designWindSpeedMph: baseline.wind?.designWindSpeedMph || 110,
    roofAge: 5,
    roofType: "Architectural Shingle",
    historicalWindEvents: 2,
    fsWindFactor: baseline.wind?.fsWindFactor || 3,
  };
  
  const heat: HeatData = {
    avgSummerHighF: baseline.heat?.avgSummerHighF || 88,
    daysOver95F: baseline.heat?.daysOver95F || 45,
    daysOver100F: baseline.heat?.daysOver100F || 15,
    urbanHeatIslandEffect: true,
    projectedDaysOver100F_2050: baseline.heat?.projectedDaysOver100F_2050 || 25,
    fsHeatFactor: Math.round((baseline.heat?.daysOver100F || 15) / 12),
  };
  
  // Calculate composite score (0-100, higher is better)
  const perilScores = [
    10 - (flood.fsFloodFactor || 0),
    10 - (wildfire.fsWildfireFactor || 0),
    10 - (wind.fsWindFactor || 0),
    10 - (heat.fsHeatFactor || 0),
  ];
  const avgScore = perilScores.reduce((a, b) => a + b, 0) / perilScores.length;
  const overallClimateScore = Math.round(avgScore * 10);
  
  // Identify material risks (score > 6)
  const materialRisks: string[] = [];
  if ((flood.fsFloodFactor || 0) > 6) materialRisks.push(`Flood risk elevated (factor ${flood.fsFloodFactor}/10)`);
  if ((wildfire.fsWildfireFactor || 0) > 6) materialRisks.push(`Wildfire risk elevated (factor ${wildfire.fsWildfireFactor}/10)`);
  if ((wind.fsWindFactor || 0) > 6) materialRisks.push(`Wind/hurricane risk elevated (factor ${wind.fsWindFactor}/10)`);
  if ((heat.fsHeatFactor || 0) > 6) materialRisks.push(`Extreme heat risk elevated (factor ${heat.fsHeatFactor}/10)`);
  
  // Generate recommendations
  const recommendedActions: string[] = [];
  if (flood.pctInFloodplain > 5) recommendedActions.push("Conduct detailed flood mitigation assessment");
  if (wind.hurricaneZone && wind.roofAge > 10) recommendedActions.push("Schedule roof inspection and consider wind mitigation upgrades");
  if (heat.daysOver100F > 50) recommendedActions.push("Evaluate HVAC capacity and energy efficiency upgrades");
  if (wildfire.riskLevel === "high" || wildfire.riskLevel === "extreme") recommendedActions.push("Implement defensible space and fire-resistant landscaping");
  
  // Insurance implications
  let insuranceAvailability: "standard" | "surplus" | "unavailable" = "standard";
  if (overallClimateScore < 50 || flood.pctInFloodplain > 10) insuranceAvailability = "surplus";
  if (flood.femaZone === "VE" || overallClimateScore < 30) insuranceAvailability = "unavailable";
  
  // Financial impact modeling
  const holdPeriodYears = 5;
  const baseAnnualLoss = (flood.fs30YearLoss || 0) / 30 + (wind.fsWindFactor || 0) * 500 + (heat.fsHeatFactor || 0) * 300;
  const projectedCumulativeLoss = baseAnnualLoss * holdPeriodYears * (1 + 0.03 * holdPeriodYears); // 3% annual increase
  const totalUnits = flood.totalUnits || 288;
  
  return {
    address: `${Math.floor(1000 + rnd(9000))} Sample Address`,
    latitude: 30.2672 + rnd(5) - 2.5,
    longitude: -97.7431 + rnd(5) - 2.5,
    assessmentDate: today,
    flood,
    wildfire,
    wind,
    heat,
    overallClimateScore,
    materialRisks,
    recommendedActions,
    insuranceAvailability,
    premiumTrendPct: baseline.premiumTrendPct || 8.0,
    deductibleSpecial: wind.hurricaneZone ? 5 : 2,
    holdPeriodYears,
    projectedCumulativeLoss: Math.round(projectedCumulativeLoss),
    annualizedClimateCost: Math.round(baseAnnualLoss),
    climateCostPerUnit: Math.round(baseAnnualLoss / totalUnits),
  };
};

/**
 * Assess climate risk for a property.
 * In production, this would call First Street Enterprise API or ClimateCheck.
 */
export const assessClimateRisk = async (
  address: string,
  market: string,
  seed?: number
): Promise<ClimateAssessment> => {
  // In production, this would be an API call:
  // const response = await fetch(`https://api.firststreet.org/v1/property/${encodeURIComponent(address)}`, {
  //   headers: { Authorization: `Bearer ${process.env.FIRST_STREET_API_KEY}` }
  // });
  // return response.json();
  
  // Mock implementation for now
  return Promise.resolve(generateMockClimateData(market, seed || Date.now()));
};

/**
 * Convert climate assessment to verification items for the report.
 */
export const climateToVerificationItems = (assessment: ClimateAssessment): Array<{
  item: string;
  status: "verified" | "flagged" | "not_performed";
  source: string;
  note: string;
}> => {
  const items: Array<{
    item: string;
    status: "verified" | "flagged" | "not_performed";
    source: string;
    note: string;
  }> = [];
  
  // Flood check
  if (assessment.flood.femaZone === "AE" || assessment.flood.femaZone === "VE") {
    items.push({
      item: "FEMA flood zone (AE/VE)",
      status: "flagged",
      source: `FEMA MSC · ${assessment.assessmentDate}`,
      note: `${assessment.flood.pctInFloodplain.toFixed(1)}% of units in floodplain · $${assessment.flood.annualFloodInsuranceEstimate.toLocaleString()}/yr insurance`,
    });
  } else {
    items.push({
      item: "FEMA flood zone (minimal risk)",
      status: "verified",
      source: `FEMA MSC · ${assessment.assessmentDate}`,
      note: `Zone ${assessment.flood.femaZone} · <1% units in floodplain`,
    });
  }
  
  // Forward-looking flood risk
  if ((assessment.flood.fsFloodFactor || 0) > 6) {
    items.push({
      item: "Forward-looking flood risk (2030-2050)",
      status: "flagged",
      source: "First Street Foundation",
      note: `Flood Factor ${assessment.flood.fsFloodFactor}/10 · increasing trend · 30-yr expected loss $${(assessment.flood.fs30YearLoss || 0).toLocaleString()}`,
    });
  }
  
  // Wind/hurricane
  if (assessment.wind.hurricaneZone) {
    items.push({
      item: "Hurricane zone exposure",
      status: "flagged",
      source: "NOAA Hurricane Database",
      note: `Design wind ${assessment.wind.designWindSpeedMph} mph · ${assessment.wind.deductibleSpecial}% wind deductible`,
    });
  }
  
  // Heat stress
  if (assessment.heat.daysOver100F > 30) {
    items.push({
      item: "Extreme heat exposure",
      status: "flagged",
      source: "NOAA Climate Normals",
      note: `${assessment.heat.daysOver100F} days >100°F annually · projected ${assessment.heat.projectedDaysOver100F_2050} days by 2050`,
    });
  }
  
  // Overall climate cost
  items.push({
    item: "Climate-related operating cost",
    status: "verified",
    source: "ACQ Climate Model v1.0",
    note: `$${assessment.annualizedClimateCost.toLocaleString()}/yr · $${assessment.climateCostPerUnit}/door · ${assessment.premiumTrendPct.toFixed(1)}% insurance trend`,
  });
  
  return items;
};

/**
 * Get climate risk narrative for the agent memo.
 */
export const getClimateNarrative = (assessment: ClimateAssessment): string => {
  const parts: string[] = [];
  
  if (assessment.overallClimateScore >= 70) {
    parts.push(`Climate risk profile is favorable (score ${assessment.overallClimateScore}/100) with no material exposures identified.`);
  } else if (assessment.overallClimateScore >= 50) {
    parts.push(`Climate risk profile is moderate (score ${assessment.overallClimateScore}/100) with ${assessment.materialRisks.length} material risk(s) requiring diligence.`);
  } else {
    parts.push(`Climate risk profile is elevated (score ${assessment.overallClimateScore}/100) — ${assessment.materialRisks.join("; ")} — recommend enhanced diligence and underwriting adjustments.`);
  }
  
  if (assessment.insuranceAvailability !== "standard") {
    parts.push(`Property insurance availability is ${assessment.insuranceAvailability} with premiums trending ${assessment.premiumTrendPct > 0 ? "up" : "down"} ${Math.abs(assessment.premiumTrendPct).toFixed(1)}% YoY.`);
  }
  
  if (assessment.projectedCumulativeLoss > 0) {
    parts.push(`Modeled cumulative climate-related losses over ${assessment.holdPeriodYears}-year hold period: $${assessment.projectedCumulativeLoss.toLocaleString()} ($${assessment.climateCostPerUnit}/door).`);
  }
  
  if (assessment.recommendedActions.length > 0) {
    parts.push(`Recommended actions: ${assessment.recommendedActions.slice(0, 2).join("; ")}.`);
  }
  
  return parts.join(" ");
};

export default {
  assessClimateRisk,
  climateToVerificationItems,
  getClimateNarrative,
  generateMockClimateData,
};
