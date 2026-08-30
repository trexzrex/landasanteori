"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { createClient } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";

  const [activeTab, setActiveTab] = React.useState<"masuk" | "daftar">("masuk");
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoginLoading, setIsLoginLoading] = React.useState(false);
  const [isSignupLoading, setIsSignupLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [emailSent, setEmailSent] = React.useState(false);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);

  const supabase = React.useMemo(() => createClient(), []);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const nextTab = activeTab === "masuk" ? "daftar" : "masuk";
      setActiveTab(nextTab);
      setError(null);
      setEmailSent(false);
      document.getElementById(`tab-${nextTab}`)?.focus();
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (error) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Username/email dan password harus diisi.");
      return;
    }
    setIsLoginLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Username/email atau password salah.");
        setIsLoginLoading(false);
        return;
      }

      // Sesi sudah ditulis ke cookie oleh route handler; segarkan state klien.
      await supabase.auth.getSession();
      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoginLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    setIsSignupLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });

    if (error) {
      setError(error.message);
      setIsSignupLoading(false);
      return;
    }

    sessionStorage.setItem("otp_email", email.trim());
    sessionStorage.setItem("otp_next", nextPath);
    sessionStorage.setItem("otp_mode", "signup");
    setEmailSent(true);
    setIsSignupLoading(false);

    setTimeout(() => {
      router.push(`/verify?email=${encodeURIComponent(email.trim())}&next=${encodeURIComponent(nextPath)}&mode=signup`);
    }, 800);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const resetEmail = identifier.trim();
    if (!resetEmail || !resetEmail.includes("@")) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    setIsLoginLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setIsLoginLoading(false);
      return;
    }

    setEmailSent(true);
    setIsLoginLoading(false);
  };

  if (showForgotPassword) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lupa Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Masukkan email untuk menerima tautan reset.</p>
        </div>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="reset-email"
                type="email"
                placeholder="nama@email.com"
                className="pl-9"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoginLoading || emailSent}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <FormError>{error}</FormError>

          {emailSent && (
            <div role="status" className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
              Link reset password telah dikirim ke email Anda.
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isLoginLoading || emailSent}>
            {isLoginLoading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Mengirim...</> : "Kirim Link Reset"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setShowForgotPassword(false);
              setError(null);
              setEmailSent(false);
              setIdentifier("");
            }}
          >
            Kembali ke Login
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Masuk ke Akun Anda</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pilih cara masuk untuk melanjutkan analisis.</p>
      </div>

      <div role="tablist" aria-label="Opsi autentikasi" className="flex rounded-lg bg-muted p-1">
        <button
          id="tab-masuk"
          role="tab"
          type="button"
          aria-selected={activeTab === "masuk"}
          aria-controls="panel-masuk"
          tabIndex={activeTab === "masuk" ? 0 : -1}
          onKeyDown={handleTabKeyDown}
          onClick={() => {
            setActiveTab("masuk");
            setError(null);
            setEmailSent(false);
          }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "masuk" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Masuk
        </button>
        <button
          id="tab-daftar"
          role="tab"
          type="button"
          aria-selected={activeTab === "daftar"}
          aria-controls="panel-daftar"
          tabIndex={activeTab === "daftar" ? 0 : -1}
          onKeyDown={handleTabKeyDown}
          onClick={() => {
            setActiveTab("daftar");
            setError(null);
            setEmailSent(false);
          }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "daftar" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Daftar
        </button>
      </div>

      {activeTab === "masuk" ? (
        <div id="panel-masuk" role="tabpanel" aria-labelledby="tab-masuk" className="space-y-4">
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Username atau Email</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="username atau email"
                  className="pl-9"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoginLoading}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password akun"
                  className="pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoginLoading}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setError(null);
                }}
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                Lupa password?
              </button>
            </div>

            <FormError>{error}</FormError>

            <Button type="submit" size="lg" className="w-full" disabled={isLoginLoading}>
              {isLoginLoading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Masuk...</> : "Masuk"}
            </Button>
          </form>
        </div>
      ) : (
        <div id="panel-daftar" role="tabpanel" aria-labelledby="tab-daftar" className="space-y-4">
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="nama@email.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSignupLoading || emailSent}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <FormError>{error}</FormError>

            {emailSent && (
              <div role="status" className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
                Kode verifikasi sedang dikirim ke email Anda...
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSignupLoading || emailSent}>
              {isSignupLoading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Mengirim kode...</> : "Kirim Kode Verifikasi"}
            </Button>
          </form>
        </div>
      )}

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">atau</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isLoginLoading || isSignupLoading}
        variant="outline"
        size="lg"
        className="w-full gap-3 font-medium"
      >
        {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <GoogleIcon />}
        Lanjutkan dengan Google
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Dengan melanjutkan, Anda menyetujui{" "}
        <Link href="/terms-of-service" className="underline underline-offset-4 hover:text-foreground">
          Syarat & Ketentuan
        </Link>
        {" "}serta{" "}
        <Link href="/privacy-policy" className="underline underline-offset-4 hover:text-foreground">
          Kebijakan Privasi
        </Link>
        {" "}aplikasi.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center">Memuat...</div>}>
      <AuthShell>
        <LoginContent />
      </AuthShell>
    </React.Suspense>
  );
}
