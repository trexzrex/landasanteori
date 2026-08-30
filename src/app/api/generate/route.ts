import { NextResponse } from "next/server";
import { after } from "next/server";
import { generateFormSchema } from "@/lib/schemas";
import { fetchAllSources, formatAPA, searchStandards } from "@/lib/journal-api";
import { generateLandasanTeori } from "@/lib/gemini";
import { logActivity, type ActivityStatus } from "@/lib/supabase";
import { translateToEnglish } from "@/lib/translator";
import { getErrorMessage, sendGenerationNotification } from "@/lib/telegram";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { checkUserQuota, consumeUserQuota } from "@/lib/quota";

// Harus >= GENERATION_BUDGET_SECONDS pada src/lib/gemini.ts (default 240s).
// Catatan deploy: Vercel Hobby membatasi 60s, Pro 300s. Turunkan keduanya jika target Hobby.
export const maxDuration = 300;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function sanitizeTitle(input: string): string {
  return input
    .replace(/pennetuan|penenetuan/gi, "penentuan")
    .replace(/schrool|schroll/gi, "Schoorl")
    .replace(/[<>{}[\]`|\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { status: "error", message: "Anda harus masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  // Admin bebas dari limit IP dan kuota harian.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  let logBase = {
    nama: "-",
    nis: "-",
    kelas: "-",
    laboratorium: "-",
    judul_analisis: "-",
    kedalaman_teori: "-",
    ip_address: ip,
  };

  let usedModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  let generationId: string | null = null;

  const persistLog = (status: ActivityStatus) => {
    after(() => logActivity({ ...logBase, status }));
  };

  const notifyGeneration = (status: "BERHASIL" | "GAGAL", errorLog?: string) => {
    after(() =>
      sendGenerationNotification({
        nama: logBase.nama,
        nis: logBase.nis,
        kelas: logBase.kelas,
        laboratorium: logBase.laboratorium,
        judulAnalisis: logBase.judul_analisis,
        kedalamanTeori: logBase.kedalaman_teori,
        status,
        model: usedModel,
        errorLog,
      })
    );
  };

  const markGenerationError = async (message: string) => {
    if (!generationId) return;
    const id = generationId;
    const db = getAdminSupabase() ?? supabase;
    try {
      const { error } = await db
        .from("generations")
        .update({ status: "error", error_message: message.slice(0, 500) })
        .eq("id", id);
      if (error) {
        console.error("Failed to update generation error status:", error.message);
      }
    } catch (err) {
      console.error("Failed to update generation error status:", err);
    }
  };

  const startedAt = Date.now();

  try {
    const body = await request.json();
    const rawKeywords = body?.analysis_data?.kata_kunci;

    const parsed = generateFormSchema.safeParse({
      ...body?.user_info,
      judul_analisis: body?.analysis_data?.judul_analisis,
      kata_kunci: Array.isArray(rawKeywords)
        ? rawKeywords.join(", ")
        : (rawKeywords ?? ""),
      ...body?.settings,
    });

    if (!parsed.success) {
      persistLog("ERROR_VALIDATION");
      notifyGeneration("GAGAL", "Data formulir tidak valid atau parameter wajib belum lengkap.");
      return NextResponse.json(
        {
          status: "error",
          message: "Data formulir tidak valid. Periksa kembali input Anda.",
        },
        { status: 400 }
      );
    }

    const form = parsed.data;
    const judulBersih = sanitizeTitle(form.judul_analisis);

    logBase = {
      nama: form.nama ?? "",
      nis: form.nis ?? "",
      kelas: form.kelas ?? "",
      laboratorium: form.laboratorium,
      judul_analisis: judulBersih,
      kedalaman_teori: form.kedalaman_teori,
      ip_address: ip,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        laboratorium: form.laboratorium,
        judul_analisis: judulBersih,
        kata_kunci: form.kata_kunci || null,
        kedalaman: form.kedalaman_teori,
        status: "pending",
      })
      .select("id")
      .single();

    if (!insertError && inserted) {
      generationId = inserted.id;
    } else {
      console.error("Failed to persist generation row:", insertError?.message);
    }

    // 2. Pengecekan kuota harian akun (5/hari). Row 'pending' di atas berfungsi
    //    sebagai reservasi slot agar permintaan paralel tidak dua-duanya lolos,
    //    tetapi dikecualikan dari hitungan supaya limit efektif tetap 5.
    //    Admin dilewati.
    const quota = isAdmin ? null : await checkUserQuota(user.id, generationId);
    if (quota && !quota.allowed) {
      // Batalkan reservasi agar row yang ditolak tidak memakan kuota permanen.
      if (generationId) {
        const id = generationId;
        const db = getAdminSupabase() ?? supabase;
        try {
          await db.from("generations").delete().eq("id", id);
        } catch (delErr) {
          console.error("Failed to roll back reserved generation row:", delErr);
        }
        generationId = null;
      }
      persistLog("RATE_LIMITED");
      const quotaMsg =
        quota.daily_limit > 0 && quota.daily_used >= quota.daily_limit
          ? `Batas kuota harian Anda tercapai (${quota.daily_used}/${quota.daily_limit} generasi). Kuota akan direset besok.`
          : "Tidak dapat memverifikasi kuota harian Anda saat ini. Silakan coba lagi beberapa saat.";
      notifyGeneration("GAGAL", quotaMsg);
      return NextResponse.json(
        {
          status: "error",
          message: quotaMsg,
        },
        { status: 429, headers: { "Retry-After": "86400" } }
      );
    }

    const queryVariants: string[] = [];
    let queryProvider = "unknown";
    let translationDegraded = false;

    queryVariants.push(judulBersih);

    try {
      const translation = await translateToEnglish(judulBersih);
      queryProvider = translation.provider;
      translationDegraded = translation.usedDictionaryFallback;
      queryVariants.push(...translation.queries);
    } catch (error) {
      translationDegraded = true;
      console.warn("Pembuatan query gagal total, lanjut dengan judul Indonesia saja:", error);
    }

    const uniqueQueryVariants = [...new Set(queryVariants.filter(Boolean))];

    const journals = await fetchAllSources(uniqueQueryVariants);

    if (journals.length === 0) {
      // Bedakan dua sebab: penerjemah judul tumbang (masalah sementara di sisi kami)
      // versus topik yang memang tak punya literatur terindeks.
      const message = translationDegraded
        ? "Layanan penerjemah judul sedang bermasalah sehingga pencarian jurnal tidak akurat. Silakan coba lagi dalam beberapa menit."
        : "Tidak ada referensi terpercaya ditemukan dari OpenAlex maupun Semantic Scholar. Silakan modifikasi judul atau kata kunci Anda.";
      const logDetail = translationDegraded
        ? `Tidak ada jurnal; pembuatan query gagal (provider: ${queryProvider}).`
        : "Tidak ada referensi jurnal ditemukan dari OpenAlex / Semantic Scholar.";

      persistLog("ERROR_NO_CONTEXT");
      notifyGeneration("GAGAL", logDetail);
      await markGenerationError(logDetail);
      return NextResponse.json({ status: "error", message }, { status: 404 });
    }

    const standards = await searchStandards(judulBersih);

    let landasanTeori: string;
    try {
      landasanTeori = await generateLandasanTeori({
        judulAnalisis: judulBersih,
        kedalaman: form.kedalaman_teori,
        journals,
        standards,
        onModelUsed: (model) => {
          usedModel = model;
        },
      });
    } catch (error) {
      console.error("Gemini generation failed:", error);
      persistLog("ERROR_GEMINI");
      notifyGeneration("GAGAL", getErrorMessage(error));
      await markGenerationError(getErrorMessage(error));
      return NextResponse.json(
        {
          status: "error",
          message:
            "Gagal menyusun landasan teori sesuai panjang dan struktur yang diminta. Silakan coba lagi; gunakan judul atau kata kunci yang lebih umum jika masalah berlanjut.",
        },
        { status: 502 }
      );
    }

    const usedJournals = journals;
    const daftarPustaka = usedJournals.map(formatAPA);
    const durationMs = Date.now() - startedAt;

    if (generationId) {
      const id = generationId;
      const db = getAdminSupabase() ?? supabase;
      try {
        const { error } = await db
          .from("generations")
          .update({
            landasan_teori: landasanTeori,
            daftar_pustaka: daftarPustaka,
            jumlah_jurnal: usedJournals.length,
            word_count: countWords(landasanTeori),
            model_used: usedModel,
            duration_ms: durationMs,
            status: "success",
          })
          .eq("id", id);
        if (error) {
          console.error("Failed to update success generation row:", error.message);
        }
      } catch (dbErr) {
        console.error("Failed to update success generation row:", dbErr);
      }
    }

    persistLog("SUCCESS");
    notifyGeneration("BERHASIL");
    // Tambah pemakaian kuota harian akun pengguna
    await consumeUserQuota(user.id);

    return NextResponse.json({
      status: "success",
      message: "Landasan teori berhasil dibuat.",
      data: {
        generation_id: generationId,
        landasan_teori: landasanTeori,
        daftar_pustaka: daftarPustaka,
      },
      quota: quota
        ? {
            daily_used: quota.daily_used + 1,
            daily_limit: quota.daily_limit,
            remaining: Math.max(0, quota.remaining - 1),
            unlimited: false,
          }
        : { daily_used: 0, daily_limit: 0, remaining: 0, unlimited: true },
    });
  } catch (error) {
    console.error("Generate pipeline failed:", error);
    persistLog("ERROR_INTERNAL");
    notifyGeneration("GAGAL", getErrorMessage(error));
    await markGenerationError(getErrorMessage(error));
    return NextResponse.json(
      {
        status: "error",
        message: "Terjadi kesalahan pada server. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
