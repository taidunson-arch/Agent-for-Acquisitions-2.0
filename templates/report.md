<!-- Developer Deal Advantage Report template. Follow docs/REPORT_STYLE.md.
     {{placeholders}} are filled from the engine output (results.json), the lever re-runs (levers.json) and cited sources only.
     Keep the seven numbered section names: the agent contract and evals/grade.mjs look for them in this order. -->

# {{dealName}}: {{strategy}} · {{units}} units · {{market}}

Developer Deal Advantage Report · Prepared {{date}} · Engine {{engine}} · **{{status_line}}**
<!-- status_line example: "DRAFT: not for LOI until the conditions in the next steps are cleared" -->

## Executive summary

**{{recommendation}}**
<!-- Formula: action + price + condition. One sentence. -->

**Verdict: {{verdict}}.** {{verdict_basis}} <!-- If there is a hard stop, start the basis with "HARD STOP:". -->
Score before overrides {{score}}/100 (STRONG ADVANTAGE ≥ 72; PASS < 52).

**Why** <!-- Three MECE reasons. Each starts with a bolded claim and ends with its number. -->
1. **{{reason_1_claim}}** {{reason_1_evidence}}
2. **{{reason_2_claim}}** {{reason_2_evidence}}
3. **{{reason_3_claim}}** {{reason_3_evidence}}

**Decision required:** {{decision_required}}

**Exhibit 1: {{exhibit_1_title}}**
| Metric | Result | Test | Status |
|---|---|---|---|
| {{metric}} | {{value}} | {{threshold}} | Pass / Watch / Fail / Not tested |
*Source: {{engine}} results.json; {{other_sources}}.*

**Next steps**
| # | Action | Owner | By | Resolves |
|---|---|---|---|---|
| 1 | {{action}} | {{owner_role}} | {{deadline}} | {{open_item_and_dollar_impact}} |

---

## 1. Validated Inputs: {{action_title}}
<!-- e.g. "All 12 critical fields pass; three optional inputs are unsourced". Inputs table with a Source column. -->

## 2. Data Quality & Assumptions: {{action_title}}
<!-- Risk register exhibit: Risk | Impact if adverse (engine re-run) | How we will know | Mitigant. -->

## 3. Market Intel & Comps: {{action_title}}
<!-- Comps exhibit with source and date for each, or "No usable comps" and what that leaves unsupported. AMI/rent-limit exhibit with source. -->

## 4. Underwriting Calculations: {{action_title}}
<!-- Short key-figures exhibit first, then "Calculation trail": every metric with formula and calc from the engine. -->

## 5. Stress Matrix: {{action_title}}
<!-- 5x4 grid, rent change by rehab overrun. Each cell: DSCR / CoC / equity, then Pass or Fail. One-line reading below it. -->

## 6. Decision & Verdict: {{action_title}}
<!-- First line: "HARD STOP: <metric>" when one applies. Then the score components and anomalies. -->

## 7. Advantage Levers & Offer Strategy: {{action_title}}
<!-- Lever exhibit (each row an engine re-run), then the offer exhibit taken from the engine offer block:
     opening / target / walk-away, the binding constraint, and the downside and stretch cases. -->

---

## Appendix
A. Glossary · B. Scenario detail · C. Verification log (only checks actually run, with URL and timestamp)
