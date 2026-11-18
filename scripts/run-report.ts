/**
 * Headless runner for the ACQ/2.0 agent.
 *
 * Feeds one or more scenario input sets through the same `underwrite()` engine the
 * desk UI uses, replays the agent console script, and writes a Markdown
 * Developer Deal Advantage Report plus the raw Report JSON.
 *
 * Usage (bundled with esbuild, see package.json "report" script):
 *   npm run report -- reports/eastgate-station/scenarios.json
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { underwrite, validateInputs } from "../src/lib/underwrite";
import { buildScript, AGENT_VERSION } from "../src/lib/agent";
import { fmtK, fmtPct, fmtUSD, fmtX } from "../src/lib/format";
import type { DealInputs, Report } from "../src/lib/types";

interface ScenarioFile {
  deal: string;
  notes?: string[];
  common: Partial<DealInputs>;
  scenarios: { key: string; label: string; description?: string; inputs: Partial<DealInputs> }[];
}

const file = process.argv[2];
if (!file) {
  console.error("usage: run-report <scenarios.json>");
  process.exit(1);
}
const path = resolve(file);
const spec: ScenarioFile = JSON.parse(readFileSync(path, "utf8"));
const outDir = dirname(path);
mkdirSync(outDir, { recursive: true });

const runs = spec.scenarios.map((s) => {
  const inputs = { ...spec.common, ...s.inputs, id: `${spec.common.id ?? "deal"}-${s.key}` } as DealInputs;
  const errors = validateInputs(inputs);
  const report = underwrite(inputs);
  return { ...s, inputs, errors, report, script: buildScript(report) };
});

/* ---------------- markdown helpers ---------------- */
const row = (cells: (string | number)[]) => `| ${cells.join(" | ")} |`;
const table = (head: string[], rows: (string | number)[][]) =>
  [row(head), row(head.map(() => "---")), ...rows.map(row)].join("\n");
const pct = (n: number, dp = 1) => fmtPct(n, dp);
const money = (n: number) => fmtUSD(n);

