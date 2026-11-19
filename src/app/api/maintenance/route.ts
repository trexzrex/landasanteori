import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { readMaintenanceState } from "@/lib/maintenance";

const headers = { "Cache-Control": "no-store, private" };
const settingsSchema = z.object({
  enabled: z.boolean(),
  message: z.string().trim().min(3).max(1000),
});

async function getContext() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { db, user: null, isAdmin: false };
  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single();
  return { db, user, isAdmin: profile?.role === "admin" };
}

export async function GET() {
  const { db, user, isAdmin } = await getContext();
  if (!user) return NextResponse.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401, headers });
  const state = await readMaintenanceState(db);
  return NextResponse.json({ ...state, isAdmin, userId: user.id }, { headers });
}

export async function PATCH(request: Request) {
  // Only same-origin browser mutations; authorization is independently enforced by RLS.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ message: "Asal permintaan tidak diizinkan." }, { status: 403, headers });
  }
  const { db, user, isAdmin } = await getContext();
  if (!user) return NextResponse.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401, headers });
  if (!isAdmin) return NextResponse.json({ message: "Hanya admin yang dapat mengubah maintenance." }, { status: 403, headers });
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Pesan harus terdiri dari 3–1000 karakter dan status harus valid." }, { status: 400, headers });
  const { data, error } = await db.from("maintenance_settings").update(parsed.data)
    .eq("id", 1).select("enabled, message, updated_at").single();
  if (error || !data) {
    console.error("Failed to save maintenance:", error);
    return NextResponse.json({ message: "Pengaturan belum tersimpan. Pastikan migrasi maintenance sudah dijalankan." }, { status: 503, headers });
  }
  return NextResponse.json({ ...data, available: true, isAdmin: true, userId: user.id }, { headers });
}
