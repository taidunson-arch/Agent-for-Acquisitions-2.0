# Riverside Commons: 4% LIHTC acquisition/rehab · 80 units · Fresno, CA

Developer Deal Advantage Report · Prepared 2026-11-17 · Engine acq2-underwrite v4.2 · **DRAFT: not for LOI until next steps 1–3 are cleared**

## Executive summary

**Do not proceed at the $9.00M ask. Re-trade with an opening offer of $7.65M and a walk-away of $8.32M, conditional on three diligence items (next steps 1–3).**

**Verdict: PASS. HARD STOP: equity required $1,916,800 > available $1,500,000.** Score before the override: 76/100 (STRONG ADVANTAGE ≥ 72; PASS < 52).

**Why**

1. **Funding, not the property, blocks the deal.** The capital stack is $417K short of available equity. In-place NOI covers debt service 1.67x, and coverage stays at 1.53x or better in all 20 stress cases.
2. **Tax-credit equity could fall by $845K.** If the 130% basis boost covers rehab costs only, the gap widens to $1.26M and the walk-away drops to $6.94M.
3. **Rent compliance is unproven.** HUD's FY2026 60% AMI gross rent limit for a 1-bedroom is $1,092; the average rent is $1,100. We need the unit mix to know how many units are affected.

**Decision required:** Approve a re-trade between $7.65M and $8.32M and fund the three pre-LOI diligence items. Do not submit an LOI at the ask.

**Exhibit 1: The deal passes every operating test and fails the funding test**

| Metric | Result | Test | Status |
|---|---|---|---|
| DSCR, in place | 1.67x | ≥ 1.25x | Pass |
| DSCR, worst of 20 stress cases | 1.53x | ≥ 1.25x | Pass |
| Break-even occupancy | 73.4% | ≤ 85.0% | Pass |
| Sponsor equity required | $1.92M | ≤ $1.50M available | **Fail** |
| Stabilized yield on cost | 4.63% | vs 5.50% market cap (unsourced) | Watch |
| Average rent vs 1BR 60% AMI gross limit | $1,100 vs $1,092 | ≤ limit | Watch (unit mix unknown) |
| Sourced sales comps | None | ≥ 3 comps | Not tested |

*Source: acq2-underwrite v4.2 results.json; HUD FY2026 MTSP income limits (Fresno, CA HMFA). Break-even test is the engine anomaly threshold.*

**Next steps**

| # | Action | Owner | By | Resolves |
|---|---|---|---|---|
| 1 | Obtain the rent roll with unit mix and utility allowances | Acquisitions analyst | Before LOI | Rent compliance against the $1,092 1BR limit |
| 2 | Commission a LIHTC consultant memo on basis-boost scope and QCT/DDA status | Development lead | Before LOI | Up to $845K of credit equity; walk-away $8.32M vs $6.94M |
| 3 | Obtain the T-12 and 3–5 sourced sales comps | Acquisitions analyst | Before LOI | The 43% opex assumption; a market anchor for price |
| 4 | Request a lender term sheet at 43.17% LTC | Finance lead | Before LOI | Stretch walk-away of $9.00M |
| 5 | Confirm the bond-test threshold against actual aggregate basis | Tax counsel | Before bond application | 25% vs 50% test (see section 7) |

*Owners are suggested roles.*

---

## 1. Validated Inputs: All 12 critical fields pass validation, but no source document supports them yet

The engine returned status **ok** with no blocking fields. The intake came without an OM, rent roll or T-12, so every value below is as submitted.

**Exhibit 2: Every input is taken from the intake file; four that drive value have no named source**

