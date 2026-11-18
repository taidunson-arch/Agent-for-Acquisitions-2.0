# Acquisition Report — Eastgate Station

**100 NE 120th Ave, Portland, OR 97220 · 61 units · built 2010 · LIHTC family community**
**Asking $3,936,580 ($64,534/unit) · SVN | Imbrie Realty (Bjorn Beer, Hugh Holtman)**

Prepared 2026-11-18 with the ACQ/2.0 agent (headless run of `src/lib/underwrite.ts`) plus an analyst overlay for the restricted-asset context the engine does not model. Companion files in this folder:

- `scenarios.json` — the exact inputs fed to the agent
- `DDAR-agent-output.md` / `.json` — the agent's full Developer Deal Advantage Report for all five scenarios
- Re-run with `npm run report -- reports/eastgate-station/scenarios.json`

---

## 1. Verdict

**CONDITIONAL PROCEED for a qualified affordable-housing operator. PASS for a conventional or value-add buyer.**

The agent stamps the base case **STRONG ADVANTAGE (100/100)** and the downside case **PASS (10/100)**. The spread between those two is the whole story: this deal lives or dies on actual collections, the Portland Housing Bureau loan terms, and whether the buyer can keep the property-tax exemption. None of those three facts were available to this run (see Evidence Boundary, section 9).

What the price really is:

| Component | Amount | Source |
|---|---|---|
| Portland Housing Bureau loan, 0%, assumed | ~$1,980,000 | Listing broker post (unverified) |
| NOAH loan, 2.75%, assumed | ~$1,250,000 | Listing broker post (unverified) |
| Cash to close (implied) | ~$706,580 | Ask minus assumed debt |
| **Asking price** | **$3,936,580** | LoopNet / Crexi |

The odd precision of the ask suggests a formula price (debt payoff plus exit costs), which is typical of a Year 15 LIHTC disposition. A 2010 placed-in-service date puts the 15-year compliance period ending in 2024/2025, which matches the timing.

---

## 2. Scenario results from the agent

All five scenarios were run through the unmodified `underwrite()` engine. Debt in the first four is modeled as the assumed balances ($3.23M, 72.8% of all-in) at a blended 1.064% over 30 years, which treats the PHB loan as amortizing (conservative). All-in basis is $4.43M (ask + 2.5% closing + $400K capital placeholder), so equity is ~$1.2M, not $700K.

| Scenario | Verdict | Score | NOI | Going-in cap | DSCR | Cash-on-cash | CF after debt |
|---|---|---|---|---|---|---|---|
| Base — assumed subsidized debt | STRONG ADVANTAGE | 100 | $364K | 8.2% | 2.89× | 19.7% | $238K |
| Downside — OHCS portfolio-average performance | PASS | 10 | $132K | 3.0% | 1.05× | 0.5% | $6K |
| Upside — PBV rents at payment standard | STRONG ADVANTAGE | 100 | $527K | 11.9% | 4.19× | 33.3% | $401K |
| Base, for-profit buyer loses tax exemption | STRONG ADVANTAGE | 88 | $263K | 5.9% | 2.09× | 11.4% | $138K |
| Counterfactual — 65% LTC agency debt at 6.625% | STRONG ADVANTAGE | 99 | $364K | 8.2% | 1.64× | 9.1% | $142K |

Key operating assumptions behind each row (no T-12 was available):

| Scenario | Avg collected rent | Economic loss | Opex / unit | Basis for assumption |
|---|---|---|---|---|
| Base | $1,400 | 8% | $9,806 | Blend of restricted rents below 60% AMI caps and 18 PBV units; OHCS FY24 opex $8,198 statewide, Portland Metro higher, plus two years of inflation |
| Downside | $1,150 | 10% | $10,500 | OHCS FY24 portfolio: NOI $3,441/unit, elevated Portland Metro vacancy and bad debt |
| Upside | $1,550 | 6% | $9,200 | PBV units at Home Forward reasonable rent (3BR FMR $2,809), tighter collections |
| Taxable | $1,400 | 8% | $11,440 | Base plus ~$100K/yr property tax on a $8M to $10M assessed value |
| Conventional | $1,400 | 8% | $9,806 | Same operations, market debt |

Stress matrix (base case): cash-on-cash stays between 16.6% and 22.1% across rents ±8% and capex overruns to +30%, and DSCR never drops below 2.59×. The cheap assumed debt makes the base case very hard to break. The downside case shows what does break it: a 20% revenue miss against the base takes DSCR to 1.05× even on 1% money.

---

## 3. Where the agent's output must be overridden

The engine was built for conventional value-add deals. Three of its outputs are wrong for this asset and must not be used as written:

