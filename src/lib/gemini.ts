import { GoogleGenAI } from "@google/genai";
import type { JournalMetadata } from "@/lib/journal-api";
import { sendDeveloperErrorAlert } from "@/lib/telegram";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not configured");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
// longForm: false untuk model yang terbukti timeout pada prompt panjang.
// Nemotron adalah model reasoning; pada tugas 3000-7000 token ia melewati
// PROVIDER_TIMEOUT_MS tanpa menghasilkan apa pun, sehingga hanya membuang 60s.
// Model seperti itu tetap berguna di layer query yang promptnya pendek.
const openRouterProviders = [
  { name: "openrouter-nvidia", model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free", order: Number(process.env.PROVIDER_OPENROUTER_NVIDIA_ORDER || 0), longForm: false },
  { name: "openrouter-minimax", model: process.env.OPENROUTER_MINIMAX_MODEL || "minimax/minimax-m3:free", order: Number(process.env.PROVIDER_OPENROUTER_MINIMAX_ORDER || 0), longForm: true },
  { name: "openrouter-glm", model: process.env.OPENROUTER_FALLBACK_MODEL || "z-ai/glm-5.2:free", order: Number(process.env.PROVIDER_OPENROUTER_GLM_ORDER || 0), longForm: true },
].filter((provider) => provider.order > 0).sort((a, b) => a.order - b.order);
const aihubmixApiKey = process.env.AIHUBMIX_API_KEY;
const aihubmixModel = process.env.AIHUBMIX_MODEL || "gemini-3.7-flash-free";
const aihubmixBaseUrl = process.env.AIHUBMIX_BASE_URL || "https://aihubmix.com/v1";
const extraProviders = [
  { name: "terra", baseUrl: process.env.TERRA_API_BASE_URL, apiKey: process.env.TERRA_API_KEY, model: process.env.TERRA_MODEL || "gpt-5.6-terra", order: Number(process.env.PROVIDER_TERRA_ORDER || 0), longForm: true },
  { name: "freetokenfaucet", baseUrl: process.env.FREETOKENFAUCET_API_BASE_URL, apiKey: process.env.FREETOKENFAUCET_API_KEY, model: process.env.FREETOKENFAUCET_MODEL || "gpt-5.6-terra", order: Number(process.env.PROVIDER_FREETOKENFAUCET_ORDER || 0), longForm: true },
].filter((provider) => provider.order > 0).sort((a, b) => a.order - b.order);
const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const fallbackModelName = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash";
const PROVIDER_TIMEOUT_MS = 60000;
const FREETOKENFAUCET_TIMEOUT_MS = 20000;
// Harus <= maxDuration pada src/app/api/generate/route.ts, jika tidak request dipotong runtime
const TOTAL_BUDGET_MS = Number(process.env.GENERATION_BUDGET_SECONDS || 240) * 1000;
// Draft di bawah ambang tetap disimpan bila mencapai jumlah kata ini, untuk bahan tahap perluasan
const MIN_DRAFT_WORDS = 150;
// Putaran perluasan baru dimulai hanya bila sisa anggaran waktu masih di atas ambang ini
const EXPANSION_ROUND_RESERVE_MS = 45000;

// Berapa kali tahap perluasan diulang bila hasil masih di bawah target.
// Dibaca saat pemanggilan agar perubahan env berlaku tanpa restart proses.
function getMaxExpansionRounds(): number {
  const parsed = Number(process.env.MAX_EXPANSION_ROUNDS);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 2;
}

const geminiCooldownUntil = new Map<string, number>();

function isQuotaExceeded(error: unknown): boolean {
  const candidate = error as { status?: number; message?: string };
  const message = candidate?.message || String(error);
  return candidate?.status === 429 && /quota|RESOURCE_EXHAUSTED|exceeded your current quota/i.test(message);
}

function getRetryDelayMs(error: unknown): number {
  const message = (error as { message?: string })?.message || String(error);
  const match = message.match(/"retryDelay"\s*:\s*"(\d+)s"/) || message.match(/retry in ([\d.]+)s/i);
  const seconds = match ? Number(match[1]) : 60;
  return Math.min(Math.max(seconds, 5), 3600) * 1000;
}

function isGeminiOnCooldown(model: string): boolean {
  const until = geminiCooldownUntil.get(model);
  if (!until) return false;
  if (Date.now() >= until) {
    geminiCooldownUntil.delete(model);
    return false;
  }
  return true;
}

export type OutputQualityCheck = (text: string) => { ok: boolean; reason?: string };

async function generateWithOpenRouterModel(model: string, prompt: string, config: { temperature: number; maxOutputTokens: number }): Promise<string> {
  if (!openRouterApiKey) throw new Error("OPENROUTER_API_KEY belum dikonfigurasi");

  console.log(`Mengirim request ke OpenRouter dengan model: ${model}`);
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterApiKey}`,
      "Content-Type": "application/json",
      ...(process.env.OPENROUTER_SITE_URL ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL } : {}),
      ...(process.env.OPENROUTER_APP_NAME ? { "X-OpenRouter-Title": process.env.OPENROUTER_APP_NAME } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: config.temperature,
      max_tokens: config.maxOutputTokens,
    }),
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`OpenRouter API error ${response.status}: ${details.slice(0, 300)}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenRouter mengembalikan teks kosong");

  console.log(`✅ OpenRouter sukses dengan model ${model}`);
  return text;
}