| Input | Value | Source |
|---|---|---|
| Asking price | $9,000,000 | Intake |
| Rehab budget | $4,000,000 | Intake (no contractor bid) |
| Units | 80 | Intake (no rent roll) |
| Average rent, current / market | $1,100 / $1,150 per month | Intake (no rent roll) |
| Vacancy / ancillary income | 5% / 2% | Intake |
| Opex | 43% of EGI | **Unsourced** (no T-12) |
| Closing costs | 2% of price | Intake |
| Senior loan | 40% LTC · 5.75% · 35-yr amortization | Intake (no term sheet) |
| Available equity / soft sources | $1,500,000 / $500,000 | Intake |
| LIHTC | 4% credit · $12,000,000 eligible basis · 130% boost · $0.88 credit price | **Unsourced** (boost scope disputed, section 2) |
| Market cap rate | 5.50% | **Unsourced** |
| AMI rent limit | $1,180 | **Unsourced** (bedroom size not stated) |
| ARV | [not provided] | n/a |

*Source: `runs/riverside-commons/inputs.json`; engine validate().*

## 2. Data Quality & Assumptions: The tax-credit assumptions, not operations, carry the largest risk

**Exhibit 3: Each open item has a priced downside**

| Risk | Impact if adverse (engine re-run) | How we will know | Mitigant |
|---|---|---|---|
| Basis boost applies to rehab costs only | Credit equity −$845K; gap $1.26M; walk-away $6.94M | LIHTC consultant memo | Price at the downside walk-away, or add soft funds |
| Site is not in a QCT or DDA (no boost) | Credit equity −$1.27M; gap $1.68M; walk-away $6.25M | HUD QCT/DDA lookup by census tract and ZIP | Walk away, or find new soft sources |
| 1-bedroom rents exceed the 60% AMI limit | Rents must fall to the limit, less the utility allowance; not modeled until the unit mix is known | Rent roll and utility allowances | Re-underwrite at compliant rents before LOI |
| Rehab overruns by 20% | Equity +$800K (loan stays sized on the base budget) | Contractor bids and a physical needs assessment | Hold a contingency; get a fixed-price contract |
| Opex ratio understates real costs | Not modeled; each point of opex ratio lowers NOI | T-12 | Re-run on actual T-12 opex |

*Source: acq2-underwrite v4.2, `runs/riverside-commons/results.json`, `levers.json`, `06b_conservative_price.json`.*

Other data-quality notes:

- Engine warning: arv not provided; 70%-rule MAO undefined and ceiling uses DSCR-supported offer only.
- Engine warning: no sourced comps supplied; comp-dependent items (price/unit benchmark, offer anchor) unsupported.
- **Boost scope is my reading, not confirmed.** For an *existing* building, IRC §42(d)(5)(B) appears to apply the 130% boost to rehabilitation expenditures, not to acquisition basis. I could not retrieve the statute text in this run.
- **Bond test changed in 2025.** Pub. L. 119-21 §70422(b)(1) replaced the 50% rule in §42(h)(4)(B). The new threshold is reported as 25%; the new text was not retrieved.
- **QCT/DDA status is unknown.** The address "88 River Rd" could not be matched to a census tract or ZIP.

## 3. Market Intel & Comps: HUD limits put 1-bedroom rents at risk, and no sourced comps support the price

**Exhibit 4: Current rents fit the 2-bedroom limit but exceed the 1-bedroom limit**

| Bedrooms | Imputed household | 60% AMI income limit ($) | Max gross rent ($/mo) |
|---|---:|---:|---:|
| 0 | 1 | 40,800 | 1,020 |
| 1 | 1.5 | 43,710 | **1,092** |
| 2 | 3 | 52,440 | 1,311 |
| 3 | 4.5 | 60,600 | 1,515 |
| 4 | 6 | 67,620 | 1,690 |

*Source: HUD FY2026 MTSP income limits, Fresno, CA HMFA (MFI $91,300, effective 2026-05-01), HERA-Income-Limits-Report-FY26.rtf, downloaded 2026-11-17. Note: gross rent includes the utility allowance; max rent = 30% x income limit / 12 at 1.5 persons per bedroom.*

**No usable comps.** The repo has no `data/comps/` and web search is not configured, so no comps were found. None were invented. The price per unit ($112,500) and GRM (8.52) are reported without a benchmark.

