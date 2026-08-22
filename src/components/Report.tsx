import { useEffect, useState } from "react";
import type { Report } from "../lib/types";
import { fmtK, fmtPct, fmtUSD, fmtX } from "../lib/format";
import { ASSET_LABELS } from "../data/deals";
import { CountUp, Reveal, SectionTag, IconPrint, IconRefresh, IconUp, IconWarn, IconWrench } from "./ui";

const VERDICT_HEX: Record<Report["verdict"], string> = {
  "STRONG ADVANTAGE": "#2e7d54",
  NEGOTIATE: "#8a6420",
  PASS: "#b03a24",
};
const VERDICT_CLASS: Record<Report["verdict"], string> = {
  "STRONG ADVANTAGE": "text-moss-deep",
  NEGOTIATE: "text-brass-deep",
  PASS: "text-ember-deep",
};

function Dial({ score, color }: { score: number; color: string }) {
  const C = 326.7;
  const [off, setOff] = useState(C);
  useEffect(() => {
    const t = setTimeout(() => setOff(C * (1 - score / 100)), 120);
    return () => clearTimeout(t);
  }, [score, C]);
  return (
    <svg viewBox="0 0 120 120" className="w-[118px] h-[118px] shrink-0">
      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(28,43,33,0.12)" strokeWidth="9" />
      <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 60 60)" className="dial-arc" />
      <text x="60" y="60" textAnchor="middle" fontSize="36" fontWeight="700" fill={color} fontFamily="Barlow Condensed">{score}</text>
      <text x="60" y="78" textAnchor="middle" fontSize="8.5" letterSpacing="2.5" fill="#47584c" fontFamily="IBM Plex Mono">ACQ /100</text>
    </svg>
  );
}

const Row = ({ l, v, strong = false, tone = "" }: { l: string; v: string; strong?: boolean; tone?: string }) => (
  <div className="flex items-end py-[7px]">
    <span className={`text-[13px] ${strong ? "font-semibold text-inkline" : "text-ink-soft"}`}>{l}</span>
    <span className="leader" />
    <span className={`font-mono tnum ${strong ? "text-[15px] font-bold text-inkline" : "text-[13px] font-semibold text-inkline/85"} ${tone}`}>{v}</span>
  </div>
);

function IncomeRow({ label, value, max, kind }: { label: string; value: number; max: number; kind: "pos" | "neg" | "key" }) {
  const w = Math.min(100, Math.max(2, (Math.abs(value) / max) * 100));
  const bar = kind === "neg" ? "bg-ember/75" : kind === "key" ? "bg-brass" : "bg-moss-deep/80";
  return (
    <div className="grid grid-cols-[110px_1fr_92px] sm:grid-cols-[140px_1fr_110px] items-center gap-3 py-[5px]">
      <span className={`text-[12px] ${kind === "key" ? "font-bold text-inkline" : "text-ink-soft"}`}>{label}</span>
      <div className="h-[13px] bg-inkline/6 rounded-sm overflow-hidden">
        <div className={`h-full ${bar} bar-grow`} style={{ width: `${w}%` }} />
      </div>
      <span className={`font-mono text-[12px] tnum text-right ${kind === "neg" ? "text-ember-deep" : kind === "key" ? "font-bold text-inkline" : "text-inkline/85"}`}>
        {kind === "neg" ? `(${fmtUSD(Math.abs(value))})` : fmtUSD(value)}
      </span>
    </div>
  );
}

