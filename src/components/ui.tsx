import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

/* ---------- scroll reveal ---------- */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- animated counter ---------- */
export function CountUp({
  value,
  format,
  duration = 950,
  className = "",
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const tick = (t: number) => {
          if (start === null) start = t;
          const p = Math.min(1, (t - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(value * eased);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.25 }
    );
    if (ref.current) io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={`tnum ${className}`}>
      {format(display)}
    </span>
  );
}

/* ---------- section tag (report) ---------- */
export function SectionTag({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-mono text-[10px] tracking-[0.2em] text-brass-deep border border-brass-deep/40 px-1.5 py-0.5">
        {index}
      </span>
      <h3 className="font-display text-xl sm:text-2xl font-semibold uppercase tracking-wide text-inkline">
        {title}
      </h3>
      <div className="h-px flex-1 bg-inkline/15" />
    </div>
  );
}

/* ---------- icons ---------- */
const I = ({ d, className = "", vb = "0 0 24 24" }: { d: string; className?: string; vb?: string }) => (
  <svg viewBox={vb} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

export const IconBolt = ({ className = "w-4 h-4" }: { className?: string }) => (
  <I className={className} d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
);
export const IconPlus = ({ className = "w-4 h-4" }: { className?: string }) => (
  <I className={className} d="M12 5v14M5 12h14" />
);
export const IconPrint = ({ className = "w-4 h-4" }: { className?: string }) => (
  <I className={className} d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6v-7Z" />
);
export const IconCheck = ({ className = "w-4 h-4" }: { className?: string }) => (
  <I className={className} d="m4.5 12.5 5 5 10-11" />
);
export const IconWarn = ({ className = "w-4 h-4" }: { className?: string }) => (
  <I className={className} d="M12 3 1.8 20.5h20.4L12 3Zm0 7v4m0 3.2v.3" />
);
export const IconTarget = ({ className = "w-4 h-4" }: { className?: string }) => (
  <I className={className} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
);
export const IconUp = ({ className = "w-4 h-4" }: { className?: string }) => (
  <I className={className} d="M7 17 17 7m0 0H8m9 0v9" />
);
export const IconWrench = ({ className = "w-4 h-4" }: { className?: string }) => (
  <I className={className} d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6 6.4 21l5.7-5.7a4.5 4.5 0 0 0 5.6-6L14.6 12l-2.6-2.6 2.7-3.1Z" />
);
export const IconFile = ({ className = "w-4 h-4" }: { className?: string }) => (
  <I className={className} d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M9 13h6m-6 4h6" />
);
export const IconChevron = ({ className = "w-4 h-4" }: { className?: string }) => (
  <I className={className} d="m6 9 6 6 6-6" />
);
export const IconRefresh = ({ className = "w-4 h-4" }: { className?: string }) => (
  <I className={className} d="M20 11a8 8 0 1 0-2.3 6.3M20 5v6h-6" />
);
export const Spinner = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={`spin-slow ${className}`}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