const sectionsFor = (r: Report, errors: Record<string, string | undefined>, label: string, description?: string): string => {
  const i = r.inputs;
  const m = r.m;
  const out: string[] = [];
  out.push(`## Scenario: ${label}`);
  if (description) out.push(description);
  out.push(`Ref ${r.refNo} · buy box ${r.buyBoxVersion} · model confidence ${pct(r.confidence * 100, 0)}`);

  const errKeys = Object.keys(errors).filter((k) => errors[k]);
  if (errKeys.length) {
    out.push(`> Intake validation: the desk form would reject this scenario on ${errKeys.map((k) => `${k} (${errors[k]})`).join(", ")}. Run forced through the engine for completeness.`);
  }

  out.push(`### 01 Verdict`);
  out.push(`**${r.verdict}** — score ${r.scores.total}/100 (spread ${r.scores.spread} · DSCR ${r.scores.dscr} · yield ${r.scores.cap} · CoC ${r.scores.coc})`);
  out.push(r.verdictLine);

  out.push(`### 02 Basis & Terms`);
  out.push(
    table(
      ["Item", "Value"],
      [
        ["Asking price", money(i.askingPrice)],
        ["Price per unit", money(m.pricePerUnit)],
        ["Closing costs", `${money(m.closingCosts)} (${pct(i.closingCostPct)})`],
        ["Capital budget", money(m.rehab)],
        ["All-in basis", money(m.allIn)],
        ["Debt", `${money(m.loan)} @ ${pct(i.ratePct, 3)} / ${i.amortYears}-yr amort · LTC ${pct(i.ltvPct)}`],
        ["Equity", money(m.equity)],
        ["ARV (restricted value)", money(i.arv)],
        ["GRM", Number.isFinite(m.grm) ? m.grm.toFixed(1) : "—"],
      ]
    )
  );

  out.push(`### 03 Income Ledger — Year 1`);
  out.push(
    table(
      ["Line", "Annual"],
      [
        [`Potential gross income (${i.units} × ${money(i.currentRent)} × 12)`, money(m.pgi)],
        [`Vacancy & credit loss (${pct(i.vacancyPct, 0)})`, `(${money(m.vacancyLoss)})`],
        [`Ancillary income (${pct(i.ancillaryPct, 0)})`, money(m.ancillary)],
        ["Effective gross income", money(m.egi)],
        [`Operating expenses (${pct(i.opexRatioPct)} of EGI · ${money(m.opex / i.units)}/unit)`, `(${money(m.opex)})`],
        ["Net operating income", `**${money(m.noi)}**`],
        ["Annual debt service", `(${money(m.ads)})`],
        ["Cash flow after debt service", `**${money(m.cashFlowAnnual)}** (${money(m.cashFlowMonthly)}/mo)`],
      ]
    )
  );

  out.push(`### 04 Returns & Coverage`);
  out.push(
    table(
      ["Metric", "Value"],
      [
        ["Going-in cap (NOI / all-in)", pct(m.goingInCap)],
        ["Stabilized NOI / cap", `${money(m.stabNOI)} / ${pct(m.stabCap)}`],
        ["DSCR", fmtX(m.dscr)],
        ["Cash-on-cash", pct(m.coc)],
        ["Break-even occupancy", pct(m.breakEvenOcc * 100, 0)],
        ["Rent gap to stabilized", pct(m.rentGapPct)],
        ["MAO (70% ARV − capex)", money(m.mao70)],
        ["DSCR-supported offer (1.25×)", Number.isFinite(m.supportedOffer) ? money(m.supportedOffer) : "n/a"],
        ["Support ceiling", money(m.ceiling)],
        ["Spread to ask", `${money(m.spread)} (${pct(m.spreadPct)})`],
      ]
    )
  );

  out.push(`### 05 Stress Matrix — Cash-on-cash % (rows: rent Δ · cols: capex overrun)`);
  out.push(
    table(
      ["Rent Δ \\ Capex", ...r.rehabDeltas.map((d) => `+${Math.round(d * 100)}%`)],
      r.matrix.map((cells, ri) => [
        `${r.rentDeltas[ri] >= 0 ? "+" : ""}${Math.round(r.rentDeltas[ri] * 100)}%`,
        ...cells.map((c) => `${c.coc.toFixed(1)}% / ${fmtX(c.dscr)}`),
      ])
    )
  );

  out.push(`### 06 Advantage Levers`);
  if (!r.levers.length) out.push("No levers triggered.");
  for (const l of r.levers) out.push(`- **${l.title}** (${l.kind}) — ${l.detail} _${l.impact}_`);

  out.push(`### 07 Offer Strategy`);
  out.push(
    table(
      ["Step", "Amount"],
      [
        ["Opening", money(r.offer.opening)],
        ["Target", money(r.offer.target)],
        ["Hard ceiling", money(r.offer.ceiling)],
        ["Credits requested", money(r.offer.credits)],
      ]
    )
  );

  out.push(`### 08 Comp Set (engine-generated placeholder — see overlay for real comps)`);
  out.push(table(["Address", "Dist (mi)", "$/unit", "Cap", "Period"], r.comps.map((c) => [c.address, c.distanceMi, money(c.pricePerUnit), pct(c.cap), c.period])));

  out.push(`### 09 Agent Memo`);
  for (const p of r.narrative) out.push(p);

  if (r.verification) {
    const v = r.verification;
    out.push(`### 10 Verification & Evidence Boundary`);
    out.push(`Overall model confidence: **${pct(v.overallConfidence * 100, 0)}**`);
    out.push(table(["Item", "Status", "Source", "Note"], v.items.map((x) => [x.item, x.status, x.source, x.note ?? ""])));
    out.push(table(["External check", "Result"], v.externalChecks.map((x) => [x.source, x.result])));
    out.push(table(["Confidence zone", "Fields", "Reason"], v.confidenceZones.map((z) => [z.zone, z.fields.join(", "), z.reason])));
  }
  if (r.reconciliation) {
    out.push(`### 11 Document Reconciliation`);
    out.push(table(["Field", "OM", "Rent roll", "T-12", "Ties"], r.reconciliation.map((x) => [x.field, String(x.omValue), String(x.rentRollValue), String(x.t12Value), x.matches ? "yes" : `no — ${x.discrepancy}`])));
  }
  if (r.assumptionFreshness?.length) {
    out.push(`### 12 Assumption Freshness`);
    out.push(table(["Assumption", "Modeled", "Current agency", "Stale"], r.assumptionFreshness.map((a) => [a.assumption, pct(a.modeledValue, 3), pct(a.currentValue, 3), a.stale ? "yes" : "no"])));
  }
  if (r.sponsor) out.push(`### 13 Sponsor Profile\n${r.sponsor.name}: ${r.sponsor.notes ?? ""}`);
  if (r.portfolioConcentration) {
    out.push(`### 14 Portfolio Concentration`);
    out.push(table(["Scope", "Count after close", "Limit", "Within"], r.portfolioConcentration.map((p) => [p.market, p.currentCount, p.fundLimit ?? "—", p.withinLimit ? "yes" : p.note ?? "no"])));
  }
  return out.join("\n\n");
};

