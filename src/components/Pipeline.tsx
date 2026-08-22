import type { PipelineDeal, Verdict } from "../lib/types";
import { ASSET_LABELS } from "../data/deals";
import { fmtK } from "../lib/format";
import { IconPlus } from "./ui";

const STATUS_STYLE: Record<PipelineDeal["status"], string> = {
  underwritten: "text-moss border-moss/40 bg-moss/10",
  negotiation: "text-brass border-brass/40 bg-brass/10",
  passed: "text-ember border-ember/40 bg-ember/10",
  intake: "text-ink-faint border-line bg-pine-800",
};
const STATUS_LABEL: Record<PipelineDeal["status"], string> = {
  underwritten: "UNDERWRITTEN",
  negotiation: "IN NEGOTIATION",
  passed: "PASSED",
  intake: "INTAKE",
};
const VERDICT_TEXT: Record<Verdict, string> = {
  "STRONG ADVANTAGE": "text-moss",
  NEGOTIATE: "text-brass",
  PASS: "text-ember",
};

export default function Pipeline({
  deals, scores, activeId, onLoad, onNew,
}: {
  deals: PipelineDeal[];
  scores: Record<string, { verdict: Verdict; score: number }>;
  activeId: string | null;
  onLoad: (d: PipelineDeal) => void;
  onNew: () => void;
}) {
  return (
    <section className="no-print">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="font-display text-xl font-bold uppercase tracking-[0.06em] leading-none">Deal Pipeline</h2>
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-faint mt-1">{deals.length} files · click to load into intake</p>
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-[11px] tracking-wide text-moss hover:border-moss/50 hover:bg-moss/10 transition-all"
        >
          <IconPlus className="w-3.5 h-3.5" /> NEW FILE
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
        {deals.map((d) => {
          const s = scores[d.id];
          const active = d.id === activeId;
          return (
            <button
              key={d.id}
              onClick={() => onLoad(d)}
              className={`group shrink-0 w-[248px] text-left rounded-lg border p-4 transition-all duration-200 hover:-translate-y-1 ${
                active
                  ? "border-brass bg-pine-850 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                  : "border-line bg-pine-900/70 hover:border-pine-600 hover:bg-pine-850"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-[0.12em] ${STATUS_STYLE[d.status]}`}>
                  {STATUS_LABEL[d.status]}
                </span>
                <span className="font-mono text-[10px] text-ink-faint">{ASSET_LABELS[d.inputs.assetType]}</span>
              </div>
              <div className="mt-2.5 font-display text-[19px] font-bold uppercase leading-tight tracking-wide group-hover:text-brass-soft transition-colors">
                {d.inputs.dealName}
              </div>
              <div className="font-mono text-[10.5px] text-ink-faint mt-0.5">{d.inputs.market} · {d.inputs.units} doors</div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                <span className="font-mono text-[13px] font-semibold text-paper tnum">{fmtK(d.inputs.askingPrice)}</span>
                {s && (
                  <span className="flex items-center gap-2">
                    <span className="w-12 h-[5px] rounded-full bg-pine-700 overflow-hidden">
                      <span
                        className={`block h-full rounded-full ${s.verdict === "PASS" ? "bg-ember" : s.verdict === "NEGOTIATE" ? "bg-brass" : "bg-moss"}`}
                        style={{ width: `${s.score}%` }}
                      />
                    </span>
                    <span className={`font-mono text-[11px] font-bold tnum ${VERDICT_TEXT[s.verdict]}`}>{s.score}</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