async function generateWithAIHubMix(prompt: string, config: { temperature: number; maxOutputTokens: number }): Promise<string> {
  if (!aihubmixApiKey) throw new Error("AIHUBMIX_API_KEY belum dikonfigurasi");
  const response = await fetch(`${aihubmixBaseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${aihubmixApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: aihubmixModel,
      messages: [{ role: "user", content: prompt }],
      temperature: config.temperature,
      max_tokens: config.maxOutputTokens,
    }),
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`AIHubMix API error ${response.status}: ${(await response.text().catch(() => "")).slice(0, 300)}`);
  }
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("AIHubMix mengembalikan teks kosong");
  console.log(`✅ AIHubMix sukses dengan model ${aihubmixModel}`);
  return text;
}

async function generateWithExtraProvider(provider: { name: string; baseUrl?: string; apiKey?: string; model: string }, prompt: string, config: { temperature: number; maxOutputTokens: number }): Promise<string> {
  if (!provider.baseUrl || !provider.apiKey) throw new Error(`${provider.name} belum dikonfigurasi`);
  const timeoutMs = provider.name === "freetokenfaucet" ? FREETOKENFAUCET_TIMEOUT_MS : PROVIDER_TIMEOUT_MS;
  const response = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${provider.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: provider.model, messages: [{ role: "user", content: prompt }], temperature: config.temperature, max_tokens: config.maxOutputTokens }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`${provider.name} API error ${response.status}: ${(await response.text().catch(() => "")).slice(0, 300)}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${provider.name} mengembalikan teks kosong`);
  console.log(`✅ Provider ${provider.name} sukses dengan model ${provider.model}`);
  return text;
}

async function generateWithFallbacks(
  prompt: string,
  config: { temperature: number; maxOutputTokens: number },
  options: {
    stage: string;
    deadline: number;
    qualityCheck?: OutputQualityCheck;
    onModelUsed?: (model: string) => void;
    acceptBest?: boolean;
    /** Lewati provider yang ditandai longForm: false (model yang timeout pada prompt panjang) */
    requireLongForm?: boolean;
  }
): Promise<string> {
  const { stage, deadline, qualityCheck, onModelUsed, acceptBest, requireLongForm } = options;
  
  // Build unified provider array including Gemini models
  const providers = [
    // Gemini providers (if API configured)
    ...(ai ? [
      {
        order: Number(process.env.PROVIDER_GEMINI_36_ORDER || 0),
        name: "gemini-3.6",
        label: `Gemini · ${modelName}`,
        longForm: true,
        run: async () => {
          if (isGeminiOnCooldown(modelName)) {
            throw new Error(`Gemini ${modelName} on cooldown (quota exceeded)`);
          }
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: { ...config, thinkingConfig: { thinkingBudget: 0 } },
          });
          if (!response.text) throw new Error("Empty response from Gemini");
          return response.text;
        }
      },
      {
        order: Number(process.env.PROVIDER_GEMINI_35_ORDER || 0),
        name: "gemini-3.5",
        label: `Gemini · ${fallbackModelName}`,
        longForm: true,
        run: async () => {
          if (isGeminiOnCooldown(fallbackModelName)) {
            throw new Error(`Gemini ${fallbackModelName} on cooldown (quota exceeded)`);
          }
          const response = await ai.models.generateContent({
            model: fallbackModelName,
            contents: prompt,
            config: { ...config, thinkingConfig: { thinkingBudget: 0 } },
          });
          if (!response.text) throw new Error("Empty response from Gemini");
          return response.text;
        }
      }
    ] : []),
    
    // OpenRouter providers
    ...openRouterProviders.map((provider) => ({
      order: provider.order,
      name: provider.name,
      label: `OpenRouter · ${provider.model}`,
      longForm: provider.longForm,
      run: () => generateWithOpenRouterModel(provider.model, prompt, config),
    })),
    
    // Extra providers (Terra, FreeTokenFaucet)
    ...extraProviders.map((provider) => ({
      order: provider.order,
      name: provider.name,
      label: `${provider.name} · ${provider.model}`,
      longForm: provider.longForm,
      run: () => generateWithExtraProvider(provider, prompt, config),
    })),
    
    // AIHubMix
    {
      order: Number(process.env.PROVIDER_AIHUBMIX_ORDER || 0),
      name: "aihubmix",
      label: `AIHubMix · ${aihubmixModel}`,
      longForm: true,
      run: () => generateWithAIHubMix(prompt, config),
    },
  ]
    .filter((provider) => provider.order > 0)
    .filter((provider) => {
      if (!requireLongForm || provider.longForm) return true;
      console.log(`⏭️ ${provider.name} dilewati pada tahap "${stage}": tidak andal untuk prompt panjang.`);
      return false;
    })
    .sort((a, b) => a.order - b.order);

  let lastReason = "tidak ada provider aktif";
  let bestCandidate: { text: string; words: number; label: string; reason: string } | null = null;

  for (const provider of providers) {
    if (Date.now() >= deadline) {
      lastReason = "anggaran waktu total habis sebelum semua provider dicoba";
      console.warn(`⏱️ ${lastReason}`);
      break;
    }

    try {
      const text = await provider.run();
      
      // EARLY DETECTION: Check for severe underperformance (e.g., AIHubMix 27-words bug)
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      if (wordCount < 30) {
        lastReason = `${provider.name}: severe underperformance (${wordCount} words)`;
        console.warn(`🚫 ${provider.name} detected with only ${wordCount} words - skipping to next provider`);
        void sendDeveloperErrorAlert({
          stage,
          provider: provider.label,
          message: `Output terlalu pendek: ${wordCount} kata (possible model degradation)`,
          recovered: true,
        });
        continue;
      }
      
      const verdict = qualityCheck ? qualityCheck(text) : { ok: true };

      if (!verdict.ok) {
        const reason = verdict.reason ?? "output di bawah ambang";
        console.warn(`⚠️ Output ${provider.name} di bawah ambang: ${reason}`);
        void sendDeveloperErrorAlert({
          stage,
          provider: provider.label,
          message: `Output di bawah ambang: ${reason}`,
          recovered: true,
        });

        // Keep the longest usable draft so the expansion stage has something to build on
        const usableDraft = wordCount >= MIN_DRAFT_WORDS && /\[\d+\]/.test(text);
        if (usableDraft && (!bestCandidate || wordCount > bestCandidate.words)) {
          bestCandidate = { text, words: wordCount, label: provider.label, reason };
          console.warn(`💾 Draft terbaik sementara: ${provider.name} (${wordCount} kata)`);
        }

        if (!bestCandidate) lastReason = `${provider.name}: ${reason}`;
        continue;
      }

      onModelUsed?.(provider.label);
      return text;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!bestCandidate) lastReason = `${provider.name}: ${message}`;
      console.warn(`Provider ${provider.name} gagal: ${message.slice(0, 200)}`);
      
      // Handle Gemini quota exceeded - set cooldown
      if (isQuotaExceeded(error) && provider.name.startsWith("gemini")) {
        const cooldownMs = getRetryDelayMs(error);
        const modelKey = provider.name === "gemini-3.6" ? modelName : fallbackModelName;
        geminiCooldownUntil.set(modelKey, Date.now() + cooldownMs);
        console.warn(`🚫 ${provider.name} quota exceeded - cooldown for ${Math.round(cooldownMs / 1000)}s`);
      }
      
      void sendDeveloperErrorAlert({
        stage,
        provider: provider.label,
        message: message.slice(0, 400),
        recovered: true,
      });
    }
  }

  if (acceptBest && bestCandidate) {
    console.warn(`⚠️ Tidak ada provider lolos ambang; memakai draft terbaik ${bestCandidate.label} (${bestCandidate.words} kata: ${bestCandidate.reason}) sebagai bahan tahap perluasan.`);
    onModelUsed?.(bestCandidate.label);
    return bestCandidate.text;
  }

  const failureReason = bestCandidate
    ? `${bestCandidate.label}: ${bestCandidate.reason}`
    : lastReason;
  throw new Error(`Semua provider fallback gagal. Penyebab terakhir: ${failureReason}`);
}

const TARGET_WORDS = {
  singkat: "400-500",
  menengah: "800-900",
  mendalam: "1300-1600",
} as const;

export async function generateLandasanTeori(params: {
  judulAnalisis: string;
  kedalaman: keyof typeof TARGET_WORDS;
  journals: JournalMetadata[];
  standards?: string[];
  preferredProvider?: string;
  onModelUsed?: (model: string) => void;
}): Promise<string> {
  const standardsContext = params.standards?.length
    ? `\n\nAcuan standar yang ditemukan (gunakan hanya jika benar-benar relevan):\n${params.standards.map((standard, index) => `[SNI ${index + 1}] ${standard}`).join("\n")}`
    : "";

  const context = params.journals
    .map(
      (journal, index) =>
        `[SUMBER ${index + 1}]\nJudul: ${journal.title}\nPenulis: ${journal.authors.join(", ")}\nTahun: ${journal.year}\nJurnal: ${journal.journal}\nAbstrak: ${journal.abstract}`
    )
    .join("\n\n");

  const targetMinimum = params.kedalaman === "singkat" ? 300 : params.kedalaman === "menengah" ? 600 : 1000;
  const minParagraphs = Math.ceil(targetMinimum / 120);
  
  const prompt = `Anda adalah asisten akademik untuk kimia analitik.

Tugas: Susun bagian Landasan Teori untuk analisis "${params.judulAnalisis}" dalam BAHASA INDONESIA.

Konteks: Anda diberikan ${params.journals.length} abstrak jurnal ilmiah dari OpenAlex dan Semantic Scholar. Abstrak ini dalam bahasa Inggris, tapi output Anda WAJIB Bahasa Indonesia yang koheren dan akademik.

ATURAN PENULISAN WAJIB:
1. Tulis landasan teori untuk PRAKTIKUM dengan judul "${params.judulAnalisis}". Bahas teori yang diperlukan untuk memahami praktikum tersebut, bukan laporan atau ringkasan praktikum milik peneliti lain.
2. Fokus utama harus selalu pada sampel/matriks, analit, metode, dan tujuan yang tertulis dalam judul. Jangan mengganti sampel dengan objek dari jurnal.
3. Gunakan jurnal hanya sebagai pendukung teori. Jangan membuka paragraf dengan "penelitian X..." atau menjadikan perbedaan antarpenelitian sebagai topik utama.
4. Gunakan hanya informasi yang didukung konteks sumber. Jangan mengarang angka, kondisi, hasil, nomor standar, atau prosedur.
5. Parafrase dengan bahasa Indonesia yang ringan, jelas, dan tetap akademik. Jelaskan istilah teknis dengan kalimat sederhana saat pertama kali digunakan.
6. Target panjang: ${TARGET_WORDS[params.kedalaman]} kata, minimal ${targetMinimum} kata, dan boleh lebih.
7. Setiap paragraf harus memiliki sitasi [n] yang benar-benar mendukung isi paragraf. Semua sumber yang diberikan sudah lolos relevansi; sitasi setiap sumber [1] sampai [${params.journals.length}] minimal satu kali pada klaim yang didukungnya.
8. Jika acuan SNI tersedia dalam konteks, jelaskan kaitannya dengan sampel dan parameter praktikum. Sebut nomor/judul SNI hanya jika tertulis dalam konteks; jangan mengarang acuan.
9. Jangan membuat daftar pustaka di dalam teks, jangan menyebut AI, instruksi, konteks sumber, atau proses pencarian.
10. Tulis teks biasa dengan subjudul bernomor dan paragraf naratif, tanpa bullet list.
11. DILARANG KERAS menggunakan format LaTeX atau simbol dolar ($) untuk rumus kimia. Tuliskan rumus kimia menggunakan teks biasa tanpa penanda matematika (misal: AgNO3, NaCl, H2SO4, Fe(II)).

STRUKTUR YANG DIHARAPKAN:
2.1 Sampel Praktikum dan Parameter yang Dianalisis
Jelaskan sampel yang tercantum pada judul, komponen atau analit yang diukur, serta alasan parameter tersebut penting.

2.2 Dasar Teori Analit
Jelaskan sifat, fungsi, atau karakteristik analit dalam sampel praktikum dengan bahasa yang mudah dipahami.

2.3 Prinsip Metode Analisis
Jelaskan prinsip metode yang benar-benar digunakan pada praktikum, termasuk reaksi, perubahan massa, pembentukan warna, titrasi, atau hubungan sinyal dengan kadar jika didukung sumber.

2.4 Tahapan Teoretis dan Faktor yang Memengaruhi Hasil
Jelaskan hubungan preparasi sampel, kondisi pengukuran, titik akhir, berat konstan, suhu, waktu, atau faktor lain dengan ketelitian hasil. Jangan menulis prosedur operasional rinci yang tidak didukung konteks.

2.5 Acuan Standar dan Hubungannya dengan Praktikum
Jika acuan SNI tercantum dalam konteks di bawah, jelaskan kaitannya dengan persyaratan parameter praktikum. Jika tidak ada acuan SNI dalam konteks, jelaskan prinsip standarisasi umum kimia analitik (seperti prinsip metode baku acuan) tanpa mengarang atau menciptakan nomor SNI palsu.

2.6 Kaitan Teori dengan Praktikum
Tutup dengan hubungan antara teori, metode, sampel, dan tujuan pengujian. Jangan menulis hasil praktikum karena data hasil belum diberikan.

Buat minimal ${minParagraphs} paragraf yang cukup panjang. Setiap paragraf harus mengembangkan satu gagasan, bukan hanya menyebutkan definisi. Gunakan sitasi [1], [2], dan seterusnya secara wajar setelah klaim yang didukung.

Konteks sumber jurnal:
${context}${standardsContext}

INGAT:
- Output wajib Bahasa Indonesia yang natural dan mudah dipahami.
- Pusat pembahasan adalah praktikum "${params.judulAnalisis}", bukan praktikum pada jurnal.
- Gunakan setiap sumber yang tersedia dan tempatkan sitasinya hanya pada klaim yang didukung sumber tersebut.
- Jangan menulis hasil pengujian atau kesimpulan mutu tanpa data praktikum.
- JANGAN gunakan format LaTeX, Markdown bold/italic, atau simbol dolar ($). Output harus teks biasa murni.`;

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const tolerance = Math.floor(targetMinimum * 0.95);

  type DraftStats = {
    text: string;
    paragraphs: string[];
    citations: number[];
    words: number;
    missing: number[];
    outOfRange: boolean;
  };

  const analyzeDraft = (candidate: string): DraftStats => {
    const text = candidate
      .trim()
      .replace(/^```(?:text|markdown)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .replace(/\n{3,}/g, "\n\n");
    const citations = [...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
    return {
      text,
      paragraphs: text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean),
      citations,
      words: text.split(/\s+/).filter(Boolean).length,
      missing: params.journals.map((_, i) => i + 1).filter((i) => !citations.includes(i)),
      outOfRange: citations.some((c) => c < 1 || c > params.journals.length),
    };
  };

  const describeDeficits = (draft: DraftStats, minimumWords: number): string[] => {
    const deficits: string[] = [];
    if (draft.words < minimumWords) deficits.push(`Panjang baru ${draft.words} kata, kurang ${minimumWords - draft.words} kata dari minimum ${minimumWords}`);
    if (draft.paragraphs.length < minParagraphs) deficits.push(`Baru ${draft.paragraphs.length} paragraf, minimum ${minParagraphs}`);
    if (draft.citations.length === 0) deficits.push("Belum ada sitasi sama sekali");
    if (draft.outOfRange) deficits.push(`Ada sitasi di luar rentang [1]-[${params.journals.length}]; hapus atau ganti`);
    if (draft.missing.length > 0) deficits.push(`Sumber belum disitasi: [${draft.missing.join(", ")}]`);
    return deficits;
  };

  // Minimal sitasi yang wajib muncul: 3 sumber, atau seluruh sumber bila jumlah jurnal < 3.
  // Model free-tier sering melewatkan beberapa sumber dari daftar 7 jurnal; toleransi ini
  // mencegah draft berkualitas dan sudah cukup panjang dibuang/diperluas hanya karena
  // kurang 1-2 sitasi. 3 sitasi dari 7 sumber tetap representatif secara akademik.
  const minRequiredCitations = Math.min(3, params.journals.length);
  const maxMissingCitations = Math.max(0, params.journals.length - minRequiredCitations);

  const meetsThreshold = (draft: DraftStats, minimumWords: number): boolean =>
    draft.words >= minimumWords &&
    draft.paragraphs.length >= minParagraphs &&
    draft.citations.length > 0 &&
    !draft.outOfRange &&
    draft.missing.length <= maxMissingCitations;

  // Draft dianggap lebih baik bila sitasi yang hilang lebih sedikit; jika sama, yang lebih panjang menang
  const isBetterDraft = (candidate: DraftStats, current: DraftStats): boolean =>
    candidate.missing.length !== current.missing.length
      ? candidate.missing.length < current.missing.length
      : candidate.words > current.words;

  const evaluateOutput = (candidate: string, minimumWords: number): { ok: boolean; reason?: string } => {
    const draft = analyzeDraft(candidate);
    if (draft.words < minimumWords) return { ok: false, reason: `${draft.words} kata (minimum ${minimumWords})` };
    if (draft.paragraphs.length < minParagraphs) return { ok: false, reason: `${draft.paragraphs.length} paragraf (minimum ${minParagraphs})` };
    if (draft.citations.length === 0) return { ok: false, reason: "tanpa sitasi" };
    if (draft.outOfRange) return { ok: false, reason: "sitasi di luar daftar sumber" };
    const citedCount = params.journals.length - draft.missing.length;
    if (draft.missing.length > maxMissingCitations) {
      return { ok: false, reason: `hanya ${citedCount} sumber disitasi (minimal ${minRequiredCitations}, belum disitasi: [${draft.missing.join(", ")}])` };
    }
    return { ok: true };
  };

  try {
    let usedModelRecord = "unknown";
    const config = {
      temperature: 0.4,
      maxOutputTokens: params.kedalaman === "singkat" ? 3000 : params.kedalaman === "menengah" ? 5000 : 7000,
    };

    // Use unified provider approach - respects ENV order.
    // acceptBest: draft di bawah ambang tetap diambil agar tahap perluasan punya bahan.
    const rawText = await generateWithFallbacks(prompt, config, {
      stage: "Pembuatan landasan teori",
      deadline,
      qualityCheck: (candidate) => evaluateOutput(candidate, targetMinimum),
      acceptBest: true,
      requireLongForm: true,
      onModelUsed: (m) => { 
        usedModelRecord = m;
        params.onModelUsed?.(m);
      },
    });

    const initialDraft = analyzeDraft(rawText);
    let text = initialDraft.text;
    let paragraphs = initialDraft.paragraphs;
    let citations = initialDraft.citations;
    let wordCount = initialDraft.words;

    if (!meetsThreshold(initialDraft, targetMinimum)) {
      console.warn(`⚠️ Output awal belum memenuhi ambang: ${wordCount} kata (target: ${targetMinimum}), ${paragraphs.length} paragraf, sitasi [${citations.join(", ")}]. Mencoba perluasan...`);

      // Perluasan bertahap: tiap putaran memakai draft terbaru sebagai basis
      // dan hanya meminta tambahan pada bagian yang masih kurang.
      const maxRounds = getMaxExpansionRounds();
      let bestDraft = initialDraft;
      let accepted = false;
      let lastRoundError: unknown = null;

      for (let round = 1; round <= maxRounds; round += 1) {
        const remaining = deadline - Date.now();
        if (remaining <= EXPANSION_ROUND_RESERVE_MS) {
          console.warn(`⏱️ Sisa anggaran waktu ${Math.round(remaining / 1000)}s, tidak cukup untuk perluasan putaran ${round}. Berhenti.`);
          break;
        }

        const deficits = describeDeficits(bestDraft, targetMinimum);
        const expansionPrompt = `${prompt}

--- INSTRUKSI PERLUASAN (PUTARAN ${round} DARI ${maxRounds}) ---
Di bawah ini draft yang sudah ada. JANGAN mulai dari nol dan JANGAN memotong bagian yang sudah baik.
Pertahankan seluruh isi draft, lalu perpanjang dan perdalam sampai memenuhi kekurangan yang disebutkan.

DRAFT SAAT INI (${bestDraft.words} kata, ${bestDraft.paragraphs.length} paragraf):
${bestDraft.text}

YANG MASIH KURANG:
${deficits.map((deficit, index) => `${index + 1}. ${deficit}`).join("\n")}

CARA MEMPERBAIKI:
1. Tulis ulang draft secara utuh dengan seluruh isi lama tetap ada, lalu tambahkan uraian baru.
2. Perdalam penjelasan mekanisme, alasan, dan kaitannya dengan praktikum "${params.judulAnalisis}".
3. Tambah kedalaman pada paragraf yang masih pendek; jangan menambah paragraf yang hanya mengulang.
4. Target akhir: ${TARGET_WORDS[params.kedalaman]} kata, minimum mutlak ${targetMinimum} kata.
5. Setiap sumber [1] sampai [${params.journals.length}] wajib disitasi minimal sekali, hanya pada klaim yang didukung abstraknya.
6. Tetap Bahasa Indonesia akademik, teks biasa, tanpa LaTeX, tanpa Markdown, tanpa simbol dolar.

Keluarkan HANYA teks landasan teori versi lengkap yang sudah diperluas.`;

        try {
          const expansionText = await generateWithFallbacks(expansionPrompt, {
            temperature: 0.5,
            maxOutputTokens: config.maxOutputTokens,
          }, {
            stage: `Perluasan landasan teori (putaran ${round})`,
            deadline,
            qualityCheck: (candidate) => evaluateOutput(candidate, tolerance),
            // Selalu ambil kandidat terbaik: bila masih di bawah ambang, ia jadi basis
            // putaran berikutnya, dan pada putaran terakhir ia dilaporkan sebagai hasil terbaik.
            // Regresi tetap ditolak oleh isBetterDraft di bawah.
            acceptBest: true,
            requireLongForm: true,
            onModelUsed: (m) => {
              usedModelRecord = m;
              params.onModelUsed?.(m);
            },
          });

          const candidate = analyzeDraft(expansionText);
          console.log(`📈 Perluasan putaran ${round}: ${candidate.words} kata, ${candidate.paragraphs.length} paragraf, sitasi hilang [${candidate.missing.join(", ") || "tidak ada"}]`);

          if (isBetterDraft(candidate, bestDraft)) {
            bestDraft = candidate;
          } else {
            console.warn(`↩️ Putaran ${round} tidak lebih baik dari draft sebelumnya (${bestDraft.words} kata); draft lama dipertahankan.`);
          }

          if (meetsThreshold(bestDraft, tolerance)) {
            accepted = true;
            break;
          }
        } catch (roundError) {
          lastRoundError = roundError;
          console.warn(`⚠️ Perluasan putaran ${round} gagal: ${roundError instanceof Error ? roundError.message.slice(0, 200) : String(roundError)}`);
        }
      }

      if (accepted) {
        text = bestDraft.text;
        paragraphs = bestDraft.paragraphs;
        citations = bestDraft.citations;
        wordCount = bestDraft.words;
        console.log(`✅ Perluasan berhasil: ${wordCount} kata, ${paragraphs.length} paragraf, ${citations.length} sitasi.`);
      } else {
        const detail = describeDeficits(bestDraft, tolerance).map((d) => `- ${d}`).join("\n");
        throw new Error(`Gagal memenuhi target setelah ${maxRounds} putaran perluasan:
- Hasil terbaik: ${bestDraft.words} kata, ${bestDraft.paragraphs.length} paragraf, ${bestDraft.citations.length} sitasi (${params.journals.length - bestDraft.missing.length}/${params.journals.length} sumber)
- Syarat: minimal ${tolerance} kata (toleransi 5%), minimal ${minParagraphs} paragraf, minimal ${minRequiredCitations} sumber disitasi
${detail}
- Konteks: ${params.journals.length} jurnal, ${context.length} chars${lastRoundError ? `\n- Error terakhir: ${lastRoundError instanceof Error ? lastRoundError.message.slice(0, 200) : String(lastRoundError)}` : ""}

Kemungkinan penyebab:
1. Jurnal yang ditemukan kurang relevan dengan topik "${params.judulAnalisis}"
2. Model AI under-performing (coba lagi dalam beberapa menit)
3. Judul terlalu spesifik/niche (coba judul lebih umum)

Saran: Simplify judul atau tambah kata kunci yang lebih general.`);
      }
    }

    const invalidCitation = citations.some((citation) => citation < 1 || citation > params.journals.length);
    if (invalidCitation) {
      throw new Error("Output Gemini memiliki sitasi di luar daftar sumber");
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
