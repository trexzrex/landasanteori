"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CheckCircle2, Clock3, FlaskConical, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerationLoadingDialogProps {
  open: boolean;
  currentStep: number;
  elapsedSeconds: number;
  steps: readonly string[];
  onCancel?: () => void;
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function GenerationLoadingDialog({
  open,
  currentStep,
  elapsedSeconds,
  steps,
  onCancel,
}: GenerationLoadingDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onCancel?.();
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed bottom-0 left-0 z-50 max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:left-1/2 sm:top-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-8"
          aria-describedby="generation-loading-description"
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-border sm:hidden" />
          <Dialog.Title className="sr-only">Membuat landasan teori</Dialog.Title>

          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Batalkan proses generasi"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </Dialog.Close>

          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <Loader2 className="absolute inset-0 h-24 w-24 animate-spin text-primary/30" aria-hidden="true" />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                <FlaskConical className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>

            <p className="mt-5 text-lg font-semibold">Sedang menyusun landasan teori</p>
            <p id="generation-loading-description" className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Sistem menelusuri sumber akademik dan menyusun hasil berdasarkan referensi yang ditemukan.
            </p>
          </div>

          <div className="mt-7 rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {currentStep < 2 ? <Search className="h-4 w-4" aria-hidden="true" /> : <BookOpen className="h-4 w-4" aria-hidden="true" />}
              </span>
              <div className="min-w-0 text-left" role="status" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={steps[currentStep]}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="text-sm font-medium"
                  >
                    {steps[currentStep]}
                  </motion.p>
                </AnimatePresence>
                <p className="mt-0.5 text-xs text-muted-foreground">Jangan tutup halaman ini.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-3.5 text-center">
              <Clock3 className="mx-auto h-4 w-4 text-primary" aria-hidden="true" />
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Sudah berjalan</p>
              <p className="mt-1 text-base font-semibold tabular-nums">{formatElapsed(elapsedSeconds)}</p>
            </div>
            <div className="rounded-xl border border-border p-3.5 text-center">
              <CheckCircle2 className="mx-auto h-4 w-4 text-primary" aria-hidden="true" />
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Estimasi waktu</p>
              <p className="mt-1 text-base font-semibold">1–3 menit</p>
            </div>
          </div>

          {onCancel && (
            <Dialog.Close asChild>
              <Button variant="outline" className="mt-5 w-full">
                Batalkan
              </Button>
            </Dialog.Close>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
