# Agent for Acquisitions — ACQ/2.0 Upgrade

An acquisitions-desk workbench that ingests **Dana Inputs** (`Dana_Inputs-20260817T151903Z-1-001.zip` field schema) and runs a simulated **ACQ/2.0 agent** to produce a fully underwritten **Developer Deal Advantage Report** (`Developer-Deal-Advantage-Report-main` template, v2 upgrade).

> **v4 (branch agent/v4):** one shared underwriting engine for the web app and the autonomous agent, no fabricated data, hard-stop rules, and an eval set with a before/after comparison. Target user: national affordable-housing developers.

## What changed in v4

### One engine, two consumers
- `src/lib/engine.mjs` is the single source of underwriting math. It has no dependencies and no Node APIs.
- Offers (v4.2) are capped by every price constraint that applies: the DSCR 1.25x floor, the price the stated `availableEquity` can fund (`equity_supported_offer`), and the asking price. Walk-away is the lowest of these, the target is 96% of it and the opening is 92%. `offer.binding_constraint` names the one that binds. The engine never recommends paying above the ask or a price the capital stack can't fund.
- `node tools/export_xlsx.mjs <deal.json> --out model.xlsx [--levers levers.json] [--ami ami_rents.json]` writes an Excel audit workbook. Every engine metric, the score, verdict, offer and the 20-cell stress grid are recomputed with live Excel formulas from named input cells (blue = input, black = formula, green = engine), and each has an OK/CHECK status against the engine. Checked in Excel on all 8 eval cases that underwrite: every check agrees.
- The web app (`src/lib/underwrite.ts`) and the agent CLI (`node tools/underwrite.mjs deal.json`) both call it, so their numbers can't drift apart.
- Every metric comes back with its formula and the calculation with numbers filled in. A metric that can't be computed returns `null` plus a reason, never `Infinity`, `NaN` or `-999`.

### No fabricated evidence
v2 generated comps from a seeded RNG, produced a random-looking "model confidence", and printed external checks that were never performed (County Assessor "verified", FEMA "no AE/VE zones", CoStar comp scan). v4 removes all of these:
- Comps appear only when supplied with a `source`.
- Confidence reads **Not computed**.
- The Verification section lists only checks that actually ran. Everything else is marked *not performed*.

### Dana Inputs contract
- The original 17 `DealInputs` fields are unchanged; percents are whole numbers.
- Only critical fields block a run. Identity fields fall back to `[not provided]`.
- Ambiguous units halt and ask instead of being converted silently: rent above 15,000/mo looks annual, and percents below 1 look like decimals.
- Optional extensions for affordable deals: `availableEquity`, `opexAnnual`, `softSources`, `deferredDevFee`, `lihtc`, `amiRentLimit`, `marketCapRate`, `comps[]`.

### Decision rules
- **Hard stops force PASS** regardless of score: NOI < 0, DSCR < 1.00x, or equity required > `availableEquity`.
- Outliers (cap rate far from market, rent above the AMI limit, ask more than 8% above the ceiling) are flagged and scored, never auto-failed.
- The loan is sized on the base budget, so rehab overruns in the stress matrix are funded with equity.
- Break-even occupancy is no longer clamped at 100%.
- "Going-in cap" now means NOI / price. NOI / all-in is reported separately as `yieldOnAllIn`.

### Evals and before/after
- `evals/` holds 12 cases in the Dana schema (pass, hard stops, halts, LIHTC, anomaly, placeholders), the expected outputs, and a grader for agent runs.
- `node baseline/compare_engines.mjs` runs the v2 engine (snapshot) and the v4 engine on the same cases. Result: **v2 5/12, v4 12/12.** v2 crashed on a missing price and returned STRONG ADVANTAGE on annual rent and on a decimal interest rate.
- Full findings are in `docs/V4_COMPARISON.md`.

### Agent
`agent.v4.yaml` is the agent definition:
- a progress line after every step, checkpoints, and per-step tool budgets
- no repeated calls
- a halt is written as an output instead of waiting for an answer
- writes pre-authorized only to `runs/**` and `reports/**` on branch `agent/runs`
- a verification-honesty rule

## Verdict Logic

| Score | Verdict |
| --- | --- |
| ≥ 72 | **STRONG ADVANTAGE** |
| 52 – 71 | **NEGOTIATE** |
| < 52 | **PASS** |

Weighted scoring (owner-confirmed): spread 30 · DSCR 25 · stabilized yield 25 · cash-on-cash 20. Undefined components are dropped and the remaining weights renormalized. Hard stops override the score.

## Tech Stack

React 18 · TypeScript · Vite 6 · Tailwind CSS 4 · Framer Motion · Recharts-ready architecture · Barlow Condensed / IBM Plex Sans / IBM Plex Mono

## Run Locally

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run typecheck  # strict TS check
```

## Publish to GitHub

```bash
git init
git add .
git commit -m "ACQ/2.0: Dana Inputs intake → Developer Deal Advantage Report + verification layers"
git branch -M main
git remote add origin https://github.com/<you>/Agent-for-Acquisitions.git
git push -u origin main
```

## Publish to GitHub Pages (optional)

A workflow is included at `.github/workflows/deploy.yml`. After the first push:

1. In the repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Push to `main` — the workflow builds with Vite and deploys `dist/` automatically.

> If the repo is **not** a user/organization site (`<you>.github.io`), set `base: '/<repo-name>/'` in `vite.config.js` so asset paths resolve under Pages.

## Project Structure

```
src/
├── App.tsx                    # desk layout, run state machine, persistence
├── components/
│   ├── IntakeForm.tsx         # Dana Inputs feed form + validation
│   ├── AgentConsole.tsx       # live agent log stream + step checklist
│   ├── Report.tsx             # Developer Deal Advantage Report sheet (now with verification sections)
│   ├── Pipeline.tsx           # deal-file rail with verdict scoring
│   └── ui.tsx                 # reveal, count-up, ledger UI, inline SVG icons
├── lib/
│   ├── engine.mjs             # v4 shared underwriting engine (app + agent)
│   ├── engine.d.mts           # engine types
│   ├── underwrite.ts          # maps engine output to the Report view model
│   ├── agent.ts               # log script builder (driven by real numbers)
│   ├── format.ts              # currency / percent / multiple formatters
│   └── types.ts               # shared domain types (extended with verification interfaces)
└── data/
    └── deals.ts               # seeded pipeline samples
```

## Upgrade Roadmap Status

The v2 roadmap marked several blind spots as "fixed" (computational verification, reconciliation, external grounding). Those implementations were mocks. See `docs/V4_COMPARISON.md` for what v4 actually implements and what is still open (live agent A/B, an eval case built from the Ashford Park document pack, real external data sources).
