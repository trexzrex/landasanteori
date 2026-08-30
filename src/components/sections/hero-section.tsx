"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  FlaskConical,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const rotatingPhrases = [
  "tervalidasi jurnal",
  "siap praktikum",
  "gaya sitasi APA",
  "analisis presisi",
  "standar akademik",
] as const;

function TypewriterPhrase() {
  const [phraseIndex, setPhraseIndex] = React.useState(0);
  const [displayedText, setDisplayedText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const prefersReducedMotion = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(rotatingPhrases[0]);
      return;
    }

    const current = rotatingPhrases[phraseIndex];
    const isFinishedTyping = !isDeleting && displayedText === current;
    const isFinishedDeleting = isDeleting && displayedText === "";

    if (isFinishedTyping) {
      const pause = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(pause);
    }

    if (isFinishedDeleting) {
      const pauseBeforeNext = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % rotatingPhrases.length);
      }, 300);
      return () => clearTimeout(pauseBeforeNext);
    }

    const timeout = setTimeout(
      () => {
        setDisplayedText((prev) =>
          isDeleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1)
        );
      },
      isDeleting ? 45 : 85
    );

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, phraseIndex, prefersReducedMotion]);

  return (
    <span className="inline-flex items-baseline text-primary" aria-live="polite" aria-atomic="true">
      <span>{displayedText || "\u00A0"}</span>
      {!prefersReducedMotion && (
        <span className="ml-1 inline-block h-[0.9em] w-[2px] translate-y-[2px] animate-pulse bg-primary" aria-hidden="true" />
      )}
    </span>
  );
}

const stats = [
  { icon: ShieldCheck, label: "Referensi Terverifikasi", value: "Open Access" },
  { icon: Search, label: "Pencarian Otomatis", value: "OpenAlex + Scholar" },
  { icon: FileText, label: "Output Siap Pakai", value: "PDF Akademik" },
];

const previewRows = [
  { title: "Spektrofotometri UV-Vis", source: "Journal of Analytical Chemistry", year: "2024" },
  { title: "Kompleksasi ion Fe(II)", source: "MethodsX", year: "2022" },
  { title: "Analisis kadar besi dalam air", source: "BMC Chemistry", year: "2021" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: EASE },
  }),
};

function ResearchPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 32, y: 12 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
      className="relative mx-auto w-full max-w-[560px]"
    >
      <div className="absolute -inset-5 rounded-[2rem] bg-primary/10 blur-2xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10">
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold">Landasan Teori</p>
              <p className="text-[10px] text-muted-foreground">Contoh ilustrasi</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Contoh
          </span>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-primary">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Topik analisis
            </div>
            <p className="text-sm font-semibold leading-relaxed sm:text-base">
              Penentuan Kadar Besi (Fe) dalam Air Minum menggunakan Spektrofotometer UV-Vis
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-xs font-semibold">Referensi ditemukan</span>
              </div>
              <span className="text-[10px] text-muted-foreground">3 sumber</span>
            </div>
            <div className="space-y-3">
              {previewRows.map((row, index) => (
                <motion.div
                  key={row.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.12, ease: EASE }}
                  className="flex items-start gap-3 border-t border-border/70 pt-3 first:border-0 first:pt-0"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{row.title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {row.source} · {row.year}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
              <Quote className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-xs font-semibold">Pratinjau hasil</span>
            </div>
            <div className="space-y-2.5">
              <div className="h-2 w-full rounded-full bg-muted" />
              <div className="h-2 w-[92%] rounded-full bg-muted" />
              <div className="h-2 w-[76%] rounded-full bg-muted" />
              <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
                ...metode spektrofotometri digunakan untuk menentukan konsentrasi analit dalam sampel air [1]...
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-24 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Sumber cahaya lembut di pojok kiri atas */}
        <div className="absolute -left-[10%] -top-[10%] h-[50rem] w-[50rem] rounded-full bg-primary/20 blur-[120px]" />
        
        {/* Gradien yang menggelapkan dari kanan bawah menuju kiri atas */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/40 to-background" />
        
        {/* Transisi halus ke bawah untuk blending dengan section berikutnya */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_75%,var(--background))]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:gap-16">
        <div className="text-center lg:text-left">
          <motion.p
            custom={0}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mb-6 text-sm font-semibold uppercase tracking-[0.14em] text-primary"
          >
            Riset kimia, lebih terarah
          </motion.p>
          <motion.h1
            custom={1}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.12]"
          >
            Landasan Teori Generator otomatis, ilmiah, &amp; <TypewriterPhrase />
          </motion.h1>
          <motion.p
            custom={2}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
          >
            Masukkan topik analisis kimia. Sistem mencari jurnal open access,
            menyusun teori, dan menyiapkan daftar pustaka APA untuk kamu tinjau.
          </motion.p>
          <motion.div
            custom={3}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
          >
            <Link
              href="/generate"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-accent hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] sm:w-auto"
            >
              Mulai Buat Landasan Teori
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              href="#cara-kerja"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border px-7 text-base font-medium text-foreground transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
            >
              Lihat Cara Kerja
            </Link>
          </motion.div>

          <motion.dl
            custom={4}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mt-12 grid grid-cols-1 gap-3 text-left sm:grid-cols-3 lg:grid-cols-1 lg:gap-2"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/50 px-4 py-3 backdrop-blur-sm">
                <stat.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</dt>
                  <dd className="truncate text-xs font-semibold">{stat.value}</dd>
                </div>
              </div>
            ))}
          </motion.dl>
        </div>

        <ResearchPreview />
      </div>
    </section>
  );
}
