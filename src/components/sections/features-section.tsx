"use client";

import {
  BookOpenCheck,
  Quote,
  FileDown,
  SearchCheck,
  ShieldAlert,
  Gauge,
} from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const features = [
  {
    icon: SearchCheck,
    title: "Pencarian Jurnal Otomatis",
    description:
      "Sistem menelusuri database akademik OpenAlex dan Semantic Scholar untuk menemukan jurnal open access yang relevan dengan judul analisis Anda.",
  },
  {
    icon: ShieldAlert,
    title: "Berbasis Referensi Jurnal",
    description:
      "AI menyusun landasan teori menggunakan abstrak jurnal yang ditemukan. Jika referensi tidak tersedia, proses dihentikan — bukan dikarang.",
  },
  {
    icon: Quote,
    title: "Sitasi Otomatis Gaya APA",
    description:
      "Setiap klaim dalam teks diberi nomor rujukan [1], [2] yang terhubung langsung ke daftar pustaka berformat APA yang valid.",
  },
  {
    icon: BookOpenCheck,
    title: "Kedalaman Teori Fleksibel",
    description:
      "Pilih panjang output sesuai kebutuhan: Singkat (±1 halaman), Menengah (±2 halaman), atau Mendalam (±3+ halaman A4).",
  },
  {
    icon: FileDown,
    title: "Ekspor PDF Standar Akademik",
    description:
      "Hasil langsung diunduh sebagai PDF A4 dengan margin 4-3-3-3 cm, font 12pt, spasi 1.5, dan perataan justify sesuai kaidah penulisan ilmiah.",
  },
  {
    icon: Gauge,
    title: "Filter Jurnal Terkini",
    description:
      "Prioritas diberikan pada publikasi 10 tahun terakhir agar landasan teori Anda tetap relevan dengan perkembangan metode analisis.",
  },
];

const headingVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

export function FeaturesSection() {
  return (
    <section
      id="fitur"
      className="scroll-mt-20 border-t border-border/60 px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1 } },
          }}
        >
          <motion.p
            variants={headingVariants}
            className="text-sm font-semibold uppercase tracking-[0.14em] text-primary"
          >
            Fitur Utama
          </motion.p>
          <motion.h2
            variants={headingVariants}
            className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Dibangun untuk Akurasi Akademik
          </motion.h2>
          <motion.p
            variants={headingVariants}
            className="mt-4 text-pretty leading-relaxed text-muted-foreground"
          >
            Setiap komponen dirancang agar hasil yang Anda dapatkan bisa
            dipertanggungjawabkan secara ilmiah — bukan sekadar teks yang
            terdengar meyakinkan.
          </motion.p>
        </motion.div>

        <motion.ul
          className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09 } },
          }}
        >
          {features.map((feature) => (
            <motion.li
              key={feature.title}
              variants={{
                hidden: { opacity: 0, y: 32 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: EASE },
                },
              }}
              className="group rounded-xl border border-border bg-card p-6 transition-colors duration-200 hover:border-primary/40 hover:bg-card"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
