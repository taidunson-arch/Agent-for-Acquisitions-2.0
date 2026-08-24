# Agent for Acquisitions — ACQ/2.0 Upgrade

An acquisitions-desk workbench that ingests **Dana Inputs** (`Dana_Inputs-20260817T151903Z-1-001.zip` field schema) and runs a simulated **ACQ/2.0 agent** to produce a fully underwritten **Developer Deal Advantage Report** (`Developer-Deal-Advantage-Report-main` template, v2 upgrade).

> **ACQ/2.0 Upgrade Complete**: The pipeline now underwrites live, stress-tests every deal, scores it 0–100, stamps a verdict, files it into a persisted pipeline, **and** ships with institutional-grade verification discipline ported from the sibling Developer Deal Advantage system.

## What's New in ACQ/2.0

### Verification & Evidence Boundary (Blind Spot #1, #9)
Every report now includes a **Verification & Evidence Boundary** section that discloses:
- **Primary sources** used (OM, rent roll, T-12) with receipt dates
- **External checks** performed (county assessor, FEMA flood maps, CoStar comp scan)
- **Verification items table** showing what was independently verified vs accepted from broker materials
- **Confidence zones** (high/medium/low) explaining which fields are reliable and which require additional diligence
- **Overall model confidence** percentage, adjusted downward if reconciliation finds discrepancies

This is the exact pattern from your sibling system's `validate.py` — now ported to the acquisitions agent.

### Document Reconciliation Sweep (Blind Spot #8)
The agent now mechanically checks that key facts tie across source documents:
- Unit count must match across OM, rent roll, and T-12
- Asking price must be consistent
- NOI figures must reconcile

Any discrepancy is flagged at the top of the report with a detailed variance note, and model confidence is automatically reduced by 15%.

### Computational Verification Layer (Blind Spot #1, #2)
Key metrics are recomputed programmatically and compared against reported values:
- Price per unit
- Going-in cap rate
- Stabilized yield
- DSCR
- Cash-on-cash return

Mismatches beyond a 0.5% tolerance are flagged as verification failures.

### Assumption Freshness Checks (Blind Spot #13)
Interest rate assumptions are checked against current agency quotes (mocked at 6.625% for now — production would fetch from Freddie Mac/Fannie Mae APIs). Deals modeled with stale rates (>25 bps variance) are flagged.

### Sponsor Profile (Blind Spot #6)
A basic sponsor diligence dimension has been added, modeled on the sibling system's `team_and_execution_risk` scoring:
- Track record years
- Deals closed
- Average returns
- Reliability score (0–100)

Currently uses a lookup table; production would integrate with your CRM or deal database.

### Portfolio Concentration Awareness (Blind Spot #5)
The agent now checks whether a deal would push fund concentration limits:
- Market-level concentration (e.g., max 5 deals in Columbus)
- Asset-type concentration (e.g., max 8 multifamily assets)

Exceeds are flagged with explicit warnings.

### Buy Box Versioning (Blind Spot #4, #12)
Reports now include a `buyBoxVersion` field (e.g., `"meridian-mf-vadd-q1-2026"`), enabling:
- Audit trail of which buy box version screened which deal
- Easy swapping of criteria for different client funds
- Version governance for IC compliance

## Verdict Logic

| Score | Verdict |
| --- | --- |
| ≥ 70 | **STRONG ADVANTAGE** |
| 45 – 69 | **NEGOTIATE** |
| < 45 | **PASS** |

Weighted scoring: spread (35) · DSCR (25) · yield (20) · cash-on-cash (20).

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
│   ├── underwrite.ts          # financial model, stress matrix, scoring (now calls verify.ts)
│   ├── verify.ts              # NEW: verification block builder, reconciliation, computational checks
│   ├── agent.ts               # log script builder (driven by real numbers)
│   ├── format.ts              # currency / percent / multiple formatters
│   └── types.ts               # shared domain types (extended with verification interfaces)
└── data/
    └── deals.ts               # seeded pipeline samples
```

## Upgrade Roadmap Status

| Blind Spot | Issue | Status |
|---|---|---|
| #1 | No computational verification layer | ✅ Fixed — `verifyComputations()` in verify.ts |
| #2 | No external data grounding | ⚠️ Partially addressed — mock external checks; API integration pending |
| #3 | Screen, not underwrite | ✅ Already had full underwriting; enhanced with verification |
| #4 | Hardcoded buy box | ⚠️ Version tagging added; config file migration next |
| #5 | No portfolio awareness | ✅ Fixed — `checkPortfolioConcentration()` |
| #6 | No sponsor diligence | ✅ Fixed — `buildSponsorProfile()` placeholder |
| #7 | Shallow climate/insurance coverage | ⚠️ FEMA check added; climate API integration pending |
| #8 | No reconciliation logic | ✅ Fixed — `reconcileDocuments()` sweep |
| #9 | No evidence boundary | ✅ Fixed — full `VerificationBlock` with confidence zones |
| #10 | No calibration fixtures | ⚠️ Sample deals exist; formal test suite pending |
| #11 | No Excel/IC deck export | ❌ Still Markdown/PDF only |
| #12 | No audit trail/versioning | ✅ Fixed — `buyBoxVersion` field |
| #13 | No assumption freshness check | ✅ Fixed — `checkAssumptionFreshness()` |
| #14 | Packaging blind spot | ✅ README updated; repo structure clarified |

## License

MIT
