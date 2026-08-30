"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, IdCard, GraduationCap, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";
import { FormError } from "@/components/ui/form-error";
import { createClient } from "@/lib/supabase/client";

const onboardingSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(30, "Username maksimal 30 karakter")
    .regex(/^[a-z0-9_]+$/, "Username hanya boleh huruf kecil, angka, dan underscore"),
  nis: z.string().min(1, "NIS wajib diisi"),
  kelas: z.string().min(1, "Kelas wajib diisi"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type OnboardingData = z.infer<typeof onboardingSchema>;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const supabase = React.useMemo(() => createClient(), []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
  });

  React.useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
        if (fullName) {
          setValue("nama", fullName);
        }
      }
    };
    void loadUserData();
  }, [supabase, setValue]);

  const onSubmit = async (data: OnboardingData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (passwordError) {
        setError(passwordError.message);
        setIsLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          nama: data.nama,
          username: data.username.toLowerCase(),
          nis: data.nis,
          kelas: data.kelas,
          password_set: true,
          onboarded: true,
        })
        .eq("id", user.id);

      if (updateError) {
        if (updateError.code === "23505") {
          setError("Username sudah digunakan. Pilih username lain.");
        } else {
          setError("Gagal menyimpan data. Silakan coba lagi.");
        }
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "signup" ? "Selamat Datang!" : "Lengkapi Profil"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Lengkapi data identitas dan buat password untuk melanjutkan.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="nama">Nama Lengkap</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="nama"
              placeholder="Masukkan nama lengkap"
              className="pl-9"
              error={errors.nama?.message}
              disabled={isLoading}
              {...register("nama")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="username"
              placeholder="contoh: john_doe123"
              className="pl-9"
              error={errors.username?.message}
              disabled={isLoading}
              autoComplete="username"
              {...register("username")}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Hanya huruf kecil, angka, dan underscore (3-30 karakter).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nis">NIS / NIP</Label>
            <div className="relative">
              <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="nis"
                placeholder="Nomor Induk"
                className="pl-9"
                error={errors.nis?.message}
                disabled={isLoading}
                {...register("nis")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kelas">Kelas / Grade</Label>
            <div className="relative">
              <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="kelas"
                placeholder="Contoh: XII-KA"
                className="pl-9"
                error={errors.kelas?.message}
                disabled={isLoading}
                {...register("kelas")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password Baru</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              placeholder="Minimal 8 karakter"
              className="pl-9"
              error={errors.password?.message}
              disabled={isLoading}
              autoComplete="new-password"
              {...register("password")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Ulangi password"
              className="pl-9"
              error={errors.confirmPassword?.message}
              disabled={isLoading}
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
          </div>
        </div>

        <FormError>{error}</FormError>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Menyimpan...
            </>
          ) : (
            "Simpan & Lanjutkan"
          )}
        </Button>
      </form>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center">Memuat...</div>}>
      <AuthShell>
        <OnboardingContent />
      </AuthShell>
    </React.Suspense>
  );
}
