"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Building2,
  BookText,
  Tags,
  Loader2,
  Sparkles,
  FileText,
  Layers,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  generateFormSchema,
  LABORATORIUM_PRESETS,
  type GenerateFormData,
  type GenerateResponse,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { GenerationLoadingDialog } from "@/components/generation-loading-dialog";
import { createClient } from "@/lib/supabase/client";

const depthOptions = [
  {
    value: "singkat" as const,
    label: "Singkat",
    description: "±300 kata (± 1 halaman A4)",
    icon: FileText,
  },
  {
    value: "menengah" as const,
    label: "Menengah",
    description: "±600 kata (± 2 halaman A4)",
    icon: Layers,
  },
  {
    value: "mendalam" as const,
    label: "Mendalam",
    description: "±1000+ kata (± 3+ halaman A4)",
    icon: BookOpen,
  },
];

const loadingSteps = [
  "Memvalidasi input...",
  "Mencari jurnal open access di OpenAlex...",
  "Mengumpulkan abstrak referensi tepercaya...",
  "Menyusun landasan teori dengan AI...",
  "Memformat daftar pustaka gaya APA...",
];

export function GenerateForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingStep, setLoadingStep] = React.useState(0);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [abortController, setAbortController] = React.useState<AbortController | null>(null);

  const [profileData, setProfileData] = React.useState<{
    nama: string;
    nis: string;
    kelas: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateFormSchema),
    defaultValues: {
      nama: "",
      nis: "",
      kelas: "",
      laboratorium: "",
      judul_analisis: "",
      kata_kunci: "",
      kedalaman_teori: "menengah",
    },
  });

  const currentLab = watch("laboratorium");
  const [isCustomLab, setIsCustomLab] = React.useState(false);
  const [customLabText, setCustomLabText] = React.useState("");

  const handleSelectLab = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__custom__") {
      setIsCustomLab(true);
      setValue("laboratorium", customLabText, { shouldValidate: Boolean(customLabText) });
    } else {
      setIsCustomLab(false);
      setValue("laboratorium", val, { shouldValidate: true });
    }
  };

  const handleCustomLabChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomLabText(val);
    setValue("laboratorium", val, { shouldValidate: true });
  };

  React.useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("nama, nis, kelas")
        .eq("id", user.id)
        .single();

      if (!profile || cancelled) return;

      setProfileData({
        nama: profile.nama || "-",
        nis: profile.nis || "-",
        kelas: profile.kelas || "-",
      });

      reset((current) => ({
        ...current,
        nama: profile.nama ?? current.nama,
        nis: profile.nis ?? current.nis,
        kelas: profile.kelas ?? current.kelas,
      }));
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  React.useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    const stepTimer = setInterval(
      () => setLoadingStep((prev) => (prev + 1) % loadingSteps.length),
      3000
    );
    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
    };
  }, [isLoading]);

  const handleDepthKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
    onChange: (value: GenerateFormData["kedalaman_teori"]) => void
  ) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (currentIndex + direction + depthOptions.length) % depthOptions.length;
    onChange(depthOptions[nextIndex].value);
    document.getElementById(`kedalaman-${depthOptions[nextIndex].value}`)?.focus();
  };

  const onSubmit = async (data: GenerateFormData) => {
    setIsLoading(true);
    setLoadingStep(0);
    setElapsedSeconds(0);
    setServerError(null);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const kataKunciArray = data.kata_kunci
        ? data.kata_kunci
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : [];

      const payload = {
        user_info: {
          nama: data.nama,
          nis: data.nis,
          kelas: data.kelas,
          laboratorium: data.laboratorium,
        },
        analysis_data: {
          judul_analisis: data.judul_analisis,
          kata_kunci: kataKunciArray,
        },
        settings: {
          kedalaman_teori: data.kedalaman_teori,
        },
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const result: GenerateResponse = await res.json();

      if (result.status === "error" || !result.data) {
        setServerError(
          result.message ||
            "Terjadi kesalahan tak terduga. Silakan coba lagi."
        );
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem(
        "landasan_teori_result",
        JSON.stringify({
          generation_id: result.data.generation_id ?? null,
          landasan_teori: result.data.landasan_teori,
          daftar_pustaka: result.data.daftar_pustaka,
          meta: {
            judul_analisis: data.judul_analisis,
            kedalaman_teori: data.kedalaman_teori,
            generated_at: new Date().toISOString(),
          },
        })
      );

      if (result.data.generation_id) {
        router.push(`/result?id=${result.data.generation_id}`);
      } else {
        router.push("/result");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsLoading(false);
        return;
      }
      console.error(err);
      setServerError(
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi."
      );
      setIsLoading(false);
    } finally {
      setAbortController(null);
    }
  };

  const handleCancelGeneration = () => {
    abortController?.abort();
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {/* ── Data Pengguna ─────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Data Pengguna</h2>
                <p className="text-xs text-muted-foreground">
                  Identitas Anda diambil dari profil akun.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:underline"
            >
              Ubah di profil
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/40 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Nama Analis</p>
              <p className="mt-0.5 text-sm font-semibold">{profileData?.nama || "Memuat..."}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">NIS / NIP</p>
              <p className="mt-0.5 text-sm font-semibold">{profileData?.nis || "Memuat..."}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Kelas / Grade</p>
              <p className="mt-0.5 text-sm font-semibold">{profileData?.kelas || "Memuat..."}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="laboratorium-select">
              Laboratorium <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Building2
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10"
                aria-hidden="true"
              />
              <Select
                id="laboratorium-select"
                className="pl-9"
                value={isCustomLab ? "__custom__" : (LABORATORIUM_PRESETS.includes(currentLab as typeof LABORATORIUM_PRESETS[number]) ? currentLab : (currentLab ? "__custom__" : ""))}
                onChange={handleSelectLab}
                error={!isCustomLab ? errors.laboratorium?.message : undefined}
                disabled={isLoading}
                aria-required="true"
              >
                <option value="" disabled>
                  -- Pilih Laboratorium --
                </option>
                {LABORATORIUM_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
                <option value="__custom__">Lainnya (Tulis Manual)...</option>
              </Select>
            </div>

            {isCustomLab && (
              <div className="pt-1.5 animate-in fade-in-50 duration-200">
                <Input
                  id="laboratorium"
                  placeholder="Ketik nama laboratorium lainnya..."
                  value={customLabText}
                  onChange={handleCustomLabChange}
                  error={errors.laboratorium?.message}
                  aria-required="true"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Data Analisis ─────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookText className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Data Analisis</h2>
              <p className="text-xs text-muted-foreground">
                Konteks yang akan digunakan AI untuk mencari referensi jurnal.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="judul_analisis">
              Judul Analisis <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="judul_analisis"
              placeholder='Contoh: "Penentuan Kadar Besi (Fe) dalam Air Minum menggunakan Spektrofotometer UV-Vis"'
              rows={3}
              error={errors.judul_analisis?.message}
              aria-required="true"
              disabled={isLoading}
              {...register("judul_analisis")}
            />
            <p className="text-xs text-muted-foreground">
              Semakin spesifik, semakin akurat jurnal yang ditemukan. Maks. 200
              karakter.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kata_kunci">Kata Kunci (Opsional)</Label>
            <div className="relative">
              <Tags
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="kata_kunci"
                placeholder="Contoh: spektrofotometri, kolorimetri, fenantrolin"
                className="pl-9"
                error={errors.kata_kunci?.message}
                disabled={isLoading}
                {...register("kata_kunci")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Pisahkan dengan koma. Membantu memandu pencarian AI ke sub-topik
              spesifik.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Kedalaman Teori ───────────────────────────────── */}
      <Card>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Kedalaman Teori</h2>
              <p className="text-xs text-muted-foreground">
                Semakin dalam, semakin panjang teks — dan semakin lama proses
                pembuatannya.
              </p>
            </div>
          </div>

          <Controller
            control={control}
            name="kedalaman_teori"
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-label="Tingkat kedalaman teori"
                className="grid grid-cols-1 gap-3 sm:grid-cols-3"
              >
                {depthOptions.map((opt, index) => {
                  const selected = field.value === opt.value;
                  return (
                    <button
                      type="button"
                      id={`kedalaman-${opt.value}`}
                      key={opt.value}
                      role="radio"
                      aria-checked={selected}
                      tabIndex={selected ? 0 : -1}
                      onKeyDown={(event) => handleDepthKeyDown(event, index, field.onChange)}
                      onClick={() => field.onChange(opt.value)}
                      disabled={isLoading}
                      className={cn(
                        "group relative flex flex-col items-start gap-2 rounded-lg border-2 bg-card p-4 text-left transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        selected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50 hover:bg-secondary/50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        )}
                      >
                        <opt.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-semibold">{opt.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {opt.description}
                        </p>
                      </div>
                      {selected && (
                        <span
                          aria-hidden="true"
                          className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.kedalaman_teori && (
            <p role="alert" className="text-xs text-destructive">
              {errors.kedalaman_teori.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Server Error ──────────────────────────────────── */}
      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-5 py-4 text-sm text-destructive-foreground"
        >
          <p className="font-medium text-destructive">Tidak dapat memproses</p>
          <p className="mt-1 text-destructive/90">{serverError}</p>
        </div>
      )}

      {/* ── Submit ────────────────────────────────────────── */}
      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Batas pemakaian: 5 generasi per hari per akun.
        </p>
        <Button
          type="submit"
          size="lg"
          variant="default"
          disabled={isLoading}
          className="w-full sm:w-auto sm:min-w-[220px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Menyiapkan dokumen...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Generate Landasan Teori
            </>
          )}
        </Button>
      </div>

      <GenerationLoadingDialog
        open={isLoading}
        currentStep={loadingStep}
        elapsedSeconds={elapsedSeconds}
        steps={loadingSteps}
        onCancel={handleCancelGeneration}
      />
    </form>
  );
}
