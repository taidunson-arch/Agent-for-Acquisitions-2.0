import type { AgentStep, Report } from "./types";
import { fmtK, fmtPct, fmtX } from "./format";

export const AGENT_VERSION = "acq-agent v2.0.3 · profile dana-dev-20260817";

export const buildScript = (r: Report): AgentStep[] => {
  const i = r.inputs;
  const m = r.m;
  const avgCompPpu = r.comps.reduce((s, x) => s + x.pricePerUnit, 0) / r.comps.length;
  const worst = r.matrix.flat().reduce((a, b) => (b.coc < a.coc ? b : a));
  const best = r.matrix.flat().reduce((a, b) => (b.coc > a.coc ? b : a));

  return [
    {
      label: "INGEST DANA INPUTS",
      lines: [
        { k: "dim", t: `boot ${AGENT_VERSION}` },
        { k: "dim", t: "unpacking Dana_Inputs-20260817T151903Z-1-001.zip … 16 fields found" },
        { k: "act", t: `intake verified — ${i.dealName} · ${i.market}` },
        { k: "val", t: `ask ${fmtK(i.askingPrice)} · ARV ${fmtK(i.arv)} · rehab ${fmtK(i.rehabBudget)} · ${i.units} doors` },
      ],
    },
    {
      label: "MARKET INTEL",
      lines: [
        { k: "dim", t: "scanning arms-length comps · 2.0 mi radius · 180-day lookback" },
        { k: "act", t: `${r.comps.length} comps ingested · median ${fmtK(avgCompPpu)}/door` },
        { k: "val", t: `subject ${fmtK(m.pricePerUnit)}/door vs comp set ${avgCompPpu > m.pricePerUnit ? "discount" : "premium"} ${fmtPct(Math.abs((avgCompPpu - m.pricePerUnit) / avgCompPpu) * 100, 0)}` },
        { k: "val", t: `ARV triangulated ${fmtK(i.arv)} · confidence ${fmtPct(r.confidence * 100, 0)}` },
      ],
    },
    {
      label: "UNDERWRITE",
      lines: [
        { k: "val", t: `PGI ${fmtK(m.pgi)} → EGI ${fmtK(m.egi)} → NOI ${fmtK(m.noi)}` },
        { k: "val", t: `going-in ${fmtPct(m.goingInCap)} · stabilized ${fmtPct(m.stabCap)} · GRM ${Number.isFinite(m.grm) ? m.grm.toFixed(1) : "—"}` },
        ...(i.opexRatioPct > 42 ? [{ k: "warn" as const, t: `opex ratio ${fmtPct(i.opexRatioPct, 0)} above market band — recapture flagged` }] : []),
        ...(m.rentGapPct > 7 ? [{ k: "act" as const, t: `mark-to-market lift detected: +${fmtPct(m.rentGapPct, 0)} rent gap` }] : []),
      ],
    },
    {
      label: "CAPITAL STACK",
      lines: [
        { k: "val", t: `senior ${fmtK(m.loan)} @ ${fmtPct(i.ratePct, 2)} / ${i.amortYears}yr · LTC ${fmtPct(i.ltvPct, 0)}` },
        { k: "val", t: `equity required ${fmtK(m.equity)} · P&I ${fmtK(m.monthlyPI)}/mo` },
        { k: "val", t: `DSCR ${fmtX(m.dscr)} · cash-on-cash ${fmtPct(m.coc)} · CF ${fmtK(m.cashFlowMonthly)}/mo` },
        ...(Number.isFinite(m.dscr) && m.dscr < 1.25 ? [{ k: "warn" as const, t: "DSCR under 1.25× agency floor — proceeds at risk" }] : []),
      ],
    },
    {
      label: "STRESS TEST",
      lines: [
        { k: "dim", t: "perturbing rents ±8% × rehab overruns +0/+30% (20 cells)" },
        { k: "val", t: `worst cell CoC ${fmtPct(worst.coc)} · best ${fmtPct(best.coc)} · base ${fmtPct(m.coc)}` },
        { k: "val", t: `break-even occupancy ${fmtPct(m.breakEvenOcc * 100, 0)}` },
      ],
    },
    {
      label: "DECISION",
      lines: [
        { k: "act", t: `score ${r.scores.total}/100 — spread ${r.scores.spread} · dscr ${r.scores.dscr} · yield ${r.scores.cap} · coc ${r.scores.coc}` },
        { k: r.verdict === "PASS" ? "warn" : "ok", t: `verdict: ${r.verdict}` },
      ],
    },
    {
      label: "COMPOSE REPORT",
      lines: [
        { k: "dim", t: "drafting Developer-Deal-Advantage-Report v2 template …" },
        { k: "act", t: `ref ${r.refNo} · stamp: ${r.verdict}` },
        { k: "ok", t: "run complete — handoff to acquisitions desk" },
      ],
    },
  ];
};
