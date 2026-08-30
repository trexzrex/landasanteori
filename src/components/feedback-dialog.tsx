"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Bug, Lightbulb, MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FeedbackType = "bug" | "saran";

const feedbackOptions = [
  { value: "bug" as const, label: "Laporkan bug", icon: Bug },
  { value: "saran" as const, label: "Kritik & saran", icon: Lightbulb },
];

export function FeedbackDialog() {
  const pathname = usePathname();
  // Dashboard punya bottom navigation di mobile; FAB harus naik agar tidak menutupinya.
  const aboveBottomNav = pathname?.startsWith("/dashboard") ?? false;
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<FeedbackType>("bug");
  const [message, setMessage] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = React.useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && status !== "loading") {
      setStatus("idle");
      setError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;

    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message, page: window.location.pathname }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Pesan tidak dapat dikirim.");
      }

      setStatus("success");
      setMessage("");
    } catch (submissionError) {
      setStatus("error");
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Pesan tidak dapat dikirim. Coba lagi."
      );
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button
          size="icon"
          variant="default"
          className={cn(
            "fixed right-5 z-40 h-12 w-12 rounded-full shadow-xl shadow-primary/30 sm:bottom-6 sm:right-6",
            aboveBottomNav ? "bottom-24" : "bottom-5"
          )}
          aria-label="Kirim kritik, saran, atau laporan bug"
        >
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="feedback-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "feedback-dialog fixed right-5 z-50 w-[calc(100vw-2.5rem)] max-w-[400px] rounded-2xl border border-border bg-card p-6 shadow-2xl sm:bottom-24 sm:right-6 sm:p-7",
            aboveBottomNav ? "bottom-40" : "bottom-20"
          )}
        >
          <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Tutup</span>
          </Dialog.Close>
          <Dialog.Title className="pr-8 text-xl font-semibold tracking-tight">
            Bantu perbaiki Landasan Teori
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Laporanmu dikirim langsung ke developer melalui Telegram.
          </Dialog.Description>

          {status === "success" ? (
            <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-5" role="status" aria-live="polite">
              <p className="font-semibold text-foreground">Pesan terkirim.</p>
              <p className="mt-1 text-sm text-muted-foreground">Terima kasih sudah membantu meningkatkan aplikasi ini.</p>
              <Button className="mt-5" onClick={() => setOpen(false)}>Selesai</Button>
            </div>
          ) : (
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <fieldset>
                <legend className="mb-2.5 text-sm font-medium">Jenis pesan</legend>
                <div className="grid grid-cols-2 gap-3">
                  {feedbackOptions.map((option) => {
                    const selected = type === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setType(option.value)}
                        className={cn(
                          "flex min-h-20 flex-col items-start justify-between rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-secondary"
                        )}
                        aria-pressed={selected}
                      >
                        <option.icon className="h-4 w-4" aria-hidden="true" />
                        <span className="text-xs font-semibold">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div className="space-y-2">
                <label htmlFor="feedback-message" className="text-sm font-medium">Pesan</label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={type === "bug" ? "Apa yang terjadi? Sertakan langkah untuk mengulanginya." : "Ide atau masukan kamu untuk aplikasi ini."}
                  minLength={3}
                  maxLength={1500}
                  required
                  disabled={status === "loading"}
                  className="min-h-32 w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-right text-xs text-muted-foreground">{message.length}/1500</p>
              </div>
              {status === "error" && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <Button type="submit" size="lg" variant="default" className="w-full" disabled={status === "loading" || message.trim().length < 3}>
                <Send className="h-4 w-4" aria-hidden="true" />
                {status === "loading" ? "Mengirim pesan..." : "Kirim ke developer"}
              </Button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