1. **Offer strategy and ceiling.** The agent's base-case ceiling of $9.61M and "open at $8.84M" come from solving a 1.25× DSCR against a loan that grows with price at 1.064%. The assumed PHB and NOAH balances are fixed. Every dollar above $3.94M is cash equity at a 0% return on the restricted upside. **The real ceiling is the ask, and the real negotiation is on terms** (reserve transfer, PHB consent, seller credits for capital needs), not price.
2. **Verification block.** The engine's "T-12 actuals verified", "OM / rent roll / T-12 tie", and "county assessor verified" lines are template output. No source documents were available to this run. Treat the whole section 10 of the agent report as a checklist of work still to do.
3. **Comp set and levers.** Comps are synthetic placeholders generated around the subject's price per unit. The "expense recapture to 38%" lever does not apply: a 60%+ expense ratio is normal for a deeply restricted family property with low rents, not a management failure. Real comps are in section 6 below.

---

## 4. Property and restriction profile

| Item | Finding | Confidence |
|---|---|---|
| Units | 61 (16 × 1BR, 8 × 2BR, 29 × 3BR, 8 × 4BR) | High (two independent directories) |
| Year built | 2010 | High |
| Restricted units | 60 of 61 under LIHTC; likely a PHB regulatory agreement as well | High / Medium |
| Project-based vouchers | 18 units (Home Forward); 13 HUD-subsidized wheelchair-accessible units with I/DD priority | Medium (broker post, county page) |
| Waitlist | Managed by Home Forward; closed as of Oct 2026 | Medium |
| Management | Quantum Residential (one listing); Pinehurst Management (another) | Low, conflicting |
| Extended use period | Still in effect; Oregon deals of this vintage typically carry 60-year terms (to ~2070) | Medium, confirm in recorded declaration |
| Neighborhood | Hazelwood, East Portland; near the E 122nd Ave MAX Blue Line station | High |

**2026 LIHTC maximum gross rents, Portland MSA (4-person MFI $128,300):**

| AMI tier | 1BR | 2BR | 3BR | 4BR |
|---|---|---|---|---|
| 30% | $722 | $866 | $1,001 | $1,116 |
| 50% | $1,203 | $1,443 | $1,668 | $1,860 |
| 60% | $1,443 | $1,732 | $2,001 | $2,232 |

Hazelwood market rents are roughly $1,175 to $1,250 for a 1BR, $1,495 for a 2BR, and CBRE puts the East Portland average at $1,625 with 6.3% vacancy. The 60% caps therefore sit above market for 1BR and 2BR units, so **the binding constraint on revenue is the market and the deeper AMI tiers, not the 60% cap.** Advertised rents at the property of $905 to $1,174 for 1BRs imply 30% and 50% AMI units in the mix. Utility allowances reduce net rent further on the large units. The 18 PBV units are the exception: voucher-assisted units are exempt from the LIHTC gross rent cap and collect Home Forward's reasonable rent, which is the single largest revenue variable in the deal.

---

## 5. Why the price is low, and who it is right for

**Cheap for a reason**

- No path to market rents for the life of any realistic hold. Market-rate 2010 product in Portland trades near $200K/unit; the restriction removes that value and the exit market is mission buyers at restricted cap rates.
- Buyer must be approved by OHCS (ownership transfer under the declaration), PHB and NOAH (loan assumptions) and Home Forward (HAP contract assignment). These bodies generally require an experienced affordable operator.
- If the seller is a nonprofit using the ORS 307.540 exemption, a for-profit buyer loses it. That exemption also sunsets June 30, 2027 unless extended, which is a legislative risk for everyone.
- Portland Metro affordable operators are reporting rising bad debt, higher vacancy, and insurance up 24% in one year (OHCS 2026 portfolio analysis).

**Attractive for the right buyer**

- 61 newer family units for roughly $700K of equity plus capital needs, financed by 0% and 2.75% debt that cannot be replicated in a 6%+ market.
- Large-unit mix (37 of 61 units are 3BR or 4BR) is scarce and leases quickly in East Portland.
- 18 PBV units provide subsidy-backed collections.
- Even the agent's counterfactual with conventional 6.625% debt pencils at 1.64× DSCR and 9.1% cash-on-cash on base operations, so the deal is not purely a financing arbitrage.

**Who should bid:** a nonprofit or experienced affordable sponsor (or a for-profit with a nonprofit managing-member structure that preserves the tax exemption) with a Portland operating platform. **Who should not:** anyone underwriting rent growth, a market-rate exit, or a refinance into conventional debt.

---

## 6. Market context and real comparables

