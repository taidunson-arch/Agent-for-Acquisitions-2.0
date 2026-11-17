# Developer Deal Advantage Report: Riverside Commons (4% LIHTC acq/rehab)

**Deal:** 88 River Rd, Fresno, CA · 80 units · multifamily · 4% LIHTC acquisition/rehab  
**Engine:** acq2-underwrite v4.1 (tools/underwrite.mjs) · **Generated:** 2026-11-17T15:42:48.917Z  
**Verdict:** **PASS** (score 76/100, overridden by hard stop)

> **Top-line flags (read first)**
> 1. **HARD STOP: equity.** Equity required is $1,916,800 against $1,500,000 available, a gap of $416,800. The deal scores 76, so the only thing keeping it out of STRONG ADVANTAGE is how it is funded.
> 2. **The 130% basis boost may be overstated.** The intake applies it to all $12,000,000 of eligible basis. For an existing building the boost probably reaches only the rehab spend (see Data Quality). If so, LIHTC equity falls to $4,646,400 and the gap grows to $1,261,600.
> 3. **Rent compliance is not confirmed.** At HUD FY2026 60% AMI, the max gross rent for a 1-bedroom in the Fresno HMFA is $1,092, before the utility allowance. The current average rent is $1,100. If most units are 1-bedroom, current rents are over the limit. A unit mix is needed.
> 4. **No OM, rent roll or T-12 was supplied.** Every input is taken from the intake file as given.

## 1. Validated Inputs

Engine validation status: **ok**. No blocking fields. Percent fields are whole percents; rent is per unit per month.

| Field | Value | Field | Value |
|---|---|---|---|
| Asking price | $9,000,000 | Rehab budget | $4,000,000 |
| Units | 80 | Current rent | $1,100/mo |
| Market rent | $1,150/mo | Vacancy | 5% |
| Opex ratio (of EGI) | 43% | Ancillary | 2% |
| Closing costs | 2% | Loan (LTC on all-in) | 40% |
| Rate / amortization | 5.75% / 35 yr | ARV | [not provided] |
| Available equity | $1,500,000 | Soft sources | $500,000 |
| Market cap rate | 5.5% (unsourced, from intake) | AMI rent limit (intake) | $1180 (unsourced, bedroom size not stated) |
| LIHTC | 4% · eligible basis $12,000,000 · applicable fraction 1 · boost 130% · price $0.88 |  |  |

## 2. Data Quality & Assumptions

- **Source documents:** none. The intake comes from evals/cases/10_lihtc_gap.json (demo intake; no OM / rent roll / T-12 supplied). With no rent roll or T-12, there is nothing to cross-check units, rents or opex against.
- **Engine warning:** arv not provided; 70%-rule MAO undefined and ceiling uses DSCR-supported offer only.
- **Engine warning:** no sourced comps supplied; comp-dependent items (price/unit benchmark, offer anchor) unsupported.
- **Basis boost scope (material, unverified).** The intake applies the 130% boost to the full $12,000,000. My reading of IRC §42(d)(5)(B) is that, for an *existing* building, the boost applies to rehabilitation expenditures, not to acquisition basis. I could not pull the statute text in this run; LII returned only amendment notes. **A LIHTC consultant must confirm this.** Scenario K re-runs the engine with acquisition basis unboosted ($8,000,000) and rehab basis boosted ($4,000,000 x 1.3).
- **QCT/DDA status not established.** The address "88 River Rd" could not be geocoded to a census tract or ZIP in this run. Without a QCT or DDA there is no boost at all (scenario B).
- **The bond test changed in 2025.** Pub. L. 119-21 §70422(b)(1) replaced the old 50% rule in §42(h)(4)(B) (LII amendment note, fetched 2026-11-17 15:29 UTC). The replacement is widely reported as a 25% threshold for bonds issued after 2025. I confirmed the amendment but did not retrieve the new text. **Counsel must confirm.**
- **Unit mix missing.** AMI compliance depends on bedroom count. The intake limit of $1180 does not match any single HUD 60% gross limit for this area (see section 3).
- **Opex** is 43% of EGI, inside the affordable band of 40–55%. It is not checked against a T-12.
- **Market cap rate** of 5.5% comes from the intake with no source given. It is used only for the anomaly check.
- **Budget:** all steps finished within their tool-call budgets. Market intel used about 12 of its 30 calls.

## 3. Market Intel & Comps

**Comps: No usable comps.** The repo has no `data/comps/` and web search is not configured on this host. None were made up. These items are therefore **unsupported**: the price/unit benchmark ($112,500/unit), the GRM benchmark (8.52), and a comp-based offer anchor.

**HUD FY2026 MTSP 60% income and rent limits: Fresno, CA HMFA** (MFI $91,300, effective 2026-05-01). Source: huduser.gov HERA-Income-Limits-Report-FY26.rtf, downloaded 2026-11-17 07:27 PST; a copy is in `runs/riverside-commons/sources/`.

