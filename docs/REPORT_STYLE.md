# Report Style Guide (Developer Deal Advantage Report)

This guide sets the house style for every report the agent writes. It follows the conventions top-tier strategy firms use for client documents, adapted to an investment-committee (IC) memo for affordable-housing acquisitions. `templates/report.md` is the skeleton; this file explains the rules behind it.

## Why this standard

| Principle | Origin | What it means here |
|---|---|---|
| **Answer first** (Pyramid Principle, BLUF) | Barbara Minto, McKinsey; U.S. military "Bottom Line Up Front" | The first screen states the recommendation, the verdict and the price. The evidence follows. |
| **Statements, not captions** | Minto: "Use statements not captions"; McKinsey calls the title the "lead" | Every section heading and exhibit title is a full-sentence claim a reader could disagree with. |
| **One message per exhibit** | Rasiel, *The McKinsey Way*: "one message per chart" | Each table proves one point. A second point gets a second exhibit. |
| **MECE reasoning** | Minto, McKinsey | The supporting reasons don't overlap and together cover the decision: capital, credits/compliance, operations. |
| **Titles alone tell the story** | "Horizontal flow" | Reading only the headings gives the recommendation and the reasons. |
| **Plain language** | U.S. Plain Writing Act / digital.gov | Short sentences, active voice, present tense, defined terms. |
| **Data-ink** | Edward Tufte | No decoration. Tables carry units, a source and only the columns needed. |

## The ten rules

1. **Executive summary first, one screen (≤ 300 words).** It contains, in order: the recommendation (one bolded sentence with a price), the verdict line, three MECE reasons, the decision required, and a next-steps table.
2. **Recommendation sentence formula:** *Action + price + condition.* Example: "Do not proceed at the $9.00M ask; re-trade at $7.65M opening / $8.32M walk-away, subject to three diligence items."
3. **Section headings = tracker + action title.** Keep the required section name (the grader and the agent contract look for it), then a colon, then the claim. Example: "## 5. Stress Matrix: Debt holds in all 20 cases; equity fails in all 20".
4. **Exhibit anatomy.** Every table is introduced as `**Exhibit N: <action title>**`, then the table, then a `*Source: …*` line, plus a `*Note: …*` line when needed. Units go in the column header (`$M`, `x`, `%`).
5. **Number formatting.**
   - Prices and totals in the narrative: `$8.32M`, `$417K`. Exact dollars appear in the calculation trail and wherever a number goes into an LOI.
   - Percentages: one decimal in the narrative (`73.4%`), two in the calculation trail.
   - DSCR to two decimals with an x (`1.67x`).
   - Negatives in parentheses in tables: `($82.8K)`.
   - Never NaN, Infinity, "-" or "TBD". Write the engine's undefined reason, or `n/a` with a note.
   - Round only for display. Every displayed number must trace to the engine output.
6. **Status words, not colors or emoji:** `Pass`, `Watch`, `Fail`, `Not tested`. Each comes with the threshold it was tested against.
7. **Quantify every risk.** Each risk shows its dollar or ratio impact (from an engine re-run), how we will know, and the mitigant. Don't use "significant", "robust" or "attractive" unless a number follows.
8. **Next steps are owned and dated:** action, owner (a role is fine), deadline (e.g. "before LOI"), and the open item it resolves.
9. **Evidence honesty.** "Verified" appears only in the Verification log, for checks actually run, with URL and timestamp. Unknown is written as unknown.
10. **Appendix holds the depth:** glossary, scenario detail, verification log. The body keeps one message per section.

## Pre-send checklist

- [ ] The executive summary fits one screen and starts with a bolded recommendation that includes a price.
- [ ] Reading only the headings gives the full argument.
- [ ] Every heading and exhibit title is a claim, not a label ("Market overview" fails; "HUD limits put 1-bedroom rents at risk" passes).
- [ ] Every exhibit has units and a source line.
- [ ] Every number traces to `results.json`, `levers.json` or a cited source.
- [ ] Hard stops appear in the first five lines and at the start of the Decision section.
- [ ] Next steps have an owner and a deadline.
- [ ] Banned in the body: "verified" (outside the log), "robust", "significant" without a number, "TBD", "NaN".

*Sources consulted 2026-11-17: Wikipedia, "Barbara Minto", "MECE principle", "BLUF (communication)"; StrategyU, "Action Titles" (quoting Minto, The Pyramid Principle, and Rasiel, The McKinsey Way); digital.gov Plain Language Guide, "Writing"; Edward Tufte, The Visual Display of Quantitative Information.*
