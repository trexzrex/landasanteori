"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, Clock, FileText, Loader2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { MotionConfig, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { getEffectiveStatus } from "@/lib/generation-status";
import { useChartPalette } from "@/lib/chart-theme";
import { fadeUp, listContainer, listItem } from "@/lib/motion";
import type { Generation, Profile, UserQuota } from "@/lib/supabase/types";

function formatDay(date: Date) {
  return date.toLocaleDateString("id-ID", { weekday: "short" });
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [quota, setQuota] = React.useState<UserQuota | null>(null);
  const [generations, setGenerations] = React.useState<Generation[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [profileResult, generationsResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("generations").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (!profileResult.data?.onboarded) {
        router.push("/onboarding");
        return;
      }

      setProfile(profileResult.data);
      const allGens: Generation[] = generationsResult.data ?? [];
      setGenerations(allGens);

      // Hitung kuota harian mengikuti aturan server: semua generasi non-error
      // hari ini (WIB) memakan slot, termasuk yang masih diproses.
      const nowWibDate = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const todayUsedGens = allGens.filter((g) => {
        if (g.status === "error") return false;
        const genWibDate = new Date(new Date(g.created_at).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
        return genWibDate === nowWibDate;
      });

      const totalSuccessGens = allGens.filter((g) => g.status === "success").length;

      setQuota({
        user_id: user.id,
        daily_used: todayUsedGens.length,
        daily_limit: 5,
        total_used: totalSuccessGens,
        reset_date: nowWibDate,
        created_at: new Date().toISOString(),
      });
      setLoading(false);
    }

    void loadData();
  }, [router, supabase]);

  const [loadedAt] = React.useState(() => Date.now());

  const stats = React.useMemo(() => {
    const today = new Date().toDateString();
    const success = generations.filter((generation) => getEffectiveStatus(generation, loadedAt) === "success").length;
    return {
      total: generations.length,
      success,
      today: generations.filter((generation) => new Date(generation.created_at).toDateString() === today).length,
      successRate: generations.length ? Math.round((success / generations.length) * 100) : 0,
    };
  }, [generations, loadedAt]);

  const activityData = React.useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return { key: date.toDateString(), name: formatDay(date), Generasi: 0 };
    });
    const byDay = new Map(days.map((day) => [day.key, day]));
    generations.forEach((generation) => {
      const day = byDay.get(new Date(generation.created_at).toDateString());
      if (day) day.Generasi += 1;
    });
    return days;
  }, [generations]);

  const depthData = React.useMemo(() => ["singkat", "menengah", "mendalam"].map((depth) => ({
    name: depth.charAt(0).toUpperCase() + depth.slice(1),
    value: generations.filter((generation) => generation.kedalaman === depth).length,
  })), [generations]);

  const labData = React.useMemo(() => Object.entries(generations.reduce<Record<string, number>>((result, generation) => {
    result[generation.laboratorium] = (result[generation.laboratorium] ?? 0) + 1;
    return result;
  }, {})).sort(([, first], [, second]) => second - first).slice(0, 5).map(([name, value]) => ({ name, value })), [generations]);

  const level = quota && quota.total_used >= 50 ? "Peneliti Ahli" : quota && quota.total_used >= 15 ? "Peneliti Aktif" : "Peneliti Pemula";
  const recentGenerations = generations.slice(0, 5);
  const quotaPercent = quota?.daily_limit ? Math.min((quota.daily_used / quota.daily_limit) * 100, 100) : 0;
  const palette = useChartPalette();

  if (loading) {
    return (
      <DashboardShell>
        <div role="status" aria-live="polite" className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Memuat data dashboard...</span>
        </div>
      </DashboardShell>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <DashboardShell>
      <div className="space-y-8">
        <motion.div
          custom={0}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
        >
          <PageHeader
            title="Dashboard"
            description={`Halo, ${profile?.nama || "User"}. Pantau aktivitas generasi Anda.`}
          />
          <Button onClick={() => router.push("/generate")} className="shrink-0 gap-2">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Buat Landasan Teori
          </Button>
        </motion.div>

        <motion.div
          variants={listContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4"
        >
          {[
            { label: "Total Generasi", value: stats.total, icon: FileText, tone: "text-primary" },
            { label: "Berhasil", value: stats.success, icon: TrendingUp, tone: "text-success" },
            { label: "Hari Ini", value: stats.today, icon: Clock, tone: "text-chart-info" },
            { label: "Tingkat Berhasil", value: `${stats.successRate}%`, icon: ShieldCheck, tone: "text-warning" },
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

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full">
            <CardContent className="p-6">
              <h2 className="font-semibold">Aktivitas 7 Hari</h2>
              <p className="mb-5 text-sm text-muted-foreground">Jumlah permintaan generasi per hari</p>
              <div className="h-64" role="img" aria-label="Grafik batang aktivitas generasi 7 hari terakhir">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={palette.grid} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: palette.axis, fontSize: 12 }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: palette.axis, fontSize: 12 }} />
                    <Tooltip cursor={{ fill: palette.cursor }} />
                    <Bar dataKey="Generasi" fill={palette.primary} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div custom={2} initial="hidden" animate="show" variants={fadeUp}>
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning-surface">
                  <Award className="h-5 w-5 text-warning" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold">{level}</h2>
                  <p className="text-sm text-muted-foreground">{quota?.total_used ?? 0} generasi total</p>
                </div>
              </div>
              <div className="mt-6">
                {profile?.role === "admin" ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-center">
                    <p className="text-sm font-medium text-primary">Tanpa Batas</p>
                    <p className="mt-1 text-xs text-muted-foreground">Admin tidak terikat kuota harian.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Kuota hari ini</span>
                      <span className="font-medium">{quota?.daily_used ?? 0}/{quota?.daily_limit ?? 0}</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-secondary"
                      role="progressbar"
                      aria-valuenow={quota?.daily_used ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={quota?.daily_limit ?? 0}
                      aria-label="Pemakaian kuota harian"
                    >
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${quotaPercent}%` }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Kuota direset setiap hari.</p>
                  </>
                )}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{level}</span>
                {stats.success >= 10 && (
                  <span className="rounded-full bg-success-surface px-3 py-1 text-xs font-medium text-success">
                    10 Generasi Sukses
                  </span>
                )}
                {stats.today > 0 && (
                  <span className="rounded-full bg-chart-info/10 px-3 py-1 text-xs font-medium text-chart-info">
                    Aktif Hari Ini
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp}>
          <Card className="h-full">
            <CardContent className="p-6">
              <h2 className="font-semibold">Kedalaman Analisis</h2>
              <p className="mb-3 text-sm text-muted-foreground">Distribusi pilihan kedalaman</p>
              <div className="h-64" role="img" aria-label="Diagram lingkaran sebaran tingkat kedalaman teori">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={depthData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                      {depthData.map((item, index) => (
                        <Cell key={item.name} fill={palette.series[index % palette.series.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {depthData.map((item, index) => (
                  <span key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <i className="h-2.5 w-2.5 rounded-full" style={{ background: palette.series[index % palette.series.length] }} />
                    {item.name}: {item.value}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div custom={4} initial="hidden" animate="show" variants={fadeUp}>
          <Card className="h-full">
            <CardContent className="p-6">
              <h2 className="font-semibold">Laboratorium Teratas</h2>
              <p className="mb-5 text-sm text-muted-foreground">Lima laboratorium paling sering digunakan</p>
              <div className="h-72" role="img" aria-label="Grafik batang 5 laboratorium paling sering digunakan">
                {labData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={labData} layout="vertical" margin={{ left: 12 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={palette.grid} />
                      <XAxis type="number" allowDecimals={false} hide />
                      <YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} tick={{ fill: palette.axis, fontSize: 12 }} />
                      <Tooltip cursor={{ fill: palette.cursor }} />
                      <Bar dataKey="value" name="Generasi" fill={palette.series[1]} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Belum ada data laboratorium
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>

        <motion.div custom={5} initial="hidden" animate="show" variants={fadeUp} className="lg:hidden">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold">Buat Landasan Teori</h2>
                <p className="text-sm text-muted-foreground">Mulai generasi baru dari data analisis Anda.</p>
              </div>
            </div>
            <Button onClick={() => router.push("/generate")} className="mt-5 h-12 w-full gap-2 text-base">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              Mulai Generate
            </Button>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div custom={6} initial="hidden" animate="show" variants={fadeUp}>
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Riwayat Terbaru</h2>
              <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/history")}>
                Lihat Semua
              </Button>
            </div>
            {recentGenerations.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">Belum ada riwayat generasi.</div>
            ) : (
              <div className="space-y-3">
                {recentGenerations.map((generation) => {
                  const status = getEffectiveStatus(generation, loadedAt);
                  return (
                    <div key={generation.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/40">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{generation.judul_analisis}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(generation.created_at).toLocaleDateString("id-ID")} · {generation.kedalaman}
                        </p>
                      </div>
                      <div className="ml-4 shrink-0">
                        <StatusBadge status={status} />
                      </div>
                    </div>
                  );
                })}
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