## 4. Underwriting Calculations: In-place NOI of $583K covers debt service 1.67x, but sponsor equity is $417K short

**Exhibit 5: Tax credits and the bond loan fund 82% of cost; the sponsor share is $417K more than available**

| Uses | $M | % of total |  | Sources | $M | % of total |
|---|---|---|---|---|---|---|
| Purchase price | $9.00M | 68.3% |  | Senior loan (40% LTC) | $5.27M | 40.0% |
| Closing costs | $0.18M | 1.4% |  | LIHTC equity | $5.49M | 41.7% |
| Rehab | $4.00M | 30.3% |  | Soft sources | $0.50M | 3.8% |
|  |  |  |  | Sponsor equity required | **$1.92M** | 14.5% |
| **Total uses** | **$13.18M** | 100.0% |  | **Total sources** | **$13.18M** | 100.0% |

*Source: acq2-underwrite v4.2 results.json. Note: available sponsor equity is $1.50M, a gap of $417K. Deferred developer fee: none assumed.*

**Exhibit 6: Operations comfortably carry the debt**

| Line item | $K per year |
|---|---:|
| Gross potential rent | $1,056K |
| Less vacancy (5%) | ($53K) |
| Plus ancillary income | $20K |
| Effective gross income | $1,023K |
| Less operating expenses (43%) | ($440K) |
| **Net operating income** | **$583K** |
| Less debt service | ($350K) |
| **Cash flow after debt service** | **$233K** |
| DSCR | 1.67x |
| Cash-on-cash return | 12.2% |

*Source: acq2-underwrite v4.2, `runs/riverside-commons/results.json`.*

**Calculation trail.** Every metric with the engine formula and worked calculation:

| Metric | Value | Formula | Calculation |
|---|---|---|---|
| closing_costs | $180,000 | askingPrice x closingCostPct | $9,000,000 x 2% = $180,000 |
| all_in | $13,180,000 | askingPrice + closing + rehab | $9,000,000 + $180,000 + $4,000,000 = $13,180,000 |
| gpr | $1,056,000 | units x currentRent x 12 | 80 x $1,100 x 12 = $1,056,000 |
| vacancy_loss | $52,800 | GPR x vacancyPct | $1,056,000 x 5% = $52,800 |
| ancillary | $20,064 | (GPR - vacancy) x ancillaryPct | ($1,056,000 - $52,800) x 2% = $20,064 |
| egi | $1,023,264 | GPR - vacancy + ancillary | $1,056,000 - $52,800 + $20,064 = $1,023,264 |
| opex | $440,004 | EGI x opexRatioPct | $1,023,264 x 43% = $440,004 |
| noi | $583,260 | EGI - opex | $1,023,264 - $440,004 = $583,260 |
| going_in_cap_pct | 6.48% | NOI / askingPrice | $583,260 / $9,000,000 = 6.48% |
| yield_on_all_in_pct | 4.43% | NOI / all-in | $583,260 / $13,180,000 = 4.43% |
| stab_noi | $609,772 | units x marketRent x 12 x (1-vac) x (1+anc) - opex | $609,772 |
| stab_cap_pct | 4.63% | stabNOI / all-in (yield on cost) | $609,772 / $13,180,000 = 4.63% |
| loan | $5,272,000 | base all-in x ltvPct | $13,180,000 x 40% = $5,272,000 |
| ads | $350,167 | loan x r/(1-(1+r)^-n) x 12; r = ratePct/1200, n = amortYears x 12 | $5,272,000 @ 5.75% / 35yr = $350,167 |
| dscr | 1.67x | NOI / ADS | $583,260 / $350,167 = 1.666x |
| lihtc_equity | $5,491,200 | eligibleBasis x boost x applicableFraction x creditRate x 10 x creditPrice | $12,000,000 x 1.3 x 1 x 0.04 x 10 x 0.88 = $5,491,200 |
| equity_required | $1,916,800 | all-in - loan - softSources - LIHTC equity - deferredDevFee | $13,180,000 - $5,272,000 - $500,000 - $5,491,200 - $0 = $1,916,800 |
| cash_flow | $233,094 | NOI - ADS | $583,260 - $350,167 = $233,094 |
| coc_pct | 12.16% | cash flow / equity required | $233,094 / $1,916,800 = 12.16% |
| supported_offer | $13,296,837 | ((NOI / (floor x 12 x PI_per_$)) / LTC - rehab) / (1 + closing%) | maxLoan $7,025,109 at 1.25x -> price $13,296,837 |
| equity_supported_offer | $8,318,954 | ((availableEquity + soft + LIHTC + DDF) / (1 - LTC) - rehab) / (1 + closing%) | (($1,500,000 + $500,000 + $5,491,200 + $0) / 0.6 - $4,000,000) / 1.02 = $8,318,954 |
| mao70 | n/a (ARV not provided) | 0.70 x ARV - rehab |  |
| ceiling | $13,296,837 | max(MAO70, supported offer) | $13,296,837 |
| spread_pct | 47.74% | (ceiling - ask) / ask | ($13,296,837 - $9,000,000) / $9,000,000 = 47.74% |
| price_per_unit | $112,500 | ask / units | $9,000,000 / 80 = $112,500 |
| grm | 8.52 | ask / GPR (annual) | $9,000,000 / $1,056,000 = 8.52 |
| breakeven_occ_pct | 73.36% | (opex + ADS) / (GPR x (1 + anc%)) | ($440,004 + $350,167) / $1,077,120 = 73.36% |
| rent_gap_pct | 4.55% | (marketRent - currentRent) / currentRent | 4.55% |