export default function DealReport({ report: r, onRerun, onPrint }: { report: Report; onRerun: () => void; onPrint: () => void }) {
  const i = r.inputs;
  const m = r.m;
  const hex = VERDICT_HEX[r.verdict];
  const date = new Date(r.generatedAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const maxIncome = Math.max(m.pgi, 1);

  const cellBg = (coc: number, base: boolean) => {
    const bg = coc <= 0 ? "rgba(176,58,36,0.20)" : coc < 4 ? "rgba(176,58,36,0.07)" : coc >= 8 ? "rgba(46,125,84,0.15)" : "transparent";
    return { backgroundColor: bg, boxShadow: base ? `inset 0 0 0 2px ${hex}` : undefined };
  };

  return (
    <div id="report-sheet" className="rounded-lg bg-paper text-inkline shadow-[0_30px_80px_rgba(0,0,0,0.5)] border border-paperline overflow-hidden">
      {/* action bar */}
      <div className="no-print flex items-center justify-between gap-3 px-5 sm:px-8 py-3 bg-inkline text-paper">
        <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-paper/70">Report ready · {r.refNo}</span>
        <div className="flex items-center gap-2">
          <button onClick={onRerun} className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-mono text-[11px] tracking-wide border border-paper/25 hover:border-brass hover:text-brass transition-colors">
            <IconRefresh className="w-3.5 h-3.5" /> RE-RUN
          </button>
          <button onClick={onPrint} className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-mono text-[11px] tracking-wide bg-brass text-inkline hover:bg-brass-soft transition-colors">
            <IconPrint className="w-3.5 h-3.5" /> PRINT / PDF
          </button>
        </div>
      </div>

      <div className="px-5 sm:px-9 py-7 sm:py-9">
        {/* memo header */}
        <Reveal>
          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b-4 border-inkline">
            <div>
              <div className="font-mono text-[10px] tracking-[0.22em] text-ink-soft uppercase mb-2">
                Ref {r.refNo} · {dateStr} {timeStr} · Agent ACQ/2.0.3
              </div>
              <h1 className="font-display font-bold uppercase leading-[0.92] text-[38px] sm:text-[52px] tracking-[0.01em]">
                Developer Deal<br />
                <span className="text-moss-deep">Advantage Report</span>
              </h1>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold uppercase leading-none">{i.dealName}</div>
              <div className="font-mono text-[11px] text-ink-soft mt-1.5">{i.address} · {i.market}</div>
              <div className="mt-2 inline-flex gap-1.5">
                <span className="border border-inkline/30 px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase">{ASSET_LABELS[i.assetType]}</span>
                <span className="border border-inkline/30 px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase">{i.units} doors</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* 01 verdict */}
        <Reveal delay={0.05}>
          <div className="pt-7">
            <SectionTag index="01" title="Verdict" />
            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-5">
                <Dial score={r.scores.total} color={hex} />
                <div className={`stamp inline-block px-5 py-2.5 ${VERDICT_CLASS[r.verdict]}`}>
                  <span className="font-display text-2xl sm:text-[28px] font-bold uppercase tracking-[0.12em] whitespace-nowrap">{r.verdict}</span>
                </div>
              </div>
              <div>
                <p className="text-[14px] leading-relaxed font-medium text-inkline/90 max-w-xl">{r.verdictLine}</p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { l: "Spread", v: r.scores.spread },
                    { l: "Coverage", v: r.scores.dscr },
                    { l: "Yield", v: r.scores.cap },
                    { l: "Levered return", v: r.scores.coc },
                  ].map((s) => (
                    <div key={s.l}>
                      <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-ink-soft mb-1">
                        <span>{s.l}</span><span>{s.v}</span>
                      </div>
                      <div className="h-[7px] bg-inkline/10 rounded-sm overflow-hidden">
                        <div className="h-full bar-grow" style={{ width: `${s.v}%`, backgroundColor: hex }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 font-mono text-[10.5px] text-ink-faint">
                  MODEL CONFIDENCE {(r.confidence * 100).toFixed(0)}% · COMPS {r.comps.length} · STRESS CELLS {r.matrix.flat().length}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* 02 basis & terms */}
        <Reveal delay={0.05}>
          <div className="pt-8">
            <SectionTag index="02" title="Basis & Terms" />
            <div className="grid sm:grid-cols-2 gap-x-10">
              <div>
                <Row l="Support ceiling (max)" v={fmtUSD(m.ceiling)} strong tone="text-moss-deep" />
                <Row l="· 70% rule MAO" v={fmtUSD(m.mao70)} />
                <Row l="· DSCR-supported offer (1.25×)" v={Number.isFinite(m.supportedOffer) ? fmtUSD(m.supportedOffer) : "N/S"} />
                <Row l="Spread vs ask" v={`${m.spread >= 0 ? "+" : "−"}${fmtUSD(Math.abs(m.spread))} (${m.spreadPct >= 0 ? "+" : "−"}${Math.abs(m.spreadPct).toFixed(1)}%)`} tone={m.spread >= 0 ? "text-moss-deep" : "text-ember-deep"} strong />
              </div>
              <div>
                <Row l="All-in basis" v={fmtUSD(m.allIn)} strong />
                <Row l="· Ask + closing + rehab" v={`${fmtK(i.askingPrice)} + ${fmtK(m.closingCosts)} + ${fmtK(m.rehab)}`} />
                <Row l="Senior debt" v={`${fmtUSD(m.loan)} @ ${i.ratePct}%`} />
                <Row l="Equity to close" v={fmtUSD(m.equity)} strong />
              </div>
            </div>
          </div>
        </Reveal>

        {/* 03 income ledger */}
        <Reveal delay={0.05}>
          <div className="pt-8">
            <SectionTag index="03" title="Income Ledger — Year 1" />
            <div className="border border-inkline/15 rounded-md px-4 sm:px-5 py-4 bg-paper-2/60">
              <IncomeRow label="Potential gross" value={m.pgi} max={maxIncome} kind="pos" />
              <IncomeRow label={`Vacancy ${i.vacancyPct}%`} value={-m.vacancyLoss} max={maxIncome} kind="neg" />
              <IncomeRow label={`Ancillary +${i.ancillaryPct}%`} value={m.ancillary} max={maxIncome} kind="pos" />
              <IncomeRow label="Effective gross" value={m.egi} max={maxIncome} kind="pos" />
              <IncomeRow label={`Operating exp ${i.opexRatioPct}%`} value={-m.opex} max={maxIncome} kind="neg" />
              <IncomeRow label="Net operating income" value={m.noi} max={maxIncome} kind="key" />
              <IncomeRow label="Debt service" value={-m.ads} max={maxIncome} kind="neg" />
              <div className="mt-2 pt-2 border-t-2 border-inkline/20">
                <IncomeRow label="Cash flow after financing" value={m.cashFlowAnnual} max={maxIncome} kind={m.cashFlowAnnual >= 0 ? "key" : "neg"} />
              </div>
            </div>
          </div>
        </Reveal>

        {/* 04 returns */}
        <Reveal delay={0.05}>
          <div className="pt-8">
            <SectionTag index="04" title="Returns & Coverage" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { l: "Going-in cap", v: m.goingInCap, f: (n: number) => fmtPct(n) },
                { l: "Stabilized yield", v: m.stabCap, f: (n: number) => fmtPct(n) },
                { l: "DSCR", v: Number.isFinite(m.dscr) ? m.dscr : NaN, f: (n: number) => fmtX(n) },
                { l: "Cash-on-cash", v: m.coc, f: (n: number) => fmtPct(n) },
              ].map((s) => (
                <div key={s.l} className="border border-inkline/15 rounded-md px-4 py-3.5 bg-paper-2/50 hover:bg-paper-2 transition-colors">
                  <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-soft">{s.l}</div>
                  <CountUp value={s.v} format={s.f} className="block font-display text-[32px] font-bold leading-tight mt-0.5" />
                </div>
              ))}
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <div className="border border-inkline/15 rounded-md px-4 py-3.5">
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-ink-soft mb-2">
                  <span>Break-even occupancy</span><span className="font-bold text-inkline">{fmtPct(m.breakEvenOcc * 100, 0)}</span>
                </div>
                <div className="h-2 bg-inkline/10 rounded-sm overflow-hidden">
                  <div className={`h-full bar-grow ${m.breakEvenOcc > 0.78 ? "bg-ember-deep" : "bg-moss-deep"}`} style={{ width: `${Math.min(100, m.breakEvenOcc * 100)}%` }} />
                </div>
              </div>
              <div className="border border-inkline/15 rounded-md px-4 py-3.5 flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">Monthly cash flow</div>
                  <CountUp value={m.cashFlowMonthly} format={(n) => fmtUSD(n)} className={`block font-display text-[26px] font-bold leading-tight mt-0.5 ${m.cashFlowMonthly < 0 ? "text-ember-deep" : "text-moss-deep"}`} />
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">$ / door</div>
                  <div className="font-mono text-lg font-bold tnum">{fmtK(m.pricePerUnit)}</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* 05 stress */}
        <Reveal delay={0.05}>
          <div className="pt-8">
            <SectionTag index="05" title="Stress Matrix — CoC %" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left font-mono text-[10px] uppercase tracking-wider text-ink-soft py-2 pr-3">Rent ↓ / Rehab →</th>
                    {r.rehabDeltas.map((h) => (
                      <th key={h} className="font-mono text-[10.5px] font-semibold text-ink-soft py-2 px-1">{h === 0 ? "AS-IS" : `+${h * 100}%`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.matrix.map((row, ri) => (
                    <tr key={ri}>
                      <td className="font-mono text-[10.5px] font-semibold text-ink-soft py-1 pr-3 whitespace-nowrap">
                        {row[0].rentDelta === 0 ? "BASE" : `${row[0].rentDelta > 0 ? "+" : "−"}${Math.abs(row[0].rentDelta * 100)}%`}
                      </td>
                      {row.map((cell, ci) => {
                        const base = cell.rentDelta === 0 && cell.rehabDelta === 0;
                        return (
                          <td key={ci} className="p-1">
                            <div className="rounded px-2 py-2 text-center font-mono text-[12px] font-bold tnum transition-transform hover:scale-[1.06]" style={cellBg(cell.coc, base)}>
                              <span className={cell.coc <= 0 ? "text-ember-deep" : cell.coc >= 8 ? "text-moss-deep" : "text-inkline/85"}>
                                {cell.coc <= -900 ? "—" : `${cell.coc < 0 ? "−" : ""}${Math.abs(cell.coc).toFixed(1)}%`}
                              </span>
                              <span className="block text-[8.5px] font-medium text-ink-faint mt-0.5">{Number.isFinite(cell.dscr) ? `${cell.dscr.toFixed(2)}×` : "n/a"}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 font-mono text-[10px] text-ink-faint">Rent perturbation applied to in-place rents · rehab overrun applied to budget · base case outlined.</p>
          </div>
        </Reveal>

        {/* 06 levers */}
        <Reveal delay={0.05}>
          <div className="pt-8">
            <SectionTag index="06" title="Advantage Levers" />
            <div className="grid sm:grid-cols-2 gap-2.5">
              {r.levers.map((lv) => (
                <div key={lv.title} className={`flex gap-3 rounded-md border px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  lv.kind === "risk" ? "border-ember-deep/30 bg-ember-deep/5" : lv.kind === "upside" ? "border-moss-deep/30 bg-moss-deep/5" : "border-brass-deep/30 bg-brass-deep/5"
                }`}>
                  <span className={`mt-0.5 shrink-0 ${lv.kind === "risk" ? "text-ember-deep" : lv.kind === "upside" ? "text-moss-deep" : "text-brass-deep"}`}>
                    {lv.kind === "risk" ? <IconWarn className="w-4.5 h-4.5" /> : lv.kind === "upside" ? <IconUp className="w-4.5 h-4.5" /> : <IconWrench className="w-4.5 h-4.5" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-[17px] font-semibold uppercase tracking-wide leading-tight">{lv.title}</span>
                      <span className="shrink-0 font-mono text-[10.5px] font-bold tnum text-inkline/80">{lv.impact}</span>
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{lv.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* 07 offer strategy */}
        <Reveal delay={0.05}>
          <div className="pt-8">
            <SectionTag index="07" title="Offer Strategy" />
            <div className="rounded-md border-2 border-inkline bg-inkline text-paper px-5 py-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-mono text-[9.5px] tracking-[0.2em] uppercase text-paper/60">Opening</div>
                  <CountUp value={r.offer.opening} format={(n) => fmtK(Math.round(n))} className="block font-display text-[26px] sm:text-[34px] font-bold leading-tight mt-1" />
                </div>
                <div className="border-x border-paper/15">
                  <div className="font-mono text-[9.5px] tracking-[0.2em] uppercase text-brass">Target</div>
                  <CountUp value={r.offer.target} format={(n) => fmtK(Math.round(n))} className="block font-display text-[26px] sm:text-[34px] font-bold leading-tight mt-1 text-brass" />
                </div>
                <div>
                  <div className="font-mono text-[9.5px] tracking-[0.2em] uppercase text-paper/60">Ceiling</div>
                  <CountUp value={r.offer.ceiling} format={(n) => fmtK(Math.round(n))} className="block font-display text-[26px] sm:text-[34px] font-bold leading-tight mt-1" />
                </div>
              </div>
              <p className="mt-4 text-[12.5px] leading-relaxed text-paper/80 border-t border-paper/15 pt-3.5">
                Open at <strong className="text-paper">{fmtUSD(r.offer.opening)}</strong>, anchor the negotiation on the comp set at {fmtK(m.pricePerUnit)}/door,
                and request <strong className="text-brass">{fmtUSD(r.offer.credits)}</strong> in closing / rehab credits. Walk away above {fmtUSD(r.offer.ceiling)} —
                past that number both the DSCR floor and sponsor return fail committee.
              </p>
            </div>
          </div>
        </Reveal>

        {/* 08 comps */}
        <Reveal delay={0.05}>
          <div className="pt-8">
            <SectionTag index="08" title="Comp Set" />
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-inkline/25">
                  {["Address", "Dist.", "$ / door", "Cap", "Closed"].map((h) => (
                    <th key={h} className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft py-2 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.comps.map((c) => (
                  <tr key={c.address} className="border-b border-inkline/10 hover:bg-paper-2/70 transition-colors">
                    <td className="py-2 pr-3 text-[13px] font-medium">{c.address}</td>
                    <td className="py-2 pr-3 font-mono text-[12px] tnum text-ink-soft">{c.distanceMi} mi</td>
                    <td className="py-2 pr-3 font-mono text-[12px] tnum font-semibold">{fmtK(c.pricePerUnit)}</td>
                    <td className="py-2 pr-3 font-mono text-[12px] tnum text-ink-soft">{fmtPct(c.cap)}</td>
                    <td className="py-2 font-mono text-[11px] text-ink-faint">{c.period}</td>
                  </tr>
                ))}
                <tr className="bg-moss-deep/10">
                  <td className="py-2 pr-3 text-[13px] font-bold">SUBJECT — {i.dealName}</td>
                  <td className="py-2 pr-3 font-mono text-[12px] tnum text-ink-soft">—</td>
                  <td className="py-2 pr-3 font-mono text-[12px] tnum font-bold text-moss-deep">{fmtK(m.pricePerUnit)}</td>
                  <td className="py-2 pr-3 font-mono text-[12px] tnum font-semibold">{fmtPct(m.goingInCap)}</td>
                  <td className="py-2 font-mono text-[11px] text-ink-faint">ACTIVE</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* 09 agent memo */}
        <Reveal delay={0.05}>
          <div className="pt-8">
            <SectionTag index="09" title="Agent Memo" />
            <div className="space-y-3.5 max-w-3xl">
              {r.narrative.map((p, idx) => (
                <p key={idx} className="text-[13.5px] leading-[1.75] text-ink-soft">
                  <span className="font-mono text-[10px] text-brass-deep mr-2">¶{idx + 1}</span>{p}
                </p>
              ))}
            </div>
          </div>
        </Reveal>

        {/* footer */}
        <div className="mt-9 pt-4 border-t-2 border-inkline/20 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-ink-faint">
            {r.refNo} · ACQ/AGENT 2.0 · Dana inputs D-20260817
          </span>
          <span className="font-mono text-[9.5px] text-ink-faint">Figures are agent estimates — verify before LOI.</span>
        </div>
      </div>
    </div>
  );
}
