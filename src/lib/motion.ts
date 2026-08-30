"use client";

import * as React from "react";

/** Kurva ease-out eksponensial yang dipakai konsisten di seluruh aplikasi. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Masuk halus dari bawah; delay dikontrol lewat prop `custom` (indeks urutan). */
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: EASE_OUT },
  }),
};

/** Container untuk daftar: anak-anaknya muncul berurutan dengan jeda pendek. */
export const listContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

/** Item daftar yang dipakai bersama `listContainer`. */
export const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

/**
 * Baca preferensi reduce-motion pengguna tanpa memicu hydration mismatch.
 * Mengembalikan false pada render pertama di server maupun klien.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(query.matches);

    const onChange = (event: MediaQueryListEvent) => setPrefers(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return prefers;
}
