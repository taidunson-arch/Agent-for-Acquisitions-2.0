# Before/after: ACQ/2.0 (current repo) vs v4.1

The comparison is between the underwriting engine currently in the repo (src/lib/underwrite.ts, snapshot in baseline/src-lib-snapshot/) and the v4.1 engine (tools/underwrite.mjs). Both were run on the same 12 eval cases, written in the Dana schema. Reproduce with: node baseline/compare_engines.mjs (raw output is in baseline/compare_results.json).

## Results

| Case | Required by your v3 rules | Before (repo) | After (v4.1) |
|---|---|---|---|
| 01 clean | NEGOTIATE (score 58) | NEGOTIATE | NEGOTIATE |
| 02 negative NOI (confirmed) | PASS, hard stop | NEGOTIATE (no dollar-opex field, so negative NOI can't be represented) | PASS |
| 03 DSCR 0.76x | PASS, hard stop | PASS | PASS |
| 04 equity > available | PASS, hard stop | NEGOTIATE (no available-equity concept) | PASS |
| 05 askingPrice missing | HALT | **CRASH** (toLocaleString of undefined) | HALT |
| 06 rent entered annual (17,400) | HALT, ask | **STRONG ADVANTAGE** | HALT |
| 07 LIHTC, sources > cost | CoC undefined, flagged | NEGOTIATE (no LIHTC; LIHTC fields ignored) | NEGOTIATE, CoC undefined with reason |
| 08 cap far above market | anomaly, scored | STRONG ADVANTAGE, no flag | STRONG ADVANTAGE + cap_rate_high flag |
| 09 expense ratio > 100% | HALT | NEGOTIATE (can't see dollar opex) | HALT |
| 10 LIHTC funding gap | PASS, hard stop | NEGOTIATE | PASS |
| 11 rate entered 0.0625 | HALT | **STRONG ADVANTAGE** (validateInputs flags it, underwrite() runs anyway) | HALT |
| 12 identity fields missing | proceed with placeholders | NEGOTIATE (but validateInputs rejects it) | NEGOTIATE + placeholders |

**Matches the required behavior: before 5/12, after 12/12.** The expected answers come from the v4 engine, so the 12/12 is partly circular. The before-engine failures are independent of that: they are crashes, wrong verdicts on bad input, and hard stops that the old engine has no way to represent.

## Integrity problems in the current repo (more serious than the scores)
1. **The external checks in every report are fabricated.** buildVerification() hard-codes "County Assessor: Parcel ID verified, ownership confirmed", "FEMA: No AE/VE zones detected" (or "Zone X" when the market name contains Houston/Austin) and "CoStar Comp Scan: N comps". None of these lookups is ever performed.
2. **Comps are invented.** buildComps() makes up 4 addresses, prices and cap rates from a seeded RNG keyed to the deal id.
3. **Confidence is random.** 0.78 + rng x 0.15, seeded by deal id. Every Columbus test deal scored 0.828.
4. **The reconciliation sweep can't fail.** OM, rent roll and T-12 are all set to the same inputs, so it always reports "All sources tie".
5. **The computational check is a stub.** It only recomputes price/unit; the going-in cap check is commented as future work.
6. **The sponsor profile comes from the first word of the deal name.** Fund concentration uses mock holdings, and the "current agency rate" is a constant 6.625%.
7. **Math quirks:**
   - The metric labeled "goingInCap" is NOI/all-in, while the buy box defines it as NOI/price.
   - The ceiling has a hidden floor of 0.55 x ask.
   - Break-even occupancy is clamped at 100%, which hides deals that can't break even.
   - The loan grows automatically with rehab overruns.
   - Infinity, -Infinity, NaN and -999 are used as sentinel values.
8. **The README and the code disagree.** README weights are 35/25/20/20 with bands 70/45; the code uses 30/25/25/20 with bands 72/52.
9. **Repo hygiene.** node_modules/ and dist/ are committed; the tree API truncates because of them.

## What v4.1 changes
- **Dana DealInputs are the native contract** (same names, whole-percent units), so the web app and the agent can share one engine. Optional extensions add what affordable deals need: availableEquity, opexAnnual, softSources, deferredDevFee, lihtc, amiRentLimit, marketCapRate and sourced comps.
- **Validation:**
  - Every critical field halts with a reason.
  - Unit ambiguity (annual rent, decimal percents) halts and asks instead of being converted silently.
  - Identity fields get a "[not provided]" placeholder instead of being rejected.
- **No fabricated data.** There are no comps unless they're supplied with a source, the verification block is empty unless the agent records real checks, and there is no confidence score.
- **Hard stops** (NOI < 0, DSCR < 1, equity > available) force PASS. Outliers are flagged and scored, not auto-failed. The old "ask more than 8% above ceiling → PASS" rule is now an anomaly flag.
- **Every metric carries its formula and the calculation with numbers filled in.** Undefined metrics carry a reason, never Infinity/NaN/-999.
- **Agent config:**
  - progress line after every step, checkpoints, and per-step tool budgets
  - no repeated calls
  - a halt is written as output instead of waiting for an answer
  - writes pre-authorized only to runs/** and reports/** on branch agent/runs
  - the verification-honesty rule

## Still open
- **Live agent A/B.** This means v3 vs v4 running as agents (an LLM doing the work), as opposed to the engine comparison above. It needs an Anthropic API key where the agents run; the procedure is in evals/grade.mjs.
- **An Ashford Park eval case** built from the real Dana pack (OM PDF, rent roll and T-12 xlsx, comps CSVs). Python or a spreadsheet parser is needed to extract it properly.
- **Owner decisions:** which weights/bands are canonical; whether to wire the web app to the v4 engine (port to src/lib as TS); whether to remove node_modules/dist from git.
