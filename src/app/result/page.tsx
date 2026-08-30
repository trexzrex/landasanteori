"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Download,
  RefreshCw,
  FileText,
  BookMarked,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { MotionConfig, motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storedResultSchema, type StoredResultData } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: EASE },
  }),
};

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const generationId = searchParams.get("id");
  const [data, setData] = React.useState<StoredResultData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [pdfError, setPdfError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadResult() {
      const supabase = createClient();

      if (generationId) {
        const { data: generation } = await supabase
          .from("generations")
          .select("*")
          .eq("id", generationId)
          .single();

        if (cancelled) return;

        if (generation?.landasan_teori && generation.status === "success") {
          const parsed = storedResultSchema.safeParse({
            generation_id: generation.id,
            landasan_teori: generation.landasan_teori,
            daftar_pustaka: Array.isArray(generation.daftar_pustaka)
              ? generation.daftar_pustaka
              : [],
            meta: {
              judul_analisis: generation.judul_analisis,
              kedalaman_teori: generation.kedalaman,
              generated_at: generation.created_at,
            },
          });

          if (parsed.success) {
            setData(parsed.data);
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("generation_events").insert({
                generation_id: generation.id,
                user_id: user.id,
                type: "view",
              });
            }
            setIsLoading(false);
            return;
          }
        }
      }

      const stored = window.sessionStorage.getItem("landasan_teori_result");
      if (stored) {
        try {
          const parsed = storedResultSchema.safeParse(JSON.parse(stored));
          if (parsed.success) {
            if (!cancelled) {
              setData(parsed.data);
              setIsLoading(false);
              return;
            }
          } else {
            console.warn("Result sessionStorage parse failed:", parsed.error.issues);
          }
        } catch (err) {
          console.warn("Result sessionStorage read failed:", err);
        }
      }

      if (!cancelled) {
        setIsLoading(false);
        // Jika ada id, hasil mungkin sudah dihapus/akses ditolak — kembalikan
        // ke riwayat. Tanpa id (sesi baru tanpa data) kembali ke generator.
        router.replace(generationId ? "/dashboard/history" : "/generate");
      }
    }

    void loadResult();
    return () => {
      cancelled = true;
    };
  }, [generationId, router]);

  const handleDownloadPdf = async () => {
    if (!data) return;
    setIsGeneratingPdf(true);
    setPdfError(null);

    try {
      const [{ pdf }, { PdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/pdf-document"),
      ]);
      const blob = await pdf(
        <PdfDocument
          landasanTeori={data.landasan_teori}
          daftarPustaka={data.daftar_pustaka}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `landasan-teori-${timestamp}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (data.generation_id) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("generation_events").insert({
            generation_id: data.generation_id,
            user_id: user.id,
            type: "pdf_export",
          });
        }
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      setPdfError("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleRegenerate = () => {
    sessionStorage.removeItem("landasan_teori_result");
    router.push("/generate");
  };

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="shimmer mx-auto h-12 w-12 rounded-full" />
          <p className="mt-4 text-sm text-muted-foreground">Memuat hasil...</p>
        </div>
      </div>
    );
  }

  const renderTextWithCitations = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, idx) => {
      if (/^\[\d+\]$/.test(part)) {
        const num = part.replace(/[\[\]]/g, "");
        return (
          <a
            key={idx}
            href={`#ref-${num}`}
            className="inline-flex h-4 w-auto min-w-[1rem] items-center justify-center rounded bg-primary/10 px-1 text-[10px] font-semibold text-primary no-underline hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <sup>{num}</sup>
          </a>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const paragraphs = data.landasan_teori
    .split("\n")
    .filter((p) => p.trim().length > 0);

  return (
    <MotionConfig reducedMotion="user">
      <Navbar />
      <main id="main-content" className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            custom={0}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mb-8 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-5"
          >
            <CheckCircle2
              className="h-5 w-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="font-semibold">Landasan Teori Berhasil Dibuat!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Periksa preview di bawah, lalu unduh PDF jika sudah sesuai.
              </p>
            </div>
          </motion.div>

          <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />
                  Informasi Dokumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-col gap-1 min-[360px]:flex-row min-[360px]:justify-between min-[360px]:gap-4">
                  <span className="shrink-0 text-muted-foreground">Judul Analisis:</span>
                  <span className="break-words font-medium min-[360px]:text-right">
                    {data.meta.judul_analisis}
                  </span>
                </div>
                <div className="flex flex-col gap-1 min-[360px]:flex-row min-[360px]:justify-between min-[360px]:gap-4">
                  <span className="shrink-0 text-muted-foreground">Kedalaman:</span>
                  <span className="font-medium capitalize">{data.meta.kedalaman_teori}</span>
                </div>
                <div className="flex flex-col gap-1 min-[360px]:flex-row min-[360px]:justify-between min-[360px]:gap-4">
                  <span className="shrink-0 text-muted-foreground">Dibuat pada:</span>
                  <span className="font-medium min-[360px]:text-right">
                    {new Date(data.meta.generated_at).toLocaleString("id-ID", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={2} initial="hidden" animate="show" variants={fadeUp}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-center text-xl font-bold uppercase tracking-wide">
                  LANDASAN TEORI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-justify leading-relaxed">
                  {paragraphs.map((p, idx) => (
                    <p key={idx} className="text-foreground">
                      {renderTextWithCitations(p)}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp}>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-center text-xl font-bold uppercase tracking-wide">
                  <BookMarked
                    className="h-5 w-5 text-primary"
                    aria-hidden="true"
                  />
                  DAFTAR PUSTAKA
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.daftar_pustaka.length > 0 ? (
                  <ol className="space-y-3 text-sm leading-relaxed">
                    {data.daftar_pustaka.map((ref, idx) => (
                      <li key={idx} id={`ref-${idx + 1}`} className="flex gap-3 scroll-mt-20">
                        <span className="shrink-0 font-semibold text-primary">
                          [{idx + 1}]
                        </span>
                        <span className="text-foreground">{ref}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                    <AlertCircle
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="text-muted-foreground">
                      Daftar pustaka tidak tersedia. Ini mungkin terjadi jika
                      API belum sepenuhnya terintegrasi.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {pdfError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              <div>
                <p className="font-medium text-destructive">Tidak dapat memproses</p>
                <p className="mt-1 text-destructive/90">{pdfError}</p>
              </div>
            </motion.div>
          )}

          <motion.div
            custom={4}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={handleRegenerate}
              disabled={isGeneratingPdf}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Buat Ulang
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto sm:min-w-[200px]"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="shimmer h-4 w-4 rounded-full" />
                  Membuat PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Unduh PDF
                </>
              )}
            </Button>
          </motion.div>

          <div className="mt-8 text-center">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </MotionConfig>
  );
}

export default function ResultPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="shimmer mx-auto h-12 w-12 rounded-full" />
            <p className="mt-4 text-sm text-muted-foreground">Memuat hasil...</p>
          </div>
        </div>
      }
    >
      <ResultContent />
    </React.Suspense>
  );
}
