import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkLookupAttempt } from "@/lib/ratelimit";

// Username hanya boleh sesuai constraint DB: ^[a-z0-9_]{3,30}$
const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/);

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const allowed = await checkLookupAttempt(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": "600" } }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  const parsed = usernameSchema.safeParse(
    (payload as { username?: unknown } | null)?.username
  );

  if (!parsed.success) {
    return NextResponse.json({ error: "Username tidak valid" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // RPC parameterized: nilai dikirim sebagai argumen, bukan disisipkan ke SQL.
    const { data, error } = await supabase.rpc("get_email_by_username", {
      input_username: parsed.data,
    });

    if (error) {
      console.error("Username lookup failed:", error.message);
      return NextResponse.json({ error: "Gagal mencari username" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Username tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ email: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
