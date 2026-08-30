import { GoogleGenAI } from "@google/genai";
import { sendDeveloperErrorAlert } from "@/lib/telegram";
import { sanitizeSearchQuery } from "@/lib/journal-api";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const openRouterBaseUrl = "https://openrouter.ai/api/v1";
const geminiModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const geminiFallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash";

// Model reasoning (mis. Nemotron) memakai jatah token untuk berpikir sebelum menjawab.
// 300 token membuat jawaban terpotong sebelum query keluar, jadi jatahnya dilonggarkan.
const TRANSLATION_MAX_TOKENS = 800;
const TRANSLATION_TIMEOUT_MS = 60000;
// Ambang minimal query layak. Tiga terlalu galak untuk model gratisan; dua sudah
// cukup memberi variasi pencarian tanpa sering menjatuhkan provider yang sehat.
const MIN_VALID_QUERIES = 2;

// Cooldown kuota Gemini, dipakai bersama untuk kedua model
const geminiCooldownUntil = new Map<string, number>();

function isGeminiOnCooldown(model: string): boolean {
  const until = geminiCooldownUntil.get(model);
  if (!until) return false;
  if (Date.now() >= until) {
    geminiCooldownUntil.delete(model);
    return false;
  }
  return true;
}

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

export interface TranslationResult {
  text: string;
  queries: string[];
  provider: string;
  /** true bila semua provider AI gagal dan hasil berasal dari pemetaan kamus */
  usedDictionaryFallback: boolean;
}

const INSTRUCTION_ECHO_PATTERNS = [
  /precise title/i,
  /plus analytical method/i,
  /broader analyte/i,
  /omit hydrate/i,
  /when needed/i,
  /query\s*\d*\s*;/i,
  /compound names plus/i,
  /standard english compound/i,
  /title translation/i,
  /one plain query/i,
  /per line/i,
  /do not invent/i,
  /preserve stated method/i,
  // NEW: Additional patterns to catch more echo variations
  /rules:/i,
  /instruction/i,
  /example output/i,
  /indonesian title/i,
  /create.*queries/i,
  /return.*line/i,
  /following format/i,
  /here.*query/i,
  /query\s+\d+:/i,
  /^(query|step|example)\s+\d+/i,
  /guidance/i,
  /template/i,
  /format:/i,
  /output for/i,
];

const TITLE_STOPWORDS = new Set([
  "penetapan", "penentuan", "analisis", "analisa", "kadar", "kandungan", "dalam", "pada",
  "secara", "dengan", "menggunakan", "metode", "cara", "sampel", "bahan", "untuk", "dan",
  "yang", "dari", "terhadap", "teknik",
]);

function getTitleTokens(indonesianTitle: string): string[] {
  return [...new Set(
    indonesianTitle
      .toLowerCase()
      .match(/[a-z0-9]+/g) || []
  )].filter((token) => token.length >= 2 && !TITLE_STOPWORDS.has(token));
}

function isEchoedInstruction(query: string): boolean {
  return INSTRUCTION_ECHO_PATTERNS.some((pattern) => pattern.test(query));
}

function sharesTitleToken(query: string, titleTokens: string[]): boolean {
  const queryText = query.toLowerCase();
  return titleTokens.some((token) => queryText.includes(token));
}

