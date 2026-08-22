export const fmtUSD = (n: number, dp = 0): string =>
  Number.isFinite(n)
    ? n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: dp,
        minimumFractionDigits: dp,
      })
    : "—";

export const fmtK = (n: number): string => {
  if (!Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}$${Math.round(a / 1e3)}K`;
  return fmtUSD(n);
};

export const fmtPct = (n: number, dp = 1): string =>
  Number.isFinite(n) ? `${n.toFixed(dp)}%` : "—";

export const fmtX = (n: number, dp = 2): string =>
  Number.isFinite(n) ? `${n.toFixed(dp)}×` : "N/A";

export const fmtInt = (n: number): string =>
  Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "—";

export const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