*Source: acq2-underwrite v4.2, `runs/riverside-commons/results.json`.*

## 5. Stress Matrix: Debt holds in all 20 cases; available equity covers none of them

**Exhibit 7: Coverage never drops below 1.53x, but every case needs more than $1.50M of equity**

| Rent change ↓ / Rehab overrun → | +0% | +10% | +20% | +30% |
|---|---|---|---|---|
| -8% | 1.53x · 9.7% · $1.92M · Fail | 1.53x · 8.0% · $2.32M · Fail | 1.53x · 6.9% · $2.72M · Fail | 1.53x · 6.0% · $3.12M · Fail |
| -4% | 1.60x · 10.9% · $1.92M · Fail | 1.60x · 9.1% · $2.32M · Fail | 1.60x · 7.7% · $2.72M · Fail | 1.60x · 6.7% · $3.12M · Fail |
| +0% | 1.67x · 12.2% · $1.92M · Fail | 1.67x · 10.1% · $2.32M · Fail | 1.67x · 8.6% · $2.72M · Fail | 1.67x · 7.5% · $3.12M · Fail |
| +4% | 1.73x · 13.4% · $1.92M · Fail | 1.73x · 11.1% · $2.32M · Fail | 1.73x · 9.4% · $2.72M · Fail | 1.73x · 8.2% · $3.12M · Fail |
| +8% | 1.80x · 14.6% · $1.92M · Fail | 1.80x · 12.1% · $2.32M · Fail | 1.80x · 10.3% · $2.72M · Fail | 1.80x · 9.0% · $3.12M · Fail |

*Source: acq2-underwrite v4.2 stress grid. Each cell: DSCR · cash-on-cash · equity required · status. Pass = DSCR ≥ 1.25x and equity ≤ $1.50M. The loan is sized on the base budget, so overruns are equity-funded.*

**Reading:** the deal fails on funding, not cash flow. Each 10% rehab overrun adds $400K of equity.

## 6. Decision & Verdict: The equity hard stop forces PASS despite a score of 76

**HARD STOP: equity required $1,916,800 > available $1,500,000.** Verdict: **PASS**.

**Exhibit 8: Three of four score components are maxed; stabilized yield is the weak point**

