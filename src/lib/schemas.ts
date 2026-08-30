import { z } from "zod";

export const LABORATORIUM_PRESETS = [
  "Gravimetri",
  "Volumetri",
  "Mikrobiologi",
  "FNI",
  "Proksimat",
  "Instrumen",
  "Batu Bara",
  "Lingkungan",
] as const;

/**
 * Schema validasi untuk Formulir Generator Landasan Teori.
 * Digunakan oleh react-hook-form di frontend, dan juga bisa dipakai
 * untuk validasi di backend API route.
 */
export const generateFormSchema = z.object({
  laboratorium: z
    .string({ error: "Pilih atau isi nama laboratorium" })
    .trim()
    .min(2, "Laboratorium minimal 2 karakter")
    .max(100, "Laboratorium maksimal 100 karakter"),

  judul_analisis: z
    .string()
    .min(10, "Judul analisis minimal 10 karakter")
    .max(200, "Judul analisis maksimal 200 karakter"),
  kata_kunci: z
    .string()
    .max(200, "Kata kunci maksimal 200 karakter"),

  kedalaman_teori: z.enum(["singkat", "menengah", "mendalam"], {
    error: "Pilih tingkat kedalaman teori",
  }),

  nama: z.string().optional(),
  nis: z.string().optional(),
  kelas: z.string().optional(),
});

export type GenerateFormData = z.infer<typeof generateFormSchema>;

/**
 * Struktur respons dari API /api/generate
 */
export interface GenerateResponse {
  status: "success" | "error";
  message: string;
  data?: {
    generation_id: string | null;
    landasan_teori: string;
    daftar_pustaka: string[];
  };
  quota?: {
    daily_used: number;
    daily_limit: number;
    remaining: number;
    unlimited?: boolean;
  };
}

export const storedResultSchema = z.object({
  generation_id: z.string().nullable().optional(),
  landasan_teori: z.string().min(1),
  daftar_pustaka: z.array(z.string()),
  meta: z.object({
    judul_analisis: z.string().min(1),
    kedalaman_teori: z.enum(["singkat", "menengah", "mendalam"]),
    // Supabase/PostgREST mengirim timestamptz dengan offset (mis. +00:00),
    // sedangkan form memakai suffix Z. Kedua format harus diterima.
    generated_at: z.string().datetime({ offset: true }),
  }),
});

export type StoredResultData = z.infer<typeof storedResultSchema>;
