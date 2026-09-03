"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  FileText,
  History,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TourStep {
  targetId: string;
  fallbackTargetId?: string;
  title: string;
  badge: string;
  description: string;
  tip: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-btn-generate",
    title: "Tombol 'Buat Landasan Teori'",
    badge: "Langkah 1 dari 5",
    description:
      "Klik tombol ungu ini untuk memulai pembuatan landasan teori baru. Cukup masukkan judul praktikum dan kata kunci kimia, AI akan mencari jurnal dan menyusun teks ilmiahnya.",
    tip: "Di ponsel pintar, tombol ini juga tersedia di navigasi bawah layar.",
    icon: Sparkles,
  },
  {
    targetId: "tour-stats-grid",
    title: "Ringkasan Statistik Aktivitas",
    badge: "Langkah 2 dari 5",
    description:
      "Empat kartu ini memantau total dokumen yang Anda generate, jumlah yang berhasil, aktivitas hari ini, serta persentase tingkat keberhasilan sistem.",
    tip: "Data otomatis diperbarui setiap kali Anda selesai menghasilkan dokumen baru.",
    icon: TrendingUp,
  },
  {
    targetId: "tour-quota-card",
    title: "Level Peneliti & Kuota Harian",
    badge: "Langkah 3 dari 5",
    description:
      "Setiap akun mendapatkan kuota 5x generasi gratis setiap hari yang direset pukul 00:00 WIB. Pantau sisa slot dan tingkat keaktifan akun Anda di sini.",
    tip: "Generasi yang gagal akibat jurnal tidak ditemukan tidak akan mengurangi kuota Anda.",
    icon: FileText,
  },
  {
    targetId: "tour-recent-history",
    title: "Riwayat Dokumen Terbaru",
    badge: "Langkah 4 dari 5",
    description:
      "Lihat daftar analisis yang baru saja selesai dibuat. Anda dapat melihat status proses dan langsung mengakses dokumen yang siap diunduh.",
    tip: "Klik 'Lihat Semua' untuk membuka arsip lengkap seluruh dokumen Anda.",
    icon: History,
  },
  {
    targetId: "tour-sidebar-nav",
    fallbackTargetId: "tour-bottom-nav",
    title: "Navigasi Menu Lengkap",
    badge: "Langkah 5 dari 5",
    description:
      "Gunakan menu samping (atau bar bawah di ponsel) untuk berpindah antara Ringkasan, Riwayat lengkap dokumen, dan Pengaturan Profil akun Anda.",
    tip: "Di halaman Profil, Anda dapat memperbarui data kelas, NIS, atau kata sandi akun.",
    icon: Compass,
  },
];

const SPOTLIGHT_STORAGE_KEY = "dashboard_spotlight_tour_seen_v2";