const consoleFor = (steps: ReturnType<typeof buildScript>): string =>
  steps.map((s) => `[${s.label}]\n${s.lines.map((l) => `  ${l.k.padEnd(4)} ${l.t}`).join("\n")}`).join("\n");

/* ---------------- compose ---------------- */
const base = runs[0];
const md: string[] = [];
md.push(`# Developer Deal Advantage Report — ${spec.deal}`);
md.push(`Generated ${new Date().toISOString()} by ${AGENT_VERSION} (headless run). Address: ${base.inputs.address}. Market: ${base.inputs.market}.`);
if (spec.notes?.length) {
  md.push(`## Inputs & Assumptions`);
  md.push(spec.notes.map((n) => `- ${n}`).join("\n"));
}
md.push(`## Scenario Summary`);
md.push(
  table(
    ["Scenario", "Verdict", "Score", "NOI", "Going-in cap", "DSCR", "CoC", "CF after DS", "Ceiling", "Spread"],
    runs.map((x) => [
      x.label,
      x.report.verdict,
      x.report.scores.total,
      fmtK(x.report.m.noi),
      pct(x.report.m.goingInCap),
      fmtX(x.report.m.dscr),
      pct(x.report.m.coc),
      fmtK(x.report.m.cashFlowAnnual),
      fmtK(x.report.m.ceiling),
      pct(x.report.m.spreadPct, 0),
    ])
  )
);
for (const x of runs) md.push(sectionsFor(x.report, x.errors, x.label, x.description));
md.push(`## Agent Console — ${base.label}`);
md.push("```\n" + consoleFor(base.script) + "\n```");

const mdPath = join(outDir, "DDAR-agent-output.md");
writeFileSync(mdPath, md.join("\n\n") + "\n");
writeFileSync(join(outDir, "DDAR-agent-output.json"), JSON.stringify(runs.map((x) => ({ key: x.key, label: x.label, errors: x.errors, report: x.report })), null, 2));
console.log(`wrote ${mdPath}`);
for (const x of runs) console.log(`${x.key.padEnd(13)} ${x.report.verdict.padEnd(17)} score ${String(x.report.scores.total).padStart(3)}  NOI ${fmtK(x.report.m.noi).padStart(8)}  DSCR ${fmtX(x.report.m.dscr).padStart(7)}  CoC ${pct(x.report.m.coc).padStart(7)}  ceiling ${fmtK(x.report.m.ceiling)}`);
