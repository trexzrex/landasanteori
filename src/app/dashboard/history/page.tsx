"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { MotionConfig, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { getEffectiveStatus } from "@/lib/generation-status";
import { fadeUp, listContainer, listItem } from "@/lib/motion";
import type { Generation } from "@/lib/supabase/types";

export default function HistoryPage() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [generations, setGenerations] = React.useState<Generation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    async function loadGenerations() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data } = await supabase
          .from("generations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (data) setGenerations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    void loadGenerations();
  }, [router, supabase]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const { error } = await supabase.from("generations").delete().eq("id", deleteId);
      if (error) throw error;
      setGenerations((prev) => prev.filter((g) => g.id !== deleteId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleDownload = async (gen: Generation) => {
    if (!gen.landasan_teori) return;

    try {
      const [{ pdf }, { PdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/pdf-document"),
      ]);

      const blob = await pdf(
        <PdfDocument
          landasanTeori={gen.landasan_teori}
          daftarPustaka={gen.daftar_pustaka ?? []}
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

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("generation_events").insert({
          generation_id: gen.id,
          user_id: user.id,
          type: "pdf_export",
        });
      }
    } catch (err) {
      console.error("PDF download failed:", err);
    }
  };

  const handleView = (gen: Generation) => {
    sessionStorage.setItem(
      "landasan_teori_result",
      JSON.stringify({
        generation_id: gen.id,
        landasan_teori: gen.landasan_teori,
        daftar_pustaka: gen.daftar_pustaka ?? [],
        meta: {
          judul_analisis: gen.judul_analisis,
          kedalaman_teori: gen.kedalaman,
          generated_at: gen.created_at,
        },
      })
    );
    router.push(`/result?id=${gen.id}`);
  };

  const [loadedAt] = React.useState(() => Date.now());

  if (loading) {
    return (
      <DashboardShell>
        <div role="status" aria-live="polite" className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Memuat riwayat generasi...</span>
        </div>
      </DashboardShell>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <DashboardShell>
      <PageHeader
        title="Riwayat Generasi"
        description={`Total ${generations.length} generasi`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Riwayat" },
        ]}
      />

      {generations.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
            <p className="mt-4 text-muted-foreground">Belum ada riwayat generasi</p>
            <Button className="mt-4" onClick={() => router.push("/generate")}>
              Buat Sekarang
            </Button>
          </CardContent>
        </Card>
        </motion.div>
      ) : (
        <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-4">
          {generations.map((gen) => {
            const status = getEffectiveStatus(gen, loadedAt);
            return (
              <motion.div key={gen.id} variants={listItem}>
              <Card className="transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{gen.judul_analisis}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{new Date(gen.created_at).toLocaleDateString("id-ID", { dateStyle: "long" })}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{gen.kedalaman}</span>
                        {status === "success" && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{gen.word_count} kata</span>
                            <span aria-hidden="true">·</span>
                            <span>{gen.jumlah_jurnal} jurnal</span>
                          </>
                        )}
                        {gen.model_used && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-[11px]">{gen.model_used}</span>
                          </>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusBadge status={status} />
                        {status === "error" && (
                          <span className="text-xs text-destructive/90 max-w-md truncate">
                            {gen.error_message || "Proses terhenti atau waktu habis."}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {status === "success" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label="Lihat hasil"
                            onClick={() => handleView(gen)}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <FileText className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label="Unduh PDF"
                            onClick={() => handleDownload(gen)}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <Download className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label="Hapus generasi"
                        onClick={() => setDeleteId(gen.id)}
                        className="min-h-[44px] min-w-[44px]"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Dialog.Root open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <Dialog.Title className="text-lg font-semibold">Hapus Generasi</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              Tindakan ini tidak dapat dibatalkan. Generasi akan dihapus permanen.
            </Dialog.Description>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Menghapus...</> : "Hapus"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </DashboardShell>
    </MotionConfig>
  );
}
