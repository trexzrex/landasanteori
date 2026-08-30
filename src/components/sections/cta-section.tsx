"use client";

import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { motion } from "framer-motion";

export function CtaSection() {
  return (
    <section className="border-t border-border/60 px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <motion.div
        className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-primary/20 bg-card px-6 py-14 text-center sm:px-14 sm:py-20"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <FlaskConical className="h-7 w-7 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Siap Menghemat Waktu Riset Anda?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          Berhenti menyalin jurnal satu per satu. Biarkan sistem menyiapkan
          dasar teoretis Anda — Anda fokus pada analisisnya.
        </p>
        <Link
          href="/generate"
          className="group mt-10 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-10 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-accent hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] sm:w-auto"
        >
          Buat Landasan Teori Sekarang
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </motion.div>
    </section>
  );
}
