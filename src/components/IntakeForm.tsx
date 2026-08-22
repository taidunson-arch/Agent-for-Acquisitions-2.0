import { useEffect, useState } from "react";
import type { AssetType, DealInputs } from "../lib/types";
import { ASSET_LABELS } from "../data/deals";
import { fmtK, fmtPct } from "../lib/format";
import { IconBolt, Spinner } from "./ui";

const NUM_KEYS = [
  "askingPrice", "arv", "rehabBudget", "units", "currentRent", "marketRent",
  "vacancyPct", "opexRatioPct", "ancillaryPct", "closingCostPct", "ltvPct", "ratePct", "amortYears",
] as const;
type NumKey = (typeof NUM_KEYS)[number];

const toDraft = (v: DealInputs): Record<string, string> => {
  const d: Record<string, string> = { dealName: v.dealName, address: v.address, market: v.market, assetType: v.assetType };
  for (const k of NUM_KEYS) d[k] = v[k] === 0 ? "" : String(v[k]);
  return d;
};

function SectionHead({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mt-7 mb-3 first:mt-0">
      <span className="font-mono text-[10px] tracking-[0.18em] text-brass border border-brass/35 px-1.5 py-px rounded-sm">{n}</span>
      <span className="font-display text-lg font-semibold uppercase tracking-[0.08em] text-paper">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function Field({
  label, children, error, className = "",
}: { label: string; children: React.ReactNode; error?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[10.5px] uppercase tracking-[0.12em] font-medium text-ink-faint mb-1">{label}</span>
      {children}
      {error && <span className="block mt-1 text-[10.5px] font-mono text-ember">{error}</span>}
    </label>
  );
}

export default function IntakeForm({
  value, errors, errorCount, running, onChange, onRun,
}: {
  value: DealInputs;
  errors: Partial<Record<keyof DealInputs, string>>;
  errorCount: number;
  running: boolean;
  onChange: (patch: Partial<DealInputs>) => void;
  onRun: () => void;
}) {
  const [draft, setDraft] = useState(() => toDraft(value));
  useEffect(() => setDraft(toDraft(value)), [value.id]);

  const set = (k: string, raw: string) => {
    setDraft((d) => ({ ...d, [k]: raw }));
    if (k === "dealName" || k === "address" || k === "market") onChange({ [k]: raw } as Partial<DealInputs>);
    else if (k === "assetType") onChange({ assetType: raw as AssetType });
    else {
      const n = Number(raw.replace(/[$,%\s]/g, ""));
      onChange({ [k]: raw.trim() === "" || Number.isNaN(n) ? 0 : n } as Partial<DealInputs>);
    }
  };

  const num = (k: NumKey, props: { prefix?: string; suffix?: string; placeholder?: string; error?: string; label: string; className?: string }) => (
    <Field label={props.label} error={props.error} className={props.className}>
      <div className="relative">
        {props.prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-faint font-mono">{props.prefix}</span>}
        <input
          className={`input ${props.prefix ? "pl-6" : ""} ${props.suffix ? "pr-8" : ""} ${errors[k] ? "input-error" : ""}`}
          inputMode="decimal"
          value={draft[k] ?? ""}
          placeholder={props.placeholder ?? "0"}
          onChange={(e) => set(k, e.target.value)}
        />
        {props.suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-faint font-mono">{props.suffix}</span>}
      </div>
    </Field>
  );

  /* live mini-metrics */
  const mao = value.arv * 0.7 - value.rehabBudget;
  const spread = mao - value.askingPrice;
  const ppu = value.units > 0 ? value.askingPrice / value.units : 0;
  const gap = value.currentRent > 0 ? ((value.marketRent - value.currentRent) / value.currentRent) * 100 : 0;

  return (
    <div className="rounded-lg border border-line bg-pine-850/80 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h2 className="font-display text-2xl sm:text-[28px] font-bold uppercase tracking-[0.05em] leading-none">
            Dana Inputs <span className="text-brass">/ Deal Intake</span>
          </h2>
          <p className="mt-1.5 text-xs text-ink-faint font-mono">feed D-20260817T151903Z · 16 fields · agent-ready</p>
        </div>
        <span className="shrink-0 mt-0.5 inline-flex items-center gap-1.5 rounded-full border border-moss/30 bg-moss/10 px-2.5 py-1 text-[10px] font-mono tracking-wider text-moss">
          <span className="w-1.5 h-1.5 rounded-full bg-moss pulse-dot" /> LIVE
        </span>
      </div>

      <SectionHead n="01" label="Identity" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Deal name" error={errors.dealName} className="col-span-2">
          <input className={`input ${errors.dealName ? "input-error" : ""}`} value={draft.dealName} placeholder="e.g. Maple Row Apartments" onChange={(e) => set("dealName", e.target.value)} />
        </Field>
        <Field label="Address" error={errors.address} className="col-span-2">
          <input className={`input ${errors.address ? "input-error" : ""}`} value={draft.address} placeholder="Street, city" onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="Market" error={errors.market}>
          <input className={`input ${errors.market ? "input-error" : ""}`} value={draft.market} placeholder="Columbus, OH" onChange={(e) => set("market", e.target.value)} />
        </Field>
        <Field label="Asset type">
          <select className="input" value={draft.assetType} onChange={(e) => set("assetType", e.target.value)}>
            {Object.entries(ASSET_LABELS).map(([k, v]) => (
              <option key={k} value={k} className="bg-pine-900">{v}</option>
            ))}
          </select>
        </Field>
      </div>

      <SectionHead n="02" label="Pricing" />
      <div className="grid grid-cols-2 gap-3">
        {num("askingPrice", { label: "Asking price", prefix: "$", placeholder: "1,050,000", error: errors.askingPrice })}
        {num("arv", { label: "After-repair value", prefix: "$", placeholder: "1,640,000", error: errors.arv })}
        {num("rehabBudget", { label: "Rehab budget", prefix: "$", placeholder: "212,000", error: errors.rehabBudget })}
        {num("closingCostPct", { label: "Closing costs", suffix: "% ask", placeholder: "2.5", error: errors.closingCostPct })}
      </div>

      <SectionHead n="03" label="Property & Operations" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {num("units", { label: "Units / doors", placeholder: "14", error: errors.units })}
        {num("currentRent", { label: "In-place rent", prefix: "$", suffix: "/mo", placeholder: "940", error: errors.currentRent })}
        {num("marketRent", { label: "Market rent", prefix: "$", suffix: "/mo", placeholder: "1,175", error: errors.marketRent })}
        {num("vacancyPct", { label: "Vacancy", suffix: "%", placeholder: "6", error: errors.vacancyPct })}
        {num("opexRatioPct", { label: "Opex ratio", suffix: "% EGI", placeholder: "39", error: errors.opexRatioPct })}
        {num("ancillaryPct", { label: "Ancillary", suffix: "% EGI", placeholder: "4", error: errors.ancillaryPct })}
      </div>

      <SectionHead n="04" label="Capital Stack" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {num("ltvPct", { label: "LTC", suffix: "%", placeholder: "75", error: errors.ltvPct })}
        {num("ratePct", { label: "Rate", suffix: "%", placeholder: "6.35", error: errors.ratePct })}
        {num("amortYears", { label: "Amort", suffix: "yr", placeholder: "30", error: errors.amortYears, className: "col-span-2 sm:col-span-1" })}
      </div>

      {/* live strip */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line rounded-md overflow-hidden border border-line">
        {[
          { l: "70% MAO", v: value.arv > 0 ? fmtK(mao) : "—" },
          { l: "Δ vs ask", v: value.askingPrice > 0 && value.arv > 0 ? fmtK(spread) : "—", tone: spread >= 0 ? "text-moss" : "text-ember" },
          { l: "$ / door", v: value.askingPrice > 0 ? fmtK(ppu) : "—" },
          { l: "Rent gap", v: value.currentRent > 0 ? fmtPct(gap, 0) : "—", tone: gap > 7 ? "text-moss" : undefined },
        ].map((c) => (
          <div key={c.l} className="bg-pine-900/90 px-3 py-2.5 transition-colors hover:bg-pine-800">
            <div className="text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">{c.l}</div>
            <div className={`font-mono text-sm font-semibold mt-0.5 ${c.tone ?? "text-paper"}`}>{c.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={onRun}
          disabled={running || errorCount > 0}
          className="group relative flex-1 inline-flex items-center justify-center gap-2.5 rounded-md bg-brass px-5 py-3 font-display text-lg font-bold uppercase tracking-[0.08em] text-inkline transition-all duration-200 hover:bg-brass-soft hover:shadow-[0_0_28px_rgba(217,164,65,0.28)] active:scale-[0.985] disabled:opacity-40 disabled:hover:bg-brass disabled:hover:shadow-none"
        >
          {running ? <Spinner className="w-4.5 h-4.5" /> : <IconBolt className="w-4.5 h-4.5 transition-transform group-hover:-rotate-12" />}
          {running ? "Agent running…" : "Run advantage analysis"}
        </button>
        {errorCount > 0 && (
          <span className="shrink-0 font-mono text-[11px] text-ember border border-ember/35 rounded-md px-2.5 py-2">
            {errorCount} field{errorCount > 1 ? "s" : ""} to fix
          </span>
        )}
      </div>
    </div>
  );
}
