"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  FlaskConical,
  HelpCircle,
  History,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step {
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tips: string[];
}

const tutorialSteps: Step[] = [
  {
    title: "Selamat Datang di Dashboard!",
    subtitle: "Pusat navigasi & pantauan analisis kimia Anda",
    badge: "Langkah 1 dari 4",
    icon: FlaskConical,
    description:
      "Dashboard ini dirancang untuk memudahkan Anda memantau aktivitas pembuatan landasan teori ilmiah secara cepat, transparan, dan terstruktur.",
    tips: [
      "Semua dokumen yang Anda susun tersimpan otomatis.",
      "Pantau performa dan penggunaan kuota harian kapan saja.",
    ],
  },
  {
    title: "Tombol 'Buat Landasan Teori'",
    subtitle: "Aksi utama untuk menghasilkan dokumen baru",
    badge: "Langkah 2 dari 4",
    icon: Sparkles,
    description:
      "Klik tombol ungu 'Buat Landasan Teori' di pojok kanan atas (atau tab tengah pada tampilan HP) untuk membuka formulir analisis praktikum.",
    tips: [
      "Cukup masukkan judul praktikum, kata kunci, dan tingkat kedalaman.",
      "AI akan otomatis mencari referensi jurnal terverifikasi & menyusun sitasi.",
    ],
  },
  {
    title: "Statistik & Kuota Harian",
    subtitle: "Transparansi penggunaan tanpa kejutan",
    badge: "Langkah 3 dari 4",
    icon: TrendingUp,
    description:
      "Setiap pengguna memiliki kuota 5 generasi gratis per hari (direset setiap tengah malam WIB). Kartu ringkasan memperlihatkan:",
    tips: [
      "Total generasi sukses & tingkat keberhasilan.",
      "Sisa kuota harian Anda agar tidak kehabisan saat praktikum.",
    ],
  },
  {
    title: "Riwayat & Pengaturan Akun",
    subtitle: "Unduh kembali dokumen PDF & Word kapan saja",
    badge: "Langkah 4 dari 4",
    icon: History,
    description:
      "Buka menu 'Riwayat' di sidebar kiri atau navigasi bawah HP untuk melihat daftar dokumen yang pernah dibuat.",
    tips: [
      "Unduh ulang PDF standar akademik atau Word (.docx) siap edit.",
      "Atur NIS, kelas, atau kata sandi melalui menu 'Profil'.",
    ],
  },
];

interface DashboardTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "dashboard_tutorial_seen_v1";

export function DashboardTutorialModal({ isOpen, onClose }: DashboardTutorialModalProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [dontShowAgain, setDontShowAgain] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleFinishOrDismiss = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // Abaikan jika localStorage tidak diizinkan
      }
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinishOrDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = tutorialSteps[currentStep];
  const StepIcon = step.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleFinishOrDismiss}
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal box */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-modal-title"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8"
          >
            {/* Tombol tutup pojok kanan */}
            <button
              onClick={handleFinishOrDismiss}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Tutup panduan"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Konten slide dengan animasi transisi */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Badge & Icon */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                    <StepIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {step.badge}
                    </span>
                    <h3
                      id="tutorial-modal-title"
                      className="text-lg font-bold tracking-tight text-foreground sm:text-xl"
                    >
                      {step.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs font-medium text-primary/90">
                  {step.subtitle}
                </p>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>

                {/* Kotak Tips Singkat */}
                <div className="space-y-2 rounded-xl border border-border/80 bg-secondary/40 p-3.5">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Poin Penting:
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {step.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Pagination Dots & Navigation Buttons */}
            <div className="mt-8 space-y-4">
              {/* Dots */}
              <div className="flex items-center justify-center gap-2">
                {tutorialSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    aria-label={`Buka slide ke-${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentStep
                        ? "w-6 bg-primary"
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                    }`}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                {currentStep > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="gap-1.5 text-xs"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Kembali
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFinishOrDismiss}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Lewati Panduan
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {currentStep === tutorialSteps.length - 1 ? (
                    <>
                      Mulai Eksplorasi
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      Lanjut
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>

              {/* Opsi Ingat Jangan Tampilkan Lagi */}
              <div className="flex items-center justify-center pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border text-primary accent-primary"
                  />
                  <span>Jangan tampilkan otomatis lagi</span>
                </label>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export { STORAGE_KEY };