| Bedrooms | Imputed household | 60% income limit | Max gross rent (60% AMI) | Calc |
|---|---|---|---|---|
| 0 | 1 | $40,800 | **$1,020** | $40,800 x 30% / 12 |
| 1 | 1.5 | $43,710 | **$1,092** | $43,710 x 30% / 12 |
| 2 | 3 | $52,440 | **$1,311** | $52,440 x 30% / 12 |
| 3 | 4.5 | $60,600 | **$1,515** | $60,600 x 30% / 12 |
| 4 | 6 | $67,620 | **$1,690** | $67,620 x 30% / 12 |

Gross rent includes the utility allowance. Current average rent is $1,100 and market rent is $1,150. Both fit under the 2-bedroom limit but exceed the 1-bedroom limit. The intake figure of $1180 looks like a net limit, or a blended figure across unit sizes. It needs a source.

## 4. Underwriting Calculations

| Metric | Value | Formula | Calc |
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
| mao70 | undefined (ARV not provided) | 0.70 x ARV - rehab |  |
| ceiling | $13,296,837 | max(MAO70, supported offer) | $13,296,837 |
| spread_pct | 47.74% | (ceiling - ask) / ask | ($13,296,837 - $9,000,000) / $9,000,000 = 47.74% |
| price_per_unit | $112,500 | ask / units | $9,000,000 / 80 = $112,500 |
| grm | 8.52 | ask / GPR (annual) | $9,000,000 / $1,056,000 = 8.52 |
| breakeven_occ_pct | 73.36% | (opex + ADS) / (GPR x (1 + anc%)) | ($440,004 + $350,167) / $1,077,120 = 73.36% |
| rent_gap_pct | 4.55% | (marketRent - currentRent) / currentRent | 4.55% |

## 5. Stress Matrix

Each cell shows DSCR / cash-on-cash / equity required. The loan is sized on the base budget, so rehab overruns are funded with equity. A cell **survives** if DSCR is 1.25x or better and equity required is no more than $1,500,000.

| Rent / Rehab | +0% | +10% | +20% | +30% |
|---|---|---|---|---|
| -8% | 1.53x / 9.7% / $1,916,800 ❌ | 1.53x / 8.0% / $2,316,800 ❌ | 1.53x / 6.9% / $2,716,800 ❌ | 1.53x / 6.0% / $3,116,800 ❌ |
| -4% | 1.60x / 10.9% / $1,916,800 ❌ | 1.60x / 9.1% / $2,316,800 ❌ | 1.60x / 7.7% / $2,716,800 ❌ | 1.60x / 6.7% / $3,116,800 ❌ |
| +0% | 1.67x / 12.2% / $1,916,800 ❌ | 1.67x / 10.1% / $2,316,800 ❌ | 1.67x / 8.6% / $2,716,800 ❌ | 1.67x / 7.5% / $3,116,800 ❌ |
| +4% | 1.73x / 13.4% / $1,916,800 ❌ | 1.73x / 11.1% / $2,316,800 ❌ | 1.73x / 9.4% / $2,716,800 ❌ | 1.73x / 8.2% / $3,116,800 ❌ |
| +8% | 1.80x / 14.6% / $1,916,800 ❌ | 1.80x / 12.1% / $2,316,800 ❌ | 1.80x / 10.3% / $2,716,800 ❌ | 1.80x / 9.0% / $3,116,800 ❌ |

**Reading:** debt service holds in every cell (lowest DSCR 1.53x at rent -8%). **No cell survives on equity.** The deal fails on funding, not on cash flow. Each +10% rehab overrun adds $400,000 of equity.

## 6. Decision & Verdict

**HARD STOP: equity required $1,916,800 > available $1,500,000.** Verdict: **PASS**.

- Score before the hard stop: **76** (STRONG ADVANTAGE band is 72 or above). Components: spread 100 (weight 30), DSCR 100 (25), stabilized yield 4 (25), CoC 100 (20).
- The weak component is stabilized yield on cost, 4.63% against a 5.5% market cap. That is typical of LIHTC acquisition/rehab, where credit equity rather than NOI pays for the rehab. Consider whether this component should be weighted differently for credit deals.
- Anomalies: none flagged by the engine. The engine checked AMI against the unsourced $1180 limit, so the 1-bedroom risk in section 3 is not in its anomaly list.
- Break-even occupancy is 73.36%, which leaves plenty of operating margin.

**Plain answer:** at the current capital stack, decline. The deal is worth pursuing only if (a) a consultant confirms the boost scope and QCT/DDA status, and (b) one of the levers below closes the gap.

## 7. Advantage Levers & Offer Strategy

Every row is a full engine re-run (`runs/riverside-commons/levers.mjs` -> `levers.json`).

