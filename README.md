# Agent for Acquisitions — Dana Inputs → Developer Deal Advantage Report

An acquisitions-desk workbench that ingests **Dana Inputs** (`Dana_Inputs-20260817T151903Z-1-001.zip` field schema) and runs a simulated **ACQ/2.0 agent** to produce a fully underwritten **Developer Deal Advantage Report** (`Developer-Deal-Advantage-Report-main` template, v2 upgrade).

> Full codebase upgrade: the pipeline now underwrites live, stress-tests every deal, scores it 0–100, stamps a verdict, and files it into a persisted pipeline.

## What it does

1. **Dana Inputs intake** — 16-field deal feed (identity, pricing, operations, capital stack) with inline validation and live mini-metrics (70% MAO, spread vs ask, $/door, rent gap).
2. **Agent run (ACQ/2.0)** — timed 7-step pipeline with a live log console:
   `INGEST → MARKET INTEL → UNDERWRITE → CAPITAL STACK → STRESS TEST → DECISION → COMPOSE REPORT`
3. **Underwriting engine** — EGI/NOI ledger, going-in vs stabilized cap, DSCR-supported max offer vs a 1.25× agency floor, GRM, break-even occupancy, cash-on-cash, and a 20-cell rent × rehab stress matrix.
4. **Developer Deal Advantage Report** — memo-styled printable sheet: rubber-stamp verdict, score dial, income-statement bars, color-coded stress matrix, advantage levers, opening/target/ceiling offer strategy, comp table, and a three-paragraph agent memo. Print-to-PDF ready.
5. **Deal pipeline** — seeded sample files (including a PASS case for verdict variance), live re-scoring on run, localStorage persistence across sessions.

## Verdict logic

| Score | Verdict |
| --- | --- |
| ≥ 70 | **STRONG ADVANTAGE** |
| 45 – 69 | **NEGOTIATE** |
| < 45 | **PASS** |

Weighted scoring: spread (35) · DSCR (25) · yield (20) · cash-on-cash (20).

## Tech stack

React 18 · TypeScript · Vite 6 · Tailwind CSS 4 · Framer Motion · Recharts-ready architecture · Barlow Condensed / IBM Plex Sans / IBM Plex Mono

## Run locally

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
git commit -m "ACQ/2.0: Dana Inputs intake → Developer Deal Advantage Report"
git branch -M main
git remote add origin https://github.com/<you>/Agent-for-Acquisitions.git
git push -u origin main
```

## Publish to GitHub Pages (optional)

A workflow is included at `.github/workflows/deploy.yml`. After the first push:

1. In the repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Push to `main` — the workflow builds with Vite and deploys `dist/` automatically.

> If the repo is **not** a user/organization site (`<you>.github.io`), set `base: '/<repo-name>/'` in `vite.config.js` so asset paths resolve under Pages.

## Project structure

```
src/
├── App.tsx                    # desk layout, run state machine, persistence
├── components/
│   ├── IntakeForm.tsx         # Dana Inputs feed form + validation
│   ├── AgentConsole.tsx       # live agent log stream + step checklist
│   ├── Report.tsx             # Developer Deal Advantage Report sheet
│   ├── Pipeline.tsx           # deal-file rail with verdict scoring
│   └── ui.tsx                 # reveal, count-up, ledger UI, inline SVG icons
├── lib/
│   ├── underwrite.ts          # financial model, stress matrix, scoring
│   ├── agent.ts               # log script builder (driven by real numbers)
│   ├── format.ts              # currency / percent / multiple formatters
│   └── types.ts               # shared domain types
└── data/
    └── deals.ts               # seeded pipeline samples
```

## License

MIT