| Component | Weight | Score (0–100) | Driver |
|---|---:|---:|---:|
| Spread | 30% | 100 | Spread 47.7% (DSCR-supported ceiling vs ask) |
| DSCR | 25% | 100 | DSCR 1.67x |
| Stabilized yield | 25% | 4 | Yield on cost 4.63% |
| Cash-on-cash | 20% | 100 | Cash-on-cash 12.2% |
| **Total** | 100% | **76** | STRONG ADVANTAGE band ≥ 72 |

*Source: acq2-underwrite v4.2, `runs/riverside-commons/results.json`.*

- **Anomalies:** none flagged by the engine. The engine's AMI check used the unsourced $1,180 limit, so the 1-bedroom risk from section 3 is not in its anomaly list.
- **Calibration note:** low yield on cost is typical of LIHTC acquisition/rehab, where credit equity pays for the rehab. The weight on this component may need to change for credit deals.

## 7. Advantage Levers & Offer Strategy: Four levers close the $417K gap; only a deeper price cut also survives the downside case

**Exhibit 9: Each lever clears the hard stop on its own if the full boost is confirmed**

| Lever | Change | Verdict | Score | DSCR | Equity required |
|---|---|---|---|---|---|
| Upsize the bond loan | 40% → 43.17% LTC ($5.69M) | STRONG ADVANTAGE | 76 | 1.54x | $1.50M |
| Defer developer fee | $417K deferred | STRONG ADVANTAGE | 76 | 1.67x | $1.50M |
| Add soft funds | +$417K | STRONG ADVANTAGE | 76 | 1.67x | $1.50M |
| Cut the price | $9.00M → $8.32M | STRONG ADVANTAGE | 78 | 1.76x | $1.50M |
| *Downside: boost on rehab only* | *Loan to 1.25x maximum (53.3% LTC)* | *PASS* | *41* | *1.25x* | *$1.01M* |
| *Downside: boost on rehab only* | *Price to $6.94M* | *STRONG ADVANTAGE* | *82* | *1.98x* | *$1.50M* |

*Source: engine re-runs, `runs/riverside-commons/levers.mjs` → `levers.json`. Each row is a full re-underwrite; all 12 scenarios are in Appendix B.*

**Exhibit 10: The engine sets the walk-away at $8.32M, the most current equity can fund**

| Case | Opening ($M) | Target ($M) | Walk-away ($M) | Binding constraint |
|---|---|---|---|---|
| **Base: as submitted** | **$7.65M** | **$7.99M** | **$8.32M** | Available equity |
| Downside: boost on rehab only | $6.38M | $6.66M | $6.94M | Available equity |
| Stretch: loan at 43.17% LTC | $8.28M | $8.64M | $9.00M | Asking price |

*Source: acq2-underwrite v4.2 offer block (walk-away = lowest of the DSCR, equity and ask limits; target 96%, opening 92%). Base limits: DSCR $13.30M, equity $8.32M, ask $9.00M. LOI figures: opening $7,653,438, walk-away $8,318,954.*

**How to use it**

- **Open at $7.65M.** This price is fundable today without any lever.
- **Hold at $8.32M.** Above that price the equity hard stop returns.
- **Drop to $6.94M if the consultant confirms the boost covers rehab only.** That is the only lever that survives this case at an acceptable score.
- **Go to the $9.00M ask only with a written lender commitment at 43.17% LTC.**
- **Bond test:** the loan is 40% of all-in cost (a stand-in for aggregate basis). That fails the old 50% test and passes 25%, if the 25% threshold applies and the whole loan is tax-exempt. Reaching 50% takes about 50% LTC (1.33x DSCR, score 56). Counsel must confirm.

---

## Appendix

### A. Glossary

| Term | Meaning |
|---|---|
| DSCR | Debt service coverage ratio: NOI divided by annual debt service. Lenders typically require 1.25x or more. |
| LTC | Loan-to-cost: loan as a share of total cost (price + closing + rehab). |
| AMI / MTSP | Area median income. HUD publishes the Multifamily Tax Subsidy Project income limits that set LIHTC rents. |
| LIHTC (4%) | Low-Income Housing Tax Credit, paired with tax-exempt bonds. Equity = eligible basis x boost x applicable fraction x 4% x 10 years x credit price. |
| Basis boost | A 130% increase in eligible basis for projects in a QCT or DDA. |
| QCT / DDA | Qualified Census Tract / Difficult Development Area, designated annually by HUD. |
| Hard stop | A rule that forces PASS whatever the score: NOI < 0, DSCR < 1.00x, or equity required > available. |
| Walk-away | The highest price the engine supports: the lowest of the DSCR, equity and ask limits. |

