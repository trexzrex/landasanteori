"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { FileText, Loader2, ShieldAlert, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { getEffectiveStatus } from "@/lib/generation-status";
import { useChartPalette } from "@/lib/chart-theme";
import { fadeUp, listContainer, listItem } from "@/lib/motion";
import type { Generation, Profile } from "@/lib/supabase/types";

export default function AdminPage() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [generations, setGenerations] = React.useState<Generation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [unauthorized, setUnauthorized] = React.useState(false);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [loadedAt] = React.useState(() => Date.now());
  const palette = useChartPalette();
  const statusColors = React.useMemo(
    () => [palette.success, palette.danger, palette.warning],
    [palette]
  );

  React.useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: currentProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (currentProfile?.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      const [profilesResult, generationsResult] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("generations").select("*").order("created_at", { ascending: false }),
      ]);
      setProfiles(profilesResult.data ?? []);
      setGenerations(generationsResult.data ?? []);
      setLoading(false);
    }
    void loadData();
  }, [router, supabase]);

  const stats = React.useMemo(() => {
    const success = generations.filter((item) => getEffectiveStatus(item, loadedAt) === "success").length;
    const error = generations.filter((item) => getEffectiveStatus(item, loadedAt) === "error").length;
    return {
      total: generations.length,
      success,
      error,
      rate: generations.length ? Math.round((success / generations.length) * 100) : 0,
    };
  }, [generations, loadedAt]);

  const errorData = React.useMemo(
    () =>
      [
        { name: "Berhasil", value: stats.success },
        { name: "Gagal", value: stats.error },
        { name: "Diproses", value: generations.filter((item) => getEffectiveStatus(item, loadedAt) === "pending").length },
      ].filter((item) => item.value > 0),
    [generations, loadedAt, stats]
  );

  const updateRole = async (id: string, role: Profile["role"]) => {
    setUpdatingId(id);
    const { data } = await supabase.from("profiles").update({ role }).eq("id", id).select("*").single();
    if (data) {
      setProfiles((current) => current.map((profile) => (profile.id === id ? data : profile)));
    }
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <DashboardShell>
        <div role="status" aria-live="polite" className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Memuat data admin...</span>
        </div>
      </DashboardShell>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-destructive" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">Akses Ditolak</h2>
            <p className="mt-2 text-sm text-muted-foreground">Akun ini bukan administrator.</p>
            <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Kembali ke Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          title="Admin Dashboard"
          description="Pantau penggunaan sistem dan kelola akun pengguna."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Admin" },
          ]}
        />

        <motion.div
          variants={listContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4"
        >
          {[
            { label: "Total Generasi", value: stats.total, icon: FileText, tone: "text-primary" },
            { label: "Pengguna", value: profiles.length, icon: Users, tone: "text-chart-info" },
            { label: "Tingkat Berhasil", value: `${stats.rate}%`, icon: TrendingUp, tone: "text-success" },
            { label: "Generasi Gagal", value: stats.error, icon: ShieldAlert, tone: "text-destructive" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <motion.div key={label} variants={listItem}>
            <Card className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp}>
          <Card className="h-full">
            <CardContent className="p-6">
              <h2 className="font-semibold">Status Generasi</h2>
              <p className="mb-3 text-sm text-muted-foreground">Breakdown hasil proses generasi</p>
              <div className="h-64" role="img" aria-label="Diagram status generasi">
                {errorData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={errorData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                        {errorData.map((item, index) => (
                          <Cell key={item.name} fill={statusColors[index % statusColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Belum ada data
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {errorData.map((item, index) => (
                  <span key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <i className="h-2.5 w-2.5 rounded-full" style={{ background: statusColors[index % statusColors.length] }} />
                    {item.name}: {item.value}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div custom={2} initial="hidden" animate="show" variants={fadeUp}>
          <Card className="h-full">
            <CardContent className="p-6">
              <h2 className="font-semibold">Daftar Pengguna ({profiles.length})</h2>
              <p className="mb-4 text-sm text-muted-foreground">Kelola hak akses role pengguna</p>
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{profile.nama || profile.username || "Tanpa Nama"}</p>
                      <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
                        {profile.role}
                      </span>
                      <button
                        type="button"
                        disabled={updatingId === profile.id}
                        onClick={() => updateRole(profile.id, profile.role === "admin" ? "user" : "admin")}
                        aria-label={`${profile.role === "admin" ? "Jadikan User" : "Jadikan Admin"}: ${profile.nama || profile.username || profile.email}`}
                        className="inline-flex min-h-[44px] items-center rounded border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
                      >
                        {updatingId === profile.id ? "..." : profile.role === "admin" ? "Jadikan User" : "Jadikan Admin"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>

        <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp}>
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Semua Generasi Terbaru</h2>
            {generations.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Belum ada data generasi.</div>
            ) : (
              <div className="space-y-3">
                {generations.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-secondary/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.judul_analisis}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("id-ID")} · {item.laboratorium} · {item.kedalaman}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={getEffectiveStatus(item, loadedAt)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </DashboardShell>
    </MotionConfig>
  );
}