| Scenario | Verdict | Score | DSCR | LIHTC equity | Equity req. | CoC | Hard stop |
|---|---|---|---|---|---|---|---|
| A. Base case (as submitted) | PASS | 76 | 1.67x | $5,491,200 | $1,916,800 | 12.16% | yes |
| B. No 130% basis boost (site not in QCT/DDA) | PASS | 71 | 1.67x | $4,224,000 | $3,184,000 | 7.32% | yes |
| C. Price cut to clear equity stop | STRONG ADVANTAGE | 78 | 1.76x | $5,491,200 | $1,499,416 | 16.78% | – |
| D. Raise loan LTC to clear equity stop | STRONG ADVANTAGE | 76 | 1.54x | $5,491,200 | $1,498,994 | 13.70% | – |
| E. Loan LTC 48% (headroom) | NEGOTIATE | 66 | 1.39x | $5,491,200 | $862,400 | 18.91% | – |
| F. Add soft sources equal to gap | STRONG ADVANTAGE | 76 | 1.67x | $5,491,200 | $1,500,000 | 15.54% | – |
| G. Defer developer fee equal to gap | STRONG ADVANTAGE | 76 | 1.67x | $5,491,200 | $1,500,000 | 15.54% | – |
| H. No boost + LTC at 1.25x max | PASS | 38 | 1.25x | $4,224,000 | $1,431,060 | 8.15% | – |
| I. Loan LTC 50% (bonds ~50% of all-in; legacy 50% test) | NEGOTIATE | 56 | 1.33x | $5,491,200 | $598,800 | 24.31% | – |
| J. Rehab +20% overrun, loan resized on new budget | PASS | 73 | 1.57x | $5,491,200 | $2,396,800 | 8.84% | yes |
| K. Boost on rehab basis only (acq basis unboosted) | PASS | 73 | 1.67x | $4,646,400 | $2,761,600 | 8.44% | yes |
| L. K + loan LTC at 1.25x max | PASS | 41 | 1.25x | $4,646,400 | $1,008,660 | 11.57% | – |

**Levers, best first (assuming the full boost is confirmed):**
1. **Upsize the bond loan to 43.17% LTC** ($5,689,806). This clears the equity stop at 1.54x DSCR and gives STRONG ADVANTAGE (76). Debt capacity allows up to 53.3% LTC at 1.25x. Going to 48–50% also clears it, but the score falls to NEGOTIATE (66/56) as DSCR thins.
2. **Defer $416,800 of developer fee** (G) or **add $416,800 of soft funds** (F). Either clears the stop with no change to debt; STRONG ADVANTAGE 76.
3. **Cut the price to $8,318,000** (C). This clears the stop at 1.76x DSCR; STRONG ADVANTAGE 78.

**If the boost covers rehab only (K):** the gap grows to $1,261,600. Upsizing the loan to the 1.25x maximum clears equity, but the score falls to 41 (PASS). The workable lever is price: the engine finds **$6,938,000** clears equity at 1.98x DSCR (STRONG ADVANTAGE, 82).

**Bond test:** the base loan is 40% of all-in cost, a stand-in for aggregate basis, which is not supplied. That fails the old 50% test. It passes a 25% test if the post-2025 threshold applies and the whole loan is tax-exempt. Reaching 50% would take about 50% LTC (scenario I: 1.33x DSCR, NEGOTIATE 56). **Counsel or the LIHTC consultant must confirm, using actual aggregate basis.**

**Offer strategy**
- **Overriding the engine offer block.** The engine suggests opening at $12,233,090 with walk-away at $13,296,837. Those figures are above the ask, because the DSCR-supported price ignores the equity constraint, which is what actually binds here. They are not usable.
- **Opening offer: $6,938,000.** This is the price that clears equity with current sources even under the conservative boost reading.
- **Target: $8,318,000.** This clears equity with current sources if the full boost is confirmed.
- **Walk-away: $9,000,000 (the ask).** Go this high only if the full boost is confirmed *and* a bond-loan upsize to 43.17% LTC or a deferred fee is committed in writing.
- **Basis:** engine equity math only. No comps support the anchor. Before the LOI, get a rent roll, T-12, unit mix, QCT/DDA confirmation and a consultant memo on the basis boost.

### Verification & Evidence (checks actually performed in this run)
- HUD FY2026 MTSP income limits, Fresno CA HMFA: huduser.gov/portal/datasets/mtsp/mtsp26/HERA-Income-Limits-Report-FY26.rtf (2026-11-17 07:27 PST). ✅
- IRC §42(h)(4)(B) amendment by Pub. L. 119-21 §70422(b)(1): law.cornell.edu/uscode/text/26/42 (2026-11-17 15:29 UTC). Amendment confirmed, new text not retrieved. ⚠️
- QCT/DDA status: **not performed** (address could not be geocoded).
- Comps: **not performed** (no data source available).
- No confidence percentage is given because none was computed.