### B. Scenario detail

| Scenario | Verdict | Score | DSCR | LIHTC equity | Equity required | Cash-on-cash | Walk-away |
|---|---|---|---|---|---|---|---|
| A. Base case (as submitted) | PASS | 76 | 1.67x | $5.49M | $1.92M | 12.2% | $8.32M |
| B. No 130% basis boost (site not in QCT/DDA) | PASS | 71 | 1.67x | $4.22M | $3.18M | 7.3% | $6.25M |
| C. Price cut to clear equity stop | STRONG ADVANTAGE | 78 | 1.76x | $5.49M | $1.50M | 16.8% | $8.32M |
| D. Raise loan LTC to clear equity stop | STRONG ADVANTAGE | 76 | 1.54x | $5.49M | $1.50M | 13.7% | $9.00M |
| E. Loan LTC 48% (headroom) | NEGOTIATE | 66 | 1.39x | $5.49M | $0.86M | 18.9% | $9.00M |
| F. Add soft sources equal to gap | STRONG ADVANTAGE | 76 | 1.67x | $5.49M | $1.50M | 15.5% | $9.00M |
| G. Defer developer fee equal to gap | STRONG ADVANTAGE | 76 | 1.67x | $5.49M | $1.50M | 15.5% | $9.00M |
| H. No boost + LTC at 1.25x max | PASS | 38 | 1.25x | $4.22M | $1.43M | 8.2% | $9.00M |
| I. Loan LTC 50% (bonds ~50% of all-in; legacy 50% test) | NEGOTIATE | 56 | 1.33x | $5.49M | $0.60M | 24.3% | $9.00M |
| J. Rehab +20% overrun, loan resized on new budget | PASS | 73 | 1.57x | $5.49M | $2.40M | 8.8% | $7.53M |
| K. Boost on rehab basis only (acq basis unboosted) | PASS | 73 | 1.67x | $4.65M | $2.76M | 8.4% | $6.94M |
| L. K + loan LTC at 1.25x max | PASS | 41 | 1.25x | $4.65M | $1.01M | 11.6% | $9.00M |

*Source: `runs/riverside-commons/levers.json`.*

### C. Verification log (checks actually run in this run)

| Check | Source | When | Result |
|---|---|---|---|
| HUD FY2026 MTSP limits, Fresno CA HMFA | huduser.gov/portal/datasets/mtsp/mtsp26/HERA-Income-Limits-Report-FY26.rtf | 2026-11-17 07:27 PST | Retrieved; copy in `runs/riverside-commons/sources/` |
| §42(h)(4)(B) amendment, Pub. L. 119-21 §70422(b)(1) | law.cornell.edu/uscode/text/26/42 | 2026-11-17 15:29 UTC | Amendment confirmed; new text not retrieved |
| QCT/DDA status | n/a | n/a | Not performed: address not geocoded |
| Sales comps | n/a | n/a | Not performed: no data source |

No confidence percentage is stated because none was computed.

### D. Reproduce

`node tools/underwrite.mjs runs/riverside-commons/inputs.json --out runs/riverside-commons/results.json`, then `node runs/riverside-commons/levers.mjs`, `node runs/riverside-commons/ami_rents.mjs` and `node runs/riverside-commons/compose.mjs`.

*Prepared under the Acquisitions Desk Agent v4 run contract (`agent.v4.yaml`) in house style (`docs/REPORT_STYLE.md`). This run was executed by the OpenClaw main agent, not the configured model. Generated 2026-11-17T16:01:31.822Z.*