| Comparable | Type | Price / unit | Notes |
|---|---|---|---|
| Lincoln Woods, 2333 SE 130th Ave (70 units) | Restricted, LIHTC/PDC agreement to 2067 | $32,857 (asking) | Marketed as a distressed "basis play"; deeper restrictions and heavier capital needs than subject |
| Hazelwood Community Apartments, 11939 NE Davis St (1998) | Market / workforce | ~$90,000 (asking) | 0.8 mi from subject; shows East Portland unrestricted pricing floor |
| Roseway Annex, 4405 NE 82nd Ave (9 units) | Market | $140,000 (asking), 6.56% cap | Small vintage building, same ZIP |
| Portland metro median (Northmarq, mid-2026) | Market | $201,700 | Cap rate 5.9% YTD, up 40 bps YoY |
| Portland metro average (Kidder Mathews, Q3 2026) | Market | $197,487 | Cap rate 6.2% |

Read-through: at $64.5K/unit, Eastgate Station sits between the distressed restricted comp and the unrestricted East Portland floor. For a 2010 building with 18 PBVs, that is fair to slightly rich on price per unit, and the assumable debt is what makes it work.

---

## 7. Risk register

| # | Risk | Severity | Mitigation / diligence |
|---|---|---|---|
| 1 | Actual collections below base case (East Portland bad debt, elevated evictions) | High | T-12 and 24-month delinquency aging; PBV contract rents and HAP payment history |
| 2 | PHB loan amortizes or takes residual receipts rather than deferring | High | Loan agreement and regulatory agreement; model cash flow with 50% surplus cash split |
| 3 | Loss of property-tax exemption on transfer | High | Confirm current exemption basis; structure ownership to preserve it; price in $90K to $110K/yr if not |
| 4 | Capital needs exceed the $400K placeholder (16-year-old envelope, water heaters, HVAC, flooring) | Medium | PCNA; confirm replacement reserve balance that transfers at closing |
| 5 | Agency approvals delay or kill the assignment (OHCS, PHB, NOAH, Home Forward) | Medium | Pre-clear buyer qualifications before LOI; confirm assumption fees |
| 6 | Undisclosed nonprofit ROFR or LP exit terms behind the formula price | Medium | Request partnership agreement and any ROFR notice; confirm the seller can deliver fee title |
| 7 | Oregon rent cap (9.5% for 2026) and Portland relocation rules limit repositioning of under-market units | Low | Rents are already market-bound; cap matters only for PBV reasonable-rent resets |
| 8 | Insurance cost trajectory (+24% YoY in OHCS portfolio) | Medium | Bind quotes before going hard |
| 9 | ORS 307.540 exemption sunset June 30, 2027 | Low to Medium | Monitor 2027 session; historically extended |

---

## 8. Recommended path

1. **Pre-qualify the buyer entity** with PHB, NOAH, OHCS and Home Forward before spending on diligence. If the entity cannot hold the tax exemption and cannot assume the PHB loan, stop here.
2. **Obtain the OM, T-12, rent roll, HAP contract, both loan agreements, the recorded declaration/regulatory agreements, reserve statements and the most recent PCNA.** Re-run `npm run report` with actual figures replacing the estimates in `scenarios.json`.
3. **Negotiate terms, not price.** Target: transfer of the full replacement reserve, seller-funded PCNA items above $400K, PHB consent as a seller deliverable, and a closing timeline tied to agency approvals.
4. **Go/no-go gate:** proceed only if verified NOI exceeds roughly $260K (the taxable scenario) with the PHB loan confirmed as deferred or cash-flow contingent. Below ~$150K verified NOI the deal fails coverage on even 1% money and should be passed.

---

## 9. Evidence boundary

**Verified from two or more public sources:** address, unit count and mix, year built, LIHTC status, Home Forward waitlist, brokerage, asking price.

**Single-source (broker's public post), unverified:** PHB and NOAH loan balances and rates, 18 PBV units, $700K cash to close.

**Analyst estimates, not verified:** all rents, vacancy, opex, capital needs, ARV, and the ~2070 extended-use expiry. Model confidence is therefore low until the OM package is in hand, regardless of the 90% figure the engine prints.

**Not obtainable this session:** the LoopNet offering memorandum (CDN blocked cloud traffic), county assessor record, OHCS compliance record, Novogradac LIHTC database row.

---

## 10. Sources

- LoopNet listing 43088711 and Crexi listing (price, units, brokers)
- SVN | Imbrie Realty broker post (debt structure, PBV count, cash to close)
- Affordable Housing Hub and Affordable Housing Online property records (unit mix, LIHTC status, waitlist)
- Multnomah County affordable housing resource page (13 HUD-subsidized accessible units)
- Portland Housing Bureau 2026 income limits (4-person MFI $128,300)
- Northmarq Q2 2026, Kidder Mathews Q3 2026 and CBRE Q1/Q2 2026 Portland multifamily reports
- OHCS 2026 Portfolio Financial Analysis (FY21 to FY24 operating data)
- Oregon DAS 2026 rent stabilization notice (9.5% cap)
- ORS 307.540 to 307.548 and Portland City Code 3.101 (nonprofit low-income housing exemption)
- Showcase / CommercialCafe listings for Lincoln Woods, Hazelwood Community Apartments and Roseway Annex
