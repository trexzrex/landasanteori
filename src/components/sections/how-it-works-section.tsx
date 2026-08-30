"use client";

import { ClipboardList, Bot, FileCheck } from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Isi Formulir",
    description:
      "Masukkan identitas Anda dan judul analisis kimia, lalu pilih tingkat kedalaman teori yang dibutuhkan.",
  },
  {
    icon: Bot,
    step: "02",
    title: "AI Mencari & Menulis",
    description:
      "Sistem menelusuri jurnal open access, lalu AI menyusun landasan teori murni dari abstrak referensi yang ditemukan.",
  },
  {
    icon: FileCheck,
    step: "03",
    title: "Unduh PDF",
    description:
      "Pratinjau hasil lengkap dengan daftar pustaka, lalu unduh dalam format PDF siap print sesuai standar akademik.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="cara-kerja"
      className="scroll-mt-20 border-t border-border/60 px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Cara Kerja
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Tiga Langkah, Selesai
          </h2>
        </motion.div>

        <ol className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.li
              key={step.step}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: index * 0.12, ease: EASE }}
              className="relative"
            >
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className="absolute left-[calc(50%+2.5rem)] top-10 hidden h-px w-[calc(100%-5rem)] bg-gradient-to-r from-border via-primary/30 to-border md:block"
                />
              )}
              <div className="flex flex-col items-center text-center">
                <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                  <step.icon
                    className="h-8 w-8 text-primary"
                    aria-hidden="true"
                  />
                  <span className="absolute -right-2.5 -top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">
                    {index + 1}
                  </span>
                </span>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
