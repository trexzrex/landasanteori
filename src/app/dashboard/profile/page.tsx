"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, IdCard, Loader2, Mail, Save, User } from "lucide-react";
import { MotionConfig, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { FormError } from "@/components/ui/form-error";
import { createClient } from "@/lib/supabase/client";
import { fadeUp } from "@/lib/motion";
import type { Profile } from "@/lib/supabase/types";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [nama, setNama] = React.useState("");
  const [nis, setNis] = React.useState("");
  const [kelas, setKelas] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data);
        setNama(data.nama ?? "");
        setNis(data.nis ?? "");
        setKelas(data.kelas ?? "");
      }
      setLoading(false);
    }
    void loadProfile();
  }, [router, supabase]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          nama: nama.trim(),
          nis: nis.trim(),
          kelas: kelas.trim(),
        })
        .eq("id", profile.id)
        .select("*")
        .single();

      if (updateError) {
        setError("Gagal menyimpan profil. Silakan coba lagi.");
      } else if (data) {
        setProfile(data);
        setSuccess(true);
      }
    } catch {
      setError("Terjadi kesalahan koneksi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div role="status" aria-live="polite" className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Memuat profil...</span>
        </div>
      </DashboardShell>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp}>
        <PageHeader
          title="Profil Saya"
          description="Kelola informasi akun Anda."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Profil" },
          ]}
        />
        </motion.div>

        <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp}>
        <Card className="transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
          <CardContent className="p-6">
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold">{profile?.nama || "User"}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.role === "admin" ? "Administrator" : "Pengguna"}
                </p>
              </div>
            </div>

            <form className="space-y-5 border-t pt-6" onSubmit={handleSave}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="email" value={profile?.email ?? ""} className="pl-9" disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="nama"
                    value={nama}
                    onChange={(event) => setNama(event.target.value)}
                    className="pl-9"
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nis">NIS / NIP</Label>
                  <div className="relative">
                    <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="nis"
                      value={nis}
                      onChange={(event) => setNis(event.target.value)}
                      className="pl-9"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kelas">Kelas / Grade</Label>
                  <div className="relative">
                    <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="kelas"
                      value={kelas}
                      onChange={(event) => setKelas(event.target.value)}
                      className="pl-9"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              <FormError>{error}</FormError>

              {success && (
                <div role="status" className="rounded-lg border border-success/20 bg-success-surface px-3 py-2 text-xs text-success">
                  Profil berhasil disimpan.
                </div>
              )}

              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                Simpan Perubahan
              </Button>
            </form>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </DashboardShell>
    </MotionConfig>
  );
}
