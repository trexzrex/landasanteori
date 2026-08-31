import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for conditional class names with Tailwind-aware merging.
 * Prevents conflicting utilities (e.g., "p-4 p-2") from stacking.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Susun nama file PDF dari judul praktikum.
 * Karakter yang dilarang pada nama file dibuang dan spasi jadi underscore.
 */
export function buildPdfFileName(judul: string | undefined | null) {
  const slug = (judul ?? "")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);

  return slug ? `Landasan_Teori_${slug}.pdf` : "Landasan_Teori.pdf";
}

