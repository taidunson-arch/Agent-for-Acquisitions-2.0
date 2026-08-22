import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentStep, DealInputs, DealStatus, LogLine, PipelineDeal, Report as TReport, Verdict } from "./lib/types";
import { underwrite, validateInputs } from "./lib/underwrite";
import { buildScript } from "./lib/agent";
import { blankInputs, SAMPLE_DEALS, TICKER_ITEMS } from "./data/deals";
import IntakeForm from "./components/IntakeForm";
import AgentConsole from "./components/AgentConsole";
import DealReport from "./components/Report";
import Pipeline from "./components/Pipeline";
import { IconBolt, IconCheck, IconFile, IconPlus, IconPrint, IconTarget } from "./components/ui";

const LS_DEALS = "acqagent.deals.v2";
const LS_FORM = "acqagent.form.v2";

const loadLS = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Phase = "intake" | "running" | "report";
const PHASE_IDX: Record<Phase, number> = { intake: 0, running: 1, report: 2 };

export default function App() {
  const [deals, setDeals] = useState<PipelineDeal[]>(() => loadLS(LS_DEALS, SAMPLE_DEALS));
  const [form, setForm] = useState<DealInputs>(() => loadLS(LS_FORM, SAMPLE_DEALS[0].inputs));
  const [phase, setPhase] = useState<Phase>("intake");
  const [report, setReport] = useState<TReport | null>(null);
  const [script, setScript] = useState<AgentStep[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const runRef = useRef(false);

  useEffect(() => {
    try { localStorage.setItem(LS_DEALS, JSON.stringify(deals)); } catch { /* quota */ }
  }, [deals]);
  useEffect(() => {
    try { localStorage.setItem(LS_FORM, JSON.stringify(form)); } catch { /* quota */ }
  }, [form]);

  const errors = useMemo(() => validateInputs(form), [form]);
  const errorCount = Object.keys(errors).length;

  const scores = useMemo(() => {
    const map: Record<string, { verdict: Verdict; score: number }> = {};
    for (const d of deals) {
      if (Object.keys(validateInputs(d.inputs)).length === 0) {
        const r = underwrite(d.inputs);
        map[d.id] = { verdict: r.verdict, score: r.scores.total };
      }
    }
    return map;
  }, [deals]);

  const patchForm = (patch: Partial<DealInputs>) => setForm((f) => ({ ...f, ...patch }));

  const runAgent = async (inputsOverride?: DealInputs) => {
    if (runRef.current) return;
    const src = inputsOverride ?? form;
    if (Object.keys(validateInputs(src)).length > 0) return;
    runRef.current = true;
    if (inputsOverride) setForm(inputsOverride);
    const rep = underwrite(src);
    const sc = buildScript(rep);
    setReport(rep);
    setScript(sc);
    setLogs([]);
    setStepIdx(0);
    setPhase("running");
    setStartedAt(Date.now());
    window.scrollTo({ top: 0, behavior: "smooth" });
    for (let s = 0; s < sc.length; s++) {
      setStepIdx(s);
      for (const ln of sc[s].lines) {
        await sleep(150 + Math.random() * 260);
        setLogs((p) => [...p, ln]);
      }
      await sleep(220);
    }
    await sleep(420);
    setPhase("report");
    const status: DealStatus =
      rep.verdict === "STRONG ADVANTAGE" ? "underwritten" : rep.verdict === "NEGOTIATE" ? "negotiation" : "passed";
    setDeals((prev) => {
      const pd: PipelineDeal = { id: src.id, status, updatedAt: Date.now(), inputs: src };
      return prev.some((d) => d.id === src.id) ? prev.map((d) => (d.id === src.id ? pd : d)) : [pd, ...prev];
    });
    runRef.current = false;
  };

  const loadDeal = (d: PipelineDeal) => {
    setForm({ ...d.inputs });
    setPhase("intake");
    setReport(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const newDeal = () => {
    setForm(blankInputs());
    setPhase("intake");
    setReport(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pIdx = PHASE_IDX[phase];

  return (
    <div className="relative min-h-screen">
      {/* ambient layers */}
      <div className="pointer-events-none fixed inset-0 z-0 ambient-grid" aria-hidden />
      <div className="pointer-events-none fixed inset-0 z-0 ambient-glow" aria-hidden />

      {/* header */}
      <header className="no-print sticky top-0 z-40 border-b border-line bg-ink/92 backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-md bg-brass text-inkline grid place-items-center font-display font-bold text-[20px] leading-none shadow-[0_0_24px_rgba(217,164,65,0.3)]">
              A/2
            </div>
            <div className="min-w-0">
              <div className="font-display text-[23px] font-bold uppercase tracking-[0.03em] leading-none whitespace-nowrap">
                ACQ<span className="text-brass">/</span>AGENT
              </div>
              <div className="font-mono text-[9px] sm:text-[9.5px] tracking-[0.18em] text-ink-faint uppercase mt-1 truncate">
                Developer Deal Advantage · Build 2.0 · Dana D-20260817
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {["INTAKE", "AGENT RUN", "REPORT"].map((label, idx) => {
              const state = idx < pIdx ? "done" : idx === pIdx ? "active" : "todo";
              return (
                <div key={label} className="flex items-center gap-2">
                  {idx > 0 && <span className={`w-6 h-px ${idx <= pIdx ? "bg-brass/60" : "bg-line"}`} />}
                  <span
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.14em] transition-all duration-300 ${
                      state === "done"
                        ? "border-moss/40 text-moss bg-moss/10"
                        : state === "active"
                          ? "border-brass/60 text-brass bg-brass/10 shadow-[0_0_16px_rgba(217,164,65,0.15)]"
                          : "border-line text-ink-faint"
                    }`}
                  >
                    {state === "done" ? <IconCheck className="w-3 h-3" /> : <span className={`w-1.5 h-1.5 rounded-full ${state === "active" ? "bg-brass pulse-dot" : "bg-ink-faint/40"}`} />}
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={newDeal}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 font-mono text-[11px] tracking-wide text-paper/80 hover:border-moss/50 hover:text-moss hover:bg-moss/5 transition-all"
            >
              <IconPlus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">NEW DEAL</span>
            </button>
            {phase === "report" && (
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-md bg-brass px-3 py-2 font-mono text-[11px] tracking-wide text-inkline hover:bg-brass-soft transition-colors"
              >
                <IconPrint className="w-3.5 h-3.5" /> <span className="hidden sm:inline">PRINT</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* market ticker */}
      <div className="no-print border-b border-line bg-pine-950/80 overflow-hidden relative">
        <div className="ticker-track flex w-max items-center py-1.5 font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, idx) => (
            <span key={idx} className="flex items-center whitespace-nowrap">
              <span className="px-5">{t}</span>
              <span className="text-brass/40">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* main */}
      <main className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-7">
        <Pipeline deals={deals} scores={scores} activeId={phase === "intake" ? form.id : null} onLoad={loadDeal} onNew={newDeal} />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* left — intake */}
          <section className="no-print xl:col-span-5">
            <IntakeForm
              value={form}
              errors={errors}
              errorCount={errorCount}
              running={phase === "running"}
              onChange={patchForm}
              onRun={() => runAgent()}
            />
          </section>

          {/* right — workspace */}
          <section className="xl:col-span-7">
            {phase === "running" && (
              <div className="no-print">
                <AgentConsole steps={script} logs={logs} stepIdx={stepIdx} done={false} dealName={form.dealName} startedAt={startedAt} />
              </div>
            )}

            {phase === "report" && report && <DealReport report={report} onRerun={() => runAgent()} onPrint={() => window.print()} />}

            {phase === "intake" && (
              <div className="no-print rounded-lg border border-dashed border-pine-600 bg-pine-900/40 px-6 sm:px-8 py-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md border border-line bg-pine-850 grid place-items-center text-brass">
                    <IconTarget className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold uppercase tracking-[0.05em] leading-none">Agent idle — no active run</h2>
                    <p className="font-mono text-[11px] text-ink-faint mt-1.5 tracking-wide">acq/2.0 standing by · dana feed connected</p>
                  </div>
                </div>

                <div className="mt-7 grid sm:grid-cols-3 gap-3">
                  {[
                    { icon: <IconFile className="w-4.5 h-4.5" />, t: "Ingest", d: "Parses the 16 Dana input fields and validates the file before a single number is trusted." },
                    { icon: <IconTarget className="w-4.5 h-4.5" />, t: "Underwrite", d: "Comps, income ledger, capital stack, DSCR and a 20-cell rent × rehab stress matrix." },
                    { icon: <IconBolt className="w-4.5 h-4.5" />, t: "Advantage", d: "Scores the file /100, stamps a verdict and drafts opening, target and ceiling offers." },
                  ].map((c) => (
                    <div key={c.t} className="rounded-md border border-line bg-pine-850/70 p-4 transition-all hover:border-brass/40 hover:-translate-y-0.5">
                      <span className="text-brass">{c.icon}</span>
                      <div className="mt-2.5 font-display text-lg font-semibold uppercase tracking-wide">{c.t}</div>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">{c.d}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => runAgent(SAMPLE_DEALS[0].inputs)}
                    className="inline-flex items-center gap-2 rounded-md border border-brass/50 bg-brass/10 px-4 py-2.5 font-mono text-[12px] tracking-wide text-brass hover:bg-brass/20 transition-all active:scale-[0.98]"
                  >
                    <IconBolt className="w-4 h-4" /> RUN SAMPLE — {SAMPLE_DEALS[0].inputs.dealName.toUpperCase()}
                  </button>
                  <span className="font-mono text-[10.5px] text-ink-faint">or fill the Dana inputs on the left and hit run</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* footer */}
      <footer className="no-print relative z-10 border-t border-line mt-4">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-faint">
            ACQ/AGENT 2.0 · Developer-Deal-Advantage-Report template v2 · Dana inputs D-20260817T151903Z
          </span>
          <span className="font-mono text-[10px] text-ink-faint">Estimates only — verify comp set & lender quotes before LOI.</span>
        </div>
      </footer>
    </div>
  );
}