function parseSearchQueries(result: string, indonesianTitle: string): string[] {
  const titleTokens = getTitleTokens(indonesianTitle);
  
  const lines = result
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/```$/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^query\s*\d*\s*:\s*/i, "").replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 8 && line.split(/\s+/).length >= 3 && line.split(/\s+/).length <= 20);
  
  const validQueries = lines.filter((line) => {
    // Tolak echo instruksi
    if (isEchoedInstruction(line)) return false;

    // Harus memuat istilah kimia atau analitik.
    // Catatan: pola ini menggantikan pemeriksaan "daftar kata Inggris" yang dulu menolak
    // query sah seperti "barium sulfate precipitation gravimetry" (kata "gravimetry"
    // tidak ada di daftar, padahal "gravimetric" ada).
    const hasChemistry = /\b(barium|ba|chloride|klorida|sulfate|sulfat|iron|fe|calcium|ca|sodium|na|potassium|k|magnesium|mg|zinc|zn|copper|cu|lead|pb|nitrate|phosphate|carbonate|determination|analysis|assay|quantification|gravimetric|gravimetry|titration|titrimetric|titrimetry|spectrophotometry|spectrophotometric|spectrometry|precipitation|precipitate|complexometric|chromatography|ash|protein|water|moisture|sugar|carbohydrate|fat|lipid)\b/i.test(line);

    // Harus relevan dengan judul, atau setidaknya bicara kimia analitik
    const relevant = sharesTitleToken(line, titleTokens) || hasChemistry;

    // Tidak boleh masih berbahasa Indonesia
    const noIndonesian = !/\b(penetapan|kadar|dengan|menggunakan|secara|metode|dalam|pada|kandungan|analisa)\b/i.test(line);

    // Bukan komentar meta tentang jawaban itu sendiri
    const notMeta = !/\b(here|above|below|following|example|sample|format|template)\b/i.test(line);

    return relevant && noIndonesian && notMeta;
  });
  
  return [...new Set(validQueries)].slice(0, 3);
}

/**
 * Ekstrak teks jawaban dari body provider OpenAI-compatible.
 * Menangani JSON tunggal maupun NDJSON (beberapa objek dipisah newline).
 * Pesan error dibedakan agar penyebab asli terlihat: body tak bisa di-parse
 * versus body sah tapi `content` kosong (khas model reasoning yang jatah
 * tokennya habis dipakai berpikir).
 */
function getProviderResponseText(body: string): string {
  const trimmed = body.trim();
  const candidates = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  let parsedAny = false;
  for (const value of candidates) {
    if (!value.startsWith("{") && !value.startsWith("[")) continue;
    try {
      const data = JSON.parse(value) as {
        choices?: Array<{ message?: { content?: string; reasoning?: string }; finish_reason?: string }>;
        error?: { message?: string };
      };
      parsedAny = true;

      if (data.error?.message) throw new Error(`Provider melaporkan error: ${data.error.message.slice(0, 200)}`);

      const choice = data.choices?.[0];
      const content = choice?.message?.content?.trim();
      if (content) return content;

      if (choice) {
        const finish = choice.finish_reason ?? "unknown";
        const reasoningLength = choice.message?.reasoning?.length ?? 0;
        throw new Error(
          `Provider mengembalikan content kosong (finish_reason=${finish}, panjang reasoning=${reasoningLength}). ` +
          `Kemungkinan jatah token habis dipakai reasoning.`
        );
      }
    } catch (error) {
      // Error yang kita bentuk sendiri harus diteruskan, bukan ditelan sebagai gagal parse
      if (error instanceof Error && error.message.startsWith("Provider ")) throw error;
      continue;
    }
  }

  throw new Error(
    parsedAny
      ? "Provider mengembalikan JSON tanpa pilihan jawaban"
      : "Provider mengembalikan respons yang tidak bisa di-parse sebagai JSON"
  );
}

const QUERY_PROMPT_HEADER = `You are a scientific query specialist for academic literature search.

Task: Create 3 English search queries for finding analytical chemistry literature.

QUERY STRATEGY:
Query 1: BROAD - main analyte plus method only
  Example: barium gravimetric determination
Query 2: MEDIUM - analyte plus method plus general context
  Example: barium sulfate precipitation gravimetry
Query 3: SPECIFIC - full concept using analytical wording
  Example: gravimetric determination barium sulfate method

CRITICAL RULES:
- Write general chemical words, never raw formulas. BaCl2.2H2O becomes barium, BaSO4 becomes barium sulfate.
- Never write hydrate states such as dihydrate or monohydrate. Omit them completely.
- Never write digits or chemical formulas of any kind.
- Translate every Indonesian word. No Indonesian may remain.
- Keep the analytical method that the title states. Do not invent another method or reagent.
- Each query must be 3 to 8 words.
- Return ONLY the 3 queries, one per line, with no numbering, labels, or commentary.

BAD (too specific, these return zero results):
barium chloride dihydrate gravimetric sulfate analysis
determination of Ba in BaCl2.2H2O by sulfate precipitation

GOOD:
barium gravimetric determination
barium sulfate precipitation method
gravimetric analysis barium compounds`;

function buildQueryPrompt(indonesianTitle: string): string {
  return `${QUERY_PROMPT_HEADER}

Indonesian title:
${indonesianTitle}

Generate 3 queries now:`;
}

/** Validasi akhir: minimal 2 query layak, tanpa artefak monolog model. */
function validateQueries(queries: string[]): { ok: boolean; reason?: string } {
  if (queries.length < MIN_VALID_QUERIES) {
    return { ok: false, reason: `hanya ${queries.length} query lolos filter (minimal ${MIN_VALID_QUERIES})` };
  }
  const artefak = queries.find((query) =>
    /woof|the user wants|let me translate|translation would be|\b(indonesian|indonesia)\b/i.test(query) || !/[a-z]/i.test(query)
  );
  if (artefak) return { ok: false, reason: `query memuat artefak model: "${artefak.slice(0, 60)}"` };
  return { ok: true };
}

type TranslationProvider = {
  order: number;
  name: string;
  label: string;
  run: (title: string) => Promise<string>;
};

async function callOpenAiCompatible(
  provider: { name: string; baseUrl: string; apiKey: string; model: string; isOpenRouter?: boolean },
  title: string
): Promise<string> {
  const payload: Record<string, unknown> = {
    model: provider.model,
    messages: [{ role: "user", content: buildQueryPrompt(title) }],
    temperature: 0.1,
    max_tokens: TRANSLATION_MAX_TOKENS,
  };
  // Model reasoning di OpenRouter mengembalikan monolog panjang lalu content kosong.
  // `reasoning.exclude` menekan monolog itu sehingga jatah token dipakai untuk jawaban.
  if (provider.isOpenRouter) payload.reasoning = { exclude: true };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${provider.apiKey}`,
    "Content-Type": "application/json",
  };
  if (provider.isOpenRouter) {
    if (process.env.OPENROUTER_SITE_URL) headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
    if (process.env.OPENROUTER_APP_NAME) headers["X-Title"] = process.env.OPENROUTER_APP_NAME;
  }

  const response = await fetch(`${provider.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TRANSLATION_TIMEOUT_MS),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${details.slice(0, 300)}`);
  }
  return getProviderResponseText(await response.text());
}

