import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { checkLoginAttempt } from "@/lib/ratelimit";

const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(190),
  password: z.string().min(1).max(200),
});

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

const GENERIC_ERROR = "Username/email atau password salah.";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const { identifier, password } = parsed.data;

  const throttle = await checkLoginAttempt(ip, identifier);
  if (!throttle.success) {
    return NextResponse.json(
      {
        error: `Terlalu banyak percobaan masuk. Coba lagi dalam ${throttle.retryAfterSeconds} detik.`,
      },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } }
    );
  }

  const supabase = await createClient();

  let loginEmail = identifier;

  if (!identifier.includes("@")) {
    // Resolusi username -> email lewat RPC security definer (parameterized,
    // tidak menyusun SQL string sehingga bebas dari SQL injection).
    const lookupDb = getAdminSupabase() ?? supabase;
    const { data, error } = await lookupDb.rpc("get_email_by_username", {
      input_username: identifier,
    });

    if (error || !data || typeof data !== "string") {
      // Pesan seragam: jangan bocorkan apakah username terdaftar.
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    loginEmail = data;
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  });

  if (signInError) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
