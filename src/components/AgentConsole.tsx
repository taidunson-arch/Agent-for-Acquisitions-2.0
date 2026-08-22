import { useEffect, useRef, useState } from "react";
import type { AgentStep, LogLine } from "../lib/types";
import { AGENT_VERSION } from "../lib/agent";
import { IconCheck, Spinner } from "./ui";

const KIND_CLASS: Record<LogLine["k"], string> = {
  dim: "text-ink-faint",
  act: "text-moss",
  val: "text-brass-soft",
  warn: "text-ember",
  ok: "text-moss font-semibold",
};
const KIND_MARK: Record<LogLine["k"], string> = {
  dim: "·",
  act: "▸",
  val: "◦",
  warn: "!",
  ok: "✓",
};

export default function AgentConsole({
  steps, logs, stepIdx, done, dealName, startedAt,
}: {
  steps: AgentStep[];
  logs: LogLine[];
  stepIdx: number;
  done: boolean;
  dealName: string;
  startedAt: number;
}) {
  const total = steps.reduce((s, x) => s + x.lines.length, 0);
  const pct = total > 0 ? Math.round((logs.length / total) * 100) : 0;
  const winRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 200);
    if (done) setElapsed((Date.now() - startedAt) / 1000);
    return () => clearInterval(t);
  }, [done, startedAt]);

  useEffect(() => {
    if (winRef.current) winRef.current.scrollTop = winRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="rounded-lg border border-line bg-pine-950/90 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-line bg-pine-900/80">
        <div className="flex items-center gap-3 min-w-0">
          {done ? (
            <span className="text-moss"><IconCheck className="w-4 h-4" /></span>
          ) : (
            <span className="text-brass"><Spinner className="w-4 h-4" /></span>
          )}
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold uppercase tracking-[0.06em] leading-tight truncate">
              ACQ/2 Run — {dealName || "Untitled deal"}
            </div>
            <div className="font-mono text-[10.5px] text-ink-faint truncate">{AGENT_VERSION}</div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-sm text-brass-soft tnum">{elapsed.toFixed(1)}s</div>
          <div className="font-mono text-[10px] text-ink-faint uppercase tracking-wider">{done ? "complete" : "working"}</div>
        </div>
      </div>

      {/* progress */}
      <div className="h-1 bg-pine-800">
        <div className="h-full bg-gradient-to-r from-moss-deep via-moss to-brass transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      <div className="grid md:grid-cols-[210px_1fr]">
        {/* step checklist */}
        <div className="border-b md:border-b-0 md:border-r border-line px-4 py-4 space-y-1 bg-pine-900/40">
          {steps.map((s, idx) => {
            const state = idx < stepIdx || done ? "done" : idx === stepIdx ? "active" : "pending";
            return (
              <div
                key={s.label}
                className={`flex items-center gap-2.5 rounded px-2 py-1.5 font-mono text-[11px] tracking-wide transition-all duration-300 ${
                  state === "done" ? "text-moss/80" : state === "active" ? "text-brass bg-brass/10" : "text-ink-faint/60"
                }`}
              >
                <span className="w-3.5 shrink-0">
                  {state === "done" ? "✓" : state === "active" ? <Spinner className="w-3 h-3" /> : "·"}
                </span>
                {`0${idx + 1} ${s.label}`}
              </div>
            );
          })}
        </div>

        {/* log stream */}
        <div ref={winRef} className="h-[340px] md:h-[380px] overflow-y-auto px-5 py-4 font-mono text-[12px] leading-[1.85]">
          {logs.map((ln, idx) => (
            <div key={idx} className={`rise-fade flex gap-2.5 ${KIND_CLASS[ln.k]}`}>
              <span className="shrink-0 opacity-60 w-3 text-right">{KIND_MARK[ln.k]}</span>
              <span className="break-words">{ln.t}</span>
            </div>
          ))}
          {!done && (
            <div className="flex gap-2.5 text-moss">
              <span className="caret">▮</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