async function callGemini(model: string, title: string): Promise<string> {
  if (!ai) throw new Error("GEMINI_API_KEY belum dikonfigurasi");
  if (isGeminiOnCooldown(model)) throw new Error(`Gemini ${model} sedang cooldown kuota`);

  const response = await ai.models.generateContent({
    model,
    contents: buildQueryPrompt(title),
    config: { temperature: 0.1, maxOutputTokens: TRANSLATION_MAX_TOKENS },
  });
  const text = response.text?.trim();
  if (!text) throw new Error("Gemini mengembalikan teks kosong");
  return text;
}

/**
 * Daftar provider terpadu untuk tahap pembuatan query.
 * Urutan sepenuhnya ditentukan env PROVIDER_*_ORDER; tidak ada provider
 * yang dipaksa berjalan lebih dulu. Dibangun per pemanggilan agar
 * perubahan env berlaku tanpa restart proses.
 */
function buildTranslationProviders(): TranslationProvider[] {
  const openRouterEntries = [
    { name: "openrouter-minimax", model: process.env.OPENROUTER_MINIMAX_MODEL || "minimax/minimax-m3:free", order: Number(process.env.PROVIDER_OPENROUTER_MINIMAX_ORDER || 0) },
    { name: "openrouter-nvidia", model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free", order: Number(process.env.PROVIDER_OPENROUTER_NVIDIA_ORDER || 0) },
    { name: "openrouter-glm", model: process.env.OPENROUTER_FALLBACK_MODEL || "z-ai/glm-5.2:free", order: Number(process.env.PROVIDER_OPENROUTER_GLM_ORDER || 0) },
  ];

  const extraEntries = [
    { name: "terra", baseUrl: process.env.TERRA_API_BASE_URL, apiKey: process.env.TERRA_API_KEY, model: process.env.TERRA_MODEL || "gpt-5.6-terra", order: Number(process.env.PROVIDER_TERRA_ORDER || 0) },
    { name: "freetokenfaucet", baseUrl: process.env.FREETOKENFAUCET_API_BASE_URL, apiKey: process.env.FREETOKENFAUCET_API_KEY, model: process.env.FREETOKENFAUCET_MODEL || "gpt-5.6-terra", order: Number(process.env.PROVIDER_FREETOKENFAUCET_ORDER || 0) },
    { name: "aihubmix", baseUrl: process.env.AIHUBMIX_BASE_URL || "https://aihubmix.com/v1", apiKey: process.env.AIHUBMIX_API_KEY, model: process.env.AIHUBMIX_MODEL || "gemini-3.7-flash-free", order: Number(process.env.PROVIDER_AIHUBMIX_ORDER || 0) },
  ];

  const providers: TranslationProvider[] = [
    ...(ai ? [
      {
        order: Number(process.env.PROVIDER_GEMINI_36_ORDER || 0),
        name: "gemini-3.6",
        label: `Gemini · ${geminiModel}`,
        run: (title: string) => callGemini(geminiModel, title),
      },
      {
        order: Number(process.env.PROVIDER_GEMINI_35_ORDER || 0),
        name: "gemini-3.5",
        label: `Gemini · ${geminiFallbackModel}`,
        run: (title: string) => callGemini(geminiFallbackModel, title),
      },
    ] : []),

    ...openRouterEntries
      .filter((entry) => openRouterApiKey)
      .map((entry) => ({
        order: entry.order,
        name: entry.name,
        label: `OpenRouter · ${entry.model}`,
        run: (title: string) => callOpenAiCompatible(
          { name: entry.name, baseUrl: openRouterBaseUrl, apiKey: openRouterApiKey as string, model: entry.model, isOpenRouter: true },
          title
        ),
      })),

    ...extraEntries
      .filter((entry) => entry.baseUrl && entry.apiKey)
      .map((entry) => ({
        order: entry.order,
        name: entry.name,
        label: `${entry.name} · ${entry.model}`,
        run: (title: string) => callOpenAiCompatible(
          { name: entry.name, baseUrl: entry.baseUrl as string, apiKey: entry.apiKey as string, model: entry.model },
          title
        ),
      })),
  ];

  return providers.filter((provider) => provider.order > 0).sort((a, b) => a.order - b.order);
}

async function translateWithPriority(title: string): Promise<TranslationResult | null> {
  const providers = buildTranslationProviders();
  if (providers.length === 0) {
    console.warn("⚠️ Tidak ada provider translate aktif; periksa PROVIDER_*_ORDER dan API key.");
    return null;
  }
  console.log(`🔤 Urutan provider query: ${providers.map((p) => p.name).join(" → ")}`);

  for (const provider of providers) {
    try {
      const raw = await provider.run(title);
      const queries = parseSearchQueries(raw, title);
      const verdict = validateQueries(queries);

      if (verdict.ok) {
        console.log(`✅ Provider query ${provider.name} sukses: ${queries.map((q) => `"${q}"`).join(" | ")}`);
        return { text: queries[0], queries, provider: provider.name, usedDictionaryFallback: false };
      }

      console.warn(`⚠️ Provider query ${provider.name} ditolak: ${verdict.reason}`);
      void sendDeveloperErrorAlert({ stage: "Pembuatan query", provider: provider.label, message: verdict.reason ?? "output ditolak filter", recovered: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (isQuotaExceeded(error) && provider.name.startsWith("gemini")) {
        const cooldownMs = getRetryDelayMs(error);
        const modelKey = provider.name === "gemini-3.6" ? geminiModel : geminiFallbackModel;
        geminiCooldownUntil.set(modelKey, Date.now() + cooldownMs);
        console.warn(`🚫 ${provider.name} kuota habis; cooldown ${Math.round(cooldownMs / 1000)}s.`);
      }

      console.warn(`Provider query ${provider.name} gagal: ${message.slice(0, 200)}`);
      void sendDeveloperErrorAlert({ stage: "Pembuatan query", provider: provider.label, message: message.slice(0, 400), recovered: true });
    }
  }
  return null;
}

/**
 * Pemetaan kamus sebagai jaring terakhir bila semua provider AI gagal.
 * Wajib menghasilkan query yang BISA dicari: OpenAlex memperlakukan `search`
 * sebagai AND, sehingga token rumus kimia (bacl2.2h2o) atau kata Indonesia
 * yang tak terpetakan (sulfat) membuat hasil menjadi nol.
 */
function simpleKeywordMapping(indonesianTitle: string): string {
  const normalized = indonesianTitle
    .toLowerCase()
    .replace(/pennetuan|penenetuan/g, "penentuan")
    .replace(/schrool|schroll/g, "schoorl")
    .replace(/\s+/g, " ")
    .trim();
  if (/penentuan.*kadar.*abu.*gravimetri/.test(normalized)) {
    return "determination of ash content using the gravimetric method";
  }
  if (/penentuan.*kadar.*karbohidrat.*schoorl/.test(normalized)) {
    return "determination of carbohydrate content using the Luff-Schoorl method";
  }

  const termMap: Record<string, string> = {
    // tindakan
    "penentuan": "determination",
    "penetapan": "determination",
    "analisis": "analysis",
    "analisa": "analysis",
    "pengukuran": "measurement",
    "identifikasi": "identification",
    "kadar": "content",
    "kandungan": "content",
    "konsentrasi": "concentration",
    "komposisi": "composition",
    // metode
    "metode": "method",
    "teknik": "technique",
    "cara": "method",
    "gravimetri": "gravimetric",
    "gravimetrik": "gravimetric",
    "spektrofotometri": "spectrophotometry",
    "titrasi": "titration",
    "titrimetri": "titrimetric",
    "kompleksometri": "complexometric titration",
    "kromatografi": "chromatography",
    "pengendapan": "precipitation",
    "endapan": "precipitate",
    "pengabuan": "ashing",
    // analit dan pereaksi
    "sulfat": "sulfate",
    "klorida": "chloride",
    "bromida": "bromide",
    "iodida": "iodide",
    "nitrat": "nitrate",
    "fosfat": "phosphate",
    "karbonat": "carbonate",
    "oksalat": "oxalate",
    "barium": "barium",
    "ba": "barium",
    "abu": "ash",
    "besi": "iron",
    "fe": "iron",
    "kalsium": "calcium",
    "ca": "calcium",
    "magnesium": "magnesium",
    "natrium": "sodium",
    "kalium": "potassium",
    "tembaga": "copper",
    "seng": "zinc",
    "timbal": "lead",
    "air": "water",
    "gula": "sugar",
    "karbohidrat": "carbohydrate",
    "protein": "protein",
    "lemak": "fat",
    // penghubung: dibuang, bukan diterjemahkan, agar query tetap ringkas
    "dalam": "",
    "pada": "",
    "dengan": "",
    "menggunakan": "",
    "secara": "",
    "sampel": "sample",
    "bahan": "material",
    "terhadap": "",
    "untuk": "",
    "dan": "",
    "yang": "",
    "dari": "",
  };

  let result = normalized;
  for (const [indo, eng] of Object.entries(termMap)) {
    const regex = new RegExp(`\\b${indo}\\b`, "gi");
    result = result.replace(regex, eng);
  }

  result = sanitizeSearchQuery(result);
  console.log(`📖 Pemetaan kamus: "${indonesianTitle}" → "${result}"`);
  return result;
}

export async function translateToEnglish(indonesianTitle: string): Promise<TranslationResult> {
  const priorityTranslation = await translateWithPriority(indonesianTitle);
  if (priorityTranslation) return priorityTranslation;

  const fallback = simpleKeywordMapping(indonesianTitle);
  console.warn(`⚠️ Semua provider query gagal; memakai pemetaan kamus: "${fallback}"`);
  void sendDeveloperErrorAlert({
    stage: "Pembuatan query",
    provider: "dictionary",
    message: `Semua provider gagal; jatuh ke pemetaan kamus: "${fallback}"`,
    recovered: true,
  });
  return { text: fallback, queries: [fallback], provider: "dictionary", usedDictionaryFallback: true };
}
