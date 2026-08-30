"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth-shell";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/utils";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? (typeof window !== "undefined" ? sessionStorage?.getItem("otp_email") : null) ?? "";
  const nextPath = searchParams.get("next") ?? (typeof window !== "undefined" ? sessionStorage?.getItem("otp_next") : null) ?? "/dashboard";
  const mode = searchParams.get("mode") ?? (typeof window !== "undefined" ? sessionStorage?.getItem("otp_mode") : null) ?? "";

  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const supabase = createClient();

  React.useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const verifyOtp = async (token: string) => {
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      setError("Kode tidak valid atau sudah kedaluwarsa. Periksa email Anda.");
      setIsLoading(false);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      return;
    }

    if (mode === "signup") {
      router.push("/onboarding?mode=signup");
    } else {
      router.push(nextPath);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      const chars = pasted.split("");
      chars.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(index + chars.length, 5);
      inputRefs.current[nextFocus]?.focus();

      if (newOtp.every((d) => d !== "")) {
        void verifyOtp(newOtp.join(""));
      }
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      void verifyOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setError(error.message);
    } else {
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }

    setIsResending(false);
  };

  if (!email) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">Sesi verifikasi tidak ditemukan.</p>
        <Link href="/login" className="inline-block text-sm text-primary underline underline-offset-4">
          Kembali ke Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cek Email Anda</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kode 6 digit telah dikirim ke <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-center gap-2.5 sm:gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading}
              className={cn(
                "h-12 w-10 rounded-lg border-2 bg-background text-center text-lg font-bold tabular-nums transition-all sm:h-14 sm:w-12",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                digit ? "border-primary text-foreground" : "border-border text-muted-foreground",
                isLoading && "cursor-not-allowed opacity-50"
              )}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Memverifikasi...
          </div>
        )}

        <FormError>{error}</FormError>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0 || isLoading}
            className="w-full gap-2"
          >
            {isResending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {resendCooldown > 0
              ? `Kirim ulang dalam ${resendCooldown}d`
              : "Kirim Ulang Kode"}
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Gunakan email lain
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Kode berlaku selama 10 menit. Periksa folder spam jika belum masuk.
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center">Memuat...</div>}>
      <AuthShell>
        <VerifyContent />
      </AuthShell>
    </React.Suspense>
  );
}
