"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DEFAULT_MAINTENANCE_MESSAGE } from "@/lib/maintenance-policy";

export function MaintenanceSettings() {
  const [enabled, setEnabled] = React.useState(false);
  const [message, setMessage] = React.useState(DEFAULT_MAINTENANCE_MESSAGE);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [available, setAvailable] = React.useState(false);
  const [savedEnabled, setSavedEnabled] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [error, setError] = React.useState("");
  const [confirming, setConfirming] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/maintenance", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.available) throw new Error("Pengaturan belum tersedia. Jalankan migrasi maintenance atau periksa koneksi database.");
      setEnabled(data.enabled);
      setSavedEnabled(data.enabled);
      setMessage(data.message);
      setAvailable(true);
    } catch (err) {
      setAvailable(false);
      setError(err instanceof Error ? err.message : "Gagal memuat pengaturan.");
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/maintenance", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, message: message.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Pengaturan belum tersimpan.");
      setSavedEnabled(data.enabled);
      setMessage(data.message);
      setNotice(data.enabled ? "Maintenance aktif. Pengguna biasa tidak dapat menggunakan aplikasi." : "Maintenance nonaktif. Pengguna dapat menggunakan aplikasi kembali.");
      setConfirming(false);
      window.dispatchEvent(new Event("maintenance-updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan pengaturan.");
    } finally { setSaving(false); }
  };

  return (
    <Card>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="flex items-center gap-2 text-lg font-semibold"><Wrench className="h-5 w-5 text-primary" aria-hidden="true" />Mode Maintenance</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Tutup sementara akses pengguna. Admin tetap dapat masuk dan mencoba seluruh fitur.</p></div>
          <span className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{loading ? "Memuat..." : !available ? "Belum tersedia" : savedEnabled ? "Aktif" : "Nonaktif"}</span>
        </div>
        {loading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Memuat pengaturan...</p> : <>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium"><input type="checkbox" role="switch" checked={enabled} disabled={!available || saving} onChange={(e) => { setEnabled(e.target.checked); setNotice(""); }} className="h-5 w-5 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />Aktifkan maintenance</label>
          <div className="space-y-2"><Label htmlFor="maintenance-message">Pesan untuk pengguna</Label><textarea id="maintenance-message" value={message} onChange={(e) => { setMessage(e.target.value); setNotice(""); }} disabled={!available || saving} maxLength={1000} rows={3} className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" aria-describedby="maintenance-message-help" /><p id="maintenance-message-help" className="text-xs text-muted-foreground">3–1000 karakter. Pengguna yang sedang online diperiksa ulang setiap 15 detik.</p></div>
          <div className="flex flex-wrap gap-3"><Button disabled={!available || saving || message.trim().length < 3} onClick={() => { if (enabled && !savedEnabled) setConfirming(true); else void save(); }}>{saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{saving ? "Menyimpan..." : "Simpan pengaturan"}</Button>{!available && <Button variant="outline" onClick={() => void load()}>Muat ulang</Button>}</div>
        </>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="text-sm text-success">{notice}</p>}
        <Dialog.Root open={confirming} onOpenChange={(open) => { if (!saving) setConfirming(open); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card p-6 text-card-foreground shadow-xl"><Dialog.Title className="text-lg font-semibold">Aktifkan maintenance?</Dialog.Title><Dialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">Pengguna biasa akan kehilangan akses sementara ke dashboard, generator, hasil, dan riwayat. Anda tetap dapat mengakses aplikasi sebagai admin.</Dialog.Description><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Dialog.Close asChild><Button variant="outline" disabled={saving}>Batal</Button></Dialog.Close><Button onClick={() => void save()} disabled={saving}>{saving ? "Mengaktifkan..." : "Ya, aktifkan"}</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
      </CardContent>
    </Card>
  );
}