interface DashboardSpotlightTourProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function DashboardSpotlightTour({ isOpen, onClose }: DashboardSpotlightTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [targetRect, setTargetRect] = React.useState<TargetRect | null>(null);
  const [popoverPos, setPopoverPos] = React.useState<"bottom" | "top">("bottom");

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Fungsi mengukur dan scroll ke elemen target
  const updateTargetPosition = React.useCallback(() => {
    if (!isOpen || !currentStep) return;

    let targetElement = document.getElementById(currentStep.targetId);
    if (!targetElement && currentStep.fallbackTargetId) {
      targetElement = document.getElementById(currentStep.fallbackTargetId);
    }

    if (targetElement) {
      // Scroll target ke tengah layar dengan smooth
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });

      const rect = targetElement.getBoundingClientRect();
      const padding = 8;
      const calculatedRect = {
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      };

      setTargetRect(calculatedRect);

      // Tentukan apakah popover ditaruh di bawah atau atas elemen
      const viewportHeight = window.innerHeight;
      if (rect.bottom + 260 > viewportHeight && rect.top > 260) {
        setPopoverPos("top");
      } else {
        setPopoverPos("bottom");
      }
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  // Efek saat step berganti atau window di-resize/scroll
  React.useEffect(() => {
    if (!isOpen) return;

    // Beri sedikit waktu untuk layout settle lalu ukur
    const timer = setTimeout(() => {
      updateTargetPosition();
    }, 150);

    const handleResize = () => updateTargetPosition();
    const handleScroll = () => {
      // Re-evaluate rect on scroll without triggering recursive scrollIntoView
      let el = document.getElementById(currentStep.targetId);
      if (!el && currentStep.fallbackTargetId) {
        el = document.getElementById(currentStep.fallbackTargetId);
      }
      if (el) {
        const rect = el.getBoundingClientRect();
        const padding = 8;
        setTargetRect({
          top: Math.max(0, rect.top - padding),
          left: Math.max(0, rect.left - padding),
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen, currentStepIndex, updateTargetPosition, currentStep]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleComplete();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleComplete = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SPOTLIGHT_STORAGE_KEY, "true");
      } catch {
        // ignore
      }
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const IconComponent = currentStep.icon;

  // Hitung posisi popover floating
  let popoverTop = 0;
  let popoverLeft = 0;

  if (targetRect) {
    // horizontal center popover terhadap target dengan batas layar
    const cardWidth = Math.min(420, window.innerWidth - 32);
    const targetCenterX = targetRect.left + targetRect.width / 2;
    popoverLeft = Math.max(16, Math.min(targetCenterX - cardWidth / 2, window.innerWidth - cardWidth - 16));

    if (popoverPos === "bottom") {
      popoverTop = Math.min(window.innerHeight - 300, targetRect.top + targetRect.height + 14);
    } else {
      popoverTop = Math.max(16, targetRect.top - 280);
    }
  } else {
    // Center jika target tidak ditemukan
    popoverLeft = Math.max(16, (window.innerWidth - 400) / 2);
    popoverTop = Math.max(16, (window.innerHeight - 280) / 2);
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* SVG Mask Backdrop: membuat lubang transparan spotlight dengan animasi */}
      <svg
        className="fixed inset-0 h-full w-full pointer-events-none transition-all duration-300"
        style={{ zIndex: 51 }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.72)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Border bercahaya di sekeliling elemen yang ditunjuk */}
      {targetRect && (
        <motion.div
          layoutId="spotlight-ring"
          className="fixed rounded-2xl border-2 border-primary shadow-[0_0_24px_rgba(147,51,234,0.45)] pointer-events-none"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            zIndex: 52,
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        >
          {/* Efek denyut pulsing ring */}
          <span className="absolute -inset-1 rounded-2xl border border-primary/50 animate-ping opacity-75" />
        </motion.div>
      )}

      {/* Floating Card Popover Panduan */}
      <div
        className="fixed transition-all duration-300 pointer-events-auto"
        style={{
          top: popoverTop,
          left: popoverLeft,
          width: Math.min(420, window.innerWidth - 32),
          zIndex: 55,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: popoverPos === "bottom" ? 12 : -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl backdrop-blur-xl"
          >
            {/* Header Popover: Icon & Tombol Tutup */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    {currentStep.badge}
                  </span>
                  <h3 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                    {currentStep.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Tutup tur"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Konten Penjelasan */}
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {currentStep.description}
            </p>

            {/* Kotak Tips Sorotan */}
            <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs text-foreground">
              <Sparkles className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <p className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Tips: </strong>
                {currentStep.tip}
              </p>
            </div>

            {/* Footer: Pagination Dots & Navigation */}
            <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/60 pt-4">
              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStepIndex(idx)}
                    aria-label={`Ke langkah ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStepIndex
                        ? "w-5 bg-primary"
                        : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                    }`}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {currentStepIndex > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="h-8 gap-1 px-2.5 text-xs"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Kembali
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="h-8 gap-1 px-3 text-xs font-semibold"
                >
                  {currentStepIndex === TOUR_STEPS.length - 1 ? (
                    <>
                      Selesai
                      <CheckCircle2 className="h-3.5 w-3.5 ml-0.5" />
                    </>
                  ) : (
                    <>
                      Lanjut
                      <ArrowRight className="h-3 w-3 ml-0.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export { SPOTLIGHT_STORAGE_KEY };
