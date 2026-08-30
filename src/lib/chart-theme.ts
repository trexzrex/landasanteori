"use client";

import * as React from "react";

/**
 * Palet warna chart yang dibaca dari CSS custom properties, sehingga grafik
 * mengikuti tema terang/gelap alih-alih memakai hex yang dipatok di kode.
 * Recharts memerlukan nilai warna konkret (bukan `var(--x)`), jadi token
 * dibaca ulang setiap kali tema berubah.
 */
const TOKENS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--chart-success",
  "--chart-danger",
  "--chart-warning",
  "--chart-info",
  "--chart-grid",
  "--primary",
  "--muted-foreground",
] as const;

type TokenName = (typeof TOKENS)[number];

export interface ChartPalette {
  series: string[];
  success: string;
  danger: string;
  warning: string;
  info: string;
  grid: string;
  primary: string;
  axis: string;
  cursor: string;
}

const FALLBACK: ChartPalette = {
  series: ["#6d28d9", "#8b5cf6", "#a78bfa", "#c4b5fd", "#4c1d95"],
  success: "#15803d",
  danger: "#dc2626",
  warning: "#b45309",
  info: "#0369a1",
  grid: "#ddd0f7",
  primary: "#6d28d9",
  axis: "#64748b",
  cursor: "rgba(109, 40, 217, 0.08)",
};

function readTokens(): Record<TokenName, string> | null {
  if (typeof window === "undefined") return null;
  const styles = getComputedStyle(document.documentElement);
  const entries = TOKENS.map((token) => [token, styles.getPropertyValue(token).trim()] as const);
  if (entries.some(([, value]) => !value)) return null;
  return Object.fromEntries(entries) as Record<TokenName, string>;
}

/** Ubah warna token menjadi rgba dengan alpha tertentu (mendukung hex 3/6 digit). */
function withAlpha(color: string, alpha: number): string {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  if (full.length !== 6) return color;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useChartPalette(): ChartPalette {
  const [palette, setPalette] = React.useState<ChartPalette>(FALLBACK);

  React.useEffect(() => {
    const sync = () => {
      const tokens = readTokens();
      if (!tokens) return;
      setPalette({
        series: [
          tokens["--chart-1"],
          tokens["--chart-2"],
          tokens["--chart-3"],
          tokens["--chart-4"],
          tokens["--chart-5"],
        ],
        success: tokens["--chart-success"],
        danger: tokens["--chart-danger"],
        warning: tokens["--chart-warning"],
        info: tokens["--chart-info"],
        grid: tokens["--chart-grid"],
        primary: tokens["--primary"],
        axis: tokens["--muted-foreground"],
        cursor: withAlpha(tokens["--primary"], 0.1),
      });
    };

    sync();

    // Tema diganti dengan menukar class pada <html>; pantau perubahannya.
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return palette;
}
