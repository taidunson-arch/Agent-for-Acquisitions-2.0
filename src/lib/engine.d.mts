// Types for engine.mjs (single source of truth for ACQ/2.0 underwriting math).
import type { DealInputs } from "./types";

export interface EngineMetric { value: number | null; formula: string; calc?: string; note?: string; undefined_reason?: string }
export interface EngineBlocking { field: string; reason: string }
export interface EngineCell { rent_delta: number; rehab_delta: number; noi: number | null; dscr: number | null; coc_pct: number | null; equity_required: number | null }
export interface EngineHalt { status: "halt"; engine: string; blocking: EngineBlocking[]; warnings: string[]; message: string }
export interface EngineOk {
  status: "ok"; engine: string;
  config: { dscr_floor: number; weights: Record<string, number>; bands: { strong: number; pass_below: number } };
  warnings: string[]; placeholders: Record<string, string>;
  metrics: Record<string, EngineMetric>;
  stress: { rent_steps: number[]; rehab_steps: number[]; cells: EngineCell[] };
  score: { components: Record<string, number>; weights_used: Record<string, number>; total: number };
  hard_stops: { metric: string; value: number | null; rule: string }[];
  anomalies: { type: string; detail: string }[];
  verdict: "STRONG ADVANTAGE" | "NEGOTIATE" | "PASS"; verdict_basis: string;
  comps_used: NonNullable<DealInputs["comps"]>;
  offer: { opening: number; target: number; walk_away: number; basis: string } | { unsupported: string };
  verification: { performed: unknown[]; note: string };
}
export type EngineResult = EngineOk | EngineHalt;
export const DEFAULTS: { dscr_floor: number; rent_steps: number[]; rehab_steps: number[]; weights: Record<string, number>; bands: { strong: number; pass_below: number } };
export function validate(d: Partial<DealInputs>): { blocking: EngineBlocking[]; warnings: string[]; placeholders: Record<string, string> };
export function underwrite(d: Partial<DealInputs>, cfg?: Record<string, unknown>): EngineResult;
