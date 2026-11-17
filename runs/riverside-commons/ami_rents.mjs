// HUD FY2026 MTSP 60% limits, Fresno, CA HMFA (MFI $91,300), effective 2026-05-01.
// Source: https://www.huduser.gov/portal/datasets/mtsp/mtsp26/HERA-Income-Limits-Report-FY26.rtf (copy in sources/)
// Max gross rent = 30% x income limit at imputed size (1.5 persons per bedroom; 0BR = 1 person) / 12.
import fs from 'node:fs';
const il60 = [40800, 46620, 52440, 58260, 62940, 67620, 72300, 76920]; // 1..8 persons
const at = (p) => Number.isInteger(p) ? il60[p - 1] : (il60[Math.floor(p) - 1] + il60[Math.ceil(p) - 1]) / 2;
const rows = [0, 1, 2, 3, 4].map(br => { const persons = br === 0 ? 1 : br * 1.5; const inc = at(persons); return { bedrooms: br, imputed_persons: persons, income_limit_60: inc, max_gross_rent_60: Math.floor(inc * 0.30 / 12), calc: '$' + inc.toLocaleString() + ' x 30% / 12' }; });
const out = { area: 'Fresno, CA HMFA', fy: 2026, mfi: 91300, effective: '2026-05-01', limits_60: il60, rents: rows, generated: new Date().toISOString() };
fs.writeFileSync('runs/riverside-commons/ami_rents.json', JSON.stringify(out, null, 2)); console.log(JSON.stringify(rows));
