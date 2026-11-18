"""Gateway land feasibility test: 375 vs 561 LIHTC units on the 6.44-acre NE 97th & Couch assemblage.
Run: python3 reports/gateway-land/feasibility-test.py
Assumptions: 4% LIHTC, QCT 130% boost, $0.85 credit pricing, 85% of non-land cost in basis,
Gateway rents capped ~$1,350 blended (60% AMI limits exceed market), $8,500/unit opex, 7% vacancy,
perm debt at 1.20x coverage with a 0.0767 annual constant (~6.6%, 35-yr)."""
LAND = 19_990_000; LID = 5_373_319; SF = 280_747; AC = SF / 43560; SFR_NOI = 384_000

def run(units, costs=(400_000, 450_000, 500_000)):
    print(f"\n=== {units} units: land/unit ${LAND/units:,.0f}, {units/AC:.0f} units/acre, FAR {units*1000/SF:.2f} at 1,000 GSF/unit")
    for hs in costs:
        tdc = hs * units + LAND
        equity = hs * units * 0.85 * 1.30 * 0.04 * 10 * 0.85
        noi = units * 1350 * 12 * 0.93 - units * 8500
        loan = noi / 1.20 / 0.0767
        gap = tdc - equity - loan
        print(f"  hard+soft ${hs:,}: TDC ${tdc/1e6:,.0f}M (${tdc/units:,.0f}/u), land {LAND/tdc:.1%}, "
              f"equity ${equity/1e6:,.0f}M, debt ${loan/1e6:,.0f}M, gap ${gap/1e6:,.0f}M = ${gap/units:,.0f}/u")
        if hs == 450_000:
            for phases in (4, 5):
                print(f"    {phases} phases: {units/phases:.0f} u/phase, gap/phase ${gap/phases/1e6:,.1f}M")

for u in (375, 561):
    run(u)
print("\nLand carry at 7% net of SFR income:")
for yrs in (5, 6, 8, 10):
    carry = LAND * 0.07 * yrs - SFR_NOI * yrs
    print(f"  {yrs} yrs: ${carry/1e6:,.1f}M -> effective land/unit 375: ${(LAND+carry)/375:,.0f}, 561: ${(LAND+carry)/561:,.0f}")
print(f"\nAsk ${LAND/SF:.2f}/SF; net of LID ${(LAND-LID)/SF:.2f}/SF; plus LID ${(LAND+LID)/SF:.2f}/SF; "
      f"Prosper Portland comp $47/SF -> ${47*SF/1e6:,.1f}M")
