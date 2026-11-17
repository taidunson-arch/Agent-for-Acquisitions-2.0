import type { AgentStep, Report } from "./types";
import { fmtK, fmtPct, fmtX } from "./format";

export const AGENT_VERSION = "acq-agent v4.0 · shared engine";

export const buildScript = (r: Report): AgentStep[] => {
  const i = r.inputs;
  const m = r.m;
  const avgCompPpu = r.comps.length ? r.comps.reduce((s, x) => s + x.pricePerUnit, 0) / r.comps.length : NaN;
  const finite = r.matrix.flat().filter((c) => Number.isFinite(c.coc));
  const worst = finite.length ? finite.reduce((a, b) => (b.coc < a.coc ? b : a)) : null;
  const best = finite.length ? finite.reduce((a, b) => (b.coc > a.coc ? b : a)) : null;

  return [
    {
      label: "INGEST DANA INPUTS",
      lines: [
        { k: "dim", t: `boot ${AGENT_VERSION}` },
        { k: "dim", t: "validating Dana Inputs against the engine contract" },
        { k: "act", t: `intake valid — ${i.dealName || "[not provided]"} · ${i.market || "[not provided]"}` },
        ...(r.warnings ?? []).map((w) => ({ k: "warn" as const, t: w })),
        { k: "val", t: `ask ${fmtK(i.askingPrice)} · ARV ${fmtK(i.arv)} · rehab ${fmtK(i.rehabBudget)} · ${i.units} doors` },
      ],
    },
    {
      label: "MARKET INTEL",
      lines: [
        ...(r.comps.length
          ? [
              { k: "act" as const, t: `${r.comps.length} sourced comps · avg ${fmtK(avgCompPpu)}/door` },
              { k: "val" as const, t: `subject ${fmtK(m.pricePerUnit)}/door vs comp set ${avgCompPpu > m.pricePerUnit ? "discount" : "premium"} ${fmtPct(Math.abs((avgCompPpu - m.pricePerUnit) / avgCompPpu) * 100, 0)}` },
            ]
          : [{ k: "warn" as const, t: "no sourced comps supplied — comp benchmarks unsupported (none fabricated)" }]),
        { k: "val", t: `ARV (input) ${fmtK(i.arv)} · confidence not computed` },
      ],
    },
    {
      label: "UNDERWRITE",
      lines: [
        { k: "val", t: `PGI ${fmtK(m.pgi)} → EGI ${fmtK(m.egi)} → NOI ${fmtK(m.noi)}` },
        { k: "val", t: `going-in ${fmtPct(m.goingInCap)} on price · stabilized YoC ${fmtPct(m.stabCap)} · GRM ${Number.isFinite(m.grm) ? m.grm.toFixed(1) : "—"}` },
        ...(i.opexRatioPct > 55 ? [{ k: "warn" as const, t: `opex ratio ${fmtPct(i.opexRatioPct, 0)} above ~40-55% affordable band — review flagged` }] : []),
        ...(m.rentGapPct > 7 ? [{ k: "act" as const, t: `mark-to-market lift detected: +${fmtPct(m.rentGapPct, 0)} rent gap` }] : []),
      ],
    },
    {
      label: "CAPITAL STACK",
      lines: [
        { k: "val", t: `senior ${fmtK(m.loan)} @ ${fmtPct(i.ratePct, 2)} / ${i.amortYears}yr · LTC ${fmtPct(i.ltvPct, 0)}` },
        { k: "val", t: `equity required ${fmtK(m.equity)} · P&I ${fmtK(m.monthlyPI)}/mo` },
        { k: "val", t: `DSCR ${fmtX(m.dscr)} · cash-on-cash ${fmtPct(m.coc)} · CF ${fmtK(m.cashFlowMonthly)}/mo` },
        ...(Number.isFinite(m.dscr) && m.dscr < 1.25 ? [{ k: "warn" as const, t: "DSCR under 1.25× floor — proceeds at risk" }] : []),
      ],
    },
    {
      label: "STRESS TEST",
      lines: [
        { k: "dim", t: "perturbing rents ±8% × rehab overruns +0/+30% (20 cells; overruns equity-funded)" },
        { k: "val", t: worst && best ? `worst cell CoC ${fmtPct(worst.coc)} · best ${fmtPct(best.coc)} · base ${fmtPct(m.coc)}` : "CoC undefined in all cells (equity required ≤ 0)" },
        { k: "val", t: `break-even occupancy ${fmtPct(m.breakEvenOcc * 100, 0)}` },
      ],
    },
    {
      label: "DECISION",
      lines: [
        { k: "act", t: `score ${r.scores.total}/100 — spread ${r.scores.spread} · dscr ${r.scores.dscr} · yield ${r.scores.cap} · coc ${r.scores.coc}` },
        ...(r.hardStops ?? []).map((h) => ({ k: "warn" as const, t: `HARD STOP: ${h.rule}` })),
        { k: r.verdict === "PASS" ? "warn" : "ok", t: `verdict: ${r.verdict}` },
      ],
    },
    {
      label: "COMPOSE REPORT",
      lines: [
        { k: "dim", t: "composing Developer Deal Advantage Report (v4)" },
        { k: "act", t: `ref ${r.refNo} · stamp: ${r.verdict}` },
        { k: "ok", t: "run complete — handoff to acquisitions desk" },
      ],
    },
  ];
};
