require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');

const OPENALEX_EMAIL = process.env.OPENALEX_EMAIL;
const OPENALEX_API_KEY = process.env.OPENALEX_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

async function translateTitleToQueries(judul) {
  const prompt = "Tugas: Ubah judul praktikum kimia bahasa Indonesia berikut menjadi 3 variasi kata kunci (query) pencarian jurnal ilmiah dalam BAHASA INGGRIS.\nJudul: \"" + judul + "\"\nAturan:\n1. Keluarkan HANYA 3 baris.\n2. Setiap baris berisi 1 kueri pencarian bahasa Inggris.\n3. Jangan gunakan tanda kutip, nomor, bullet, atau kata pengantar.\n4. Buat kueri yang umum tapi spesifik (misal: potassium permanganate molar absorptivity, permanganate index water analysis).";

  // 1. Coba Native Gemini API
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
        contents: prompt,
        config: { temperature: 0.3 }
      });
      const content = response.text || "";
      const queries = content.split('\n').map(q => q.trim().replace(/^[\d\.\-\*"]+/g, "").trim()).filter(Boolean);
      if (queries.length > 0) {
        return { queries: queries.slice(0, 3), provider: "Gemini" };
      }
    } catch (err) {
      console.warn("  [!] Translasi Gemini gagal:", err.message);
    }
  }

  // 2. Fallback Apinex (DeepSeek v4 Pro)
  const APINEX_API_KEY = process.env.APINEX_API_KEY;
  const APINEX_BASE_URL = process.env.APINEX_BASE_URL || "https://api.apinex.bond/v1";
  const APINEX_MODEL = process.env.APINEX_MODEL || "free/deepseek-v4-pro-0813";

  if (APINEX_API_KEY) {
    try {
      const endpoint = APINEX_BASE_URL.replace(/\/$/, "") + "/chat/completions";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + APINEX_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: APINEX_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 2000
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
        const lines = content.split('\n').map(q => q.trim().replace(/^[\d\.\-\*"]+/g, "").trim()).filter(Boolean);
        const queries = lines.filter(l => !l.toLowerCase().includes("diterjemahkan") && !l.toLowerCase().includes("berikut")).slice(0, 3);
        
        if (queries.length > 0) {
          return { queries: queries, provider: "Apinex" };
        }
      } else {
         console.warn("  [!] Translasi Apinex gagal: HTTP", res.status);
      }
    } catch (err) {
      console.warn("  [!] Translasi Apinex gagal:", err.message);
    }
  }

  return { queries: [judul], provider: "None" };
}

async function fetchFromOpenAlexVariant(query) {
  const url = "https://api.openalex.org/works?search=" + encodeURIComponent(query) + "&filter=is_oa:true,publication_year:>1999&per_page=30&sort=relevance_score:desc";
  const headers = {
    "User-Agent": OPENALEX_EMAIL ? "LandasanTeoriGenerator/1.0 (mailto:" + OPENALEX_EMAIL + ")" : "LandasanTeoriGenerator/1.0",
  };
  if (OPENALEX_API_KEY) headers["Authorization"] = "Bearer " + OPENALEX_API_KEY;

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(work => {
      let abstract = "";
      if (work.abstract_inverted_index) {
        const index = work.abstract_inverted_index;
        const maxPos = Math.max(...Object.values(index).flat());
        const words = new Array(maxPos + 1).fill("");
        for (const [word, positions] of Object.entries(index)) {
          for (const pos of positions) words[pos] = word;
        }
        abstract = words.join(" ").trim();
      }
      return {
        title: work.title,
        authors: (work.authorships || []).map(a => a.author && a.author.display_name).filter(Boolean),
        year: work.publication_year,
        journal: work.primary_location && work.primary_location.source ? work.primary_location.source.display_name : "Unknown Journal",
        abstract: abstract,
        doi: work.doi,
        citationCount: work.cited_by_count || 0,
        source: "openalex"
      };
    }).filter(j => j.abstract && j.abstract.length > 200);
  } catch (err) {
    return [];
  }
}

async function fetchAllVariants(variants) {
  const allJournals = [];
  const promises = variants.map(v => fetchFromOpenAlexVariant(v));
  const results = await Promise.all(promises);
  
  for (const res of results) {
    allJournals.push(...res);
  }

  const unique = [];
  const seen = new Set();
  for (const j of allJournals) {
    const key = j.doi || j.title.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(j);
    }
  }
  return unique;
}

async function runBackfill() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("? Pastikan .env.local berisi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("???  Mereset (menghapus) semua cache lama secara paksa...");
  await supabase.from('journal_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("? Cache telah dibersihkan!\n");

  console.log("?? Mengambil data riwayat judul praktikum dari Supabase...");
  const { data: generations, error: genError } = await supabase
    .from("generations")
    .select("judul_analisis")
    .eq("status", "success");

  if (genError) {
    console.error("? Gagal membaca tabel generations:", genError.message);
    return;
  }

  const uniqueTitles = [...new Set(generations.map(g => g.judul_analisis.toLowerCase().replace(/\s+/g, " ").trim()))].filter(Boolean);
  console.log("?? Ditemukan " + uniqueTitles.length + " judul unik di riwayat generasi.\n");

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < uniqueTitles.length; i++) {
    const originalQuery = uniqueTitles[i];
    console.log("[" + (i + 1) + "/" + uniqueTitles.length + "] Memproses judul: \"" + originalQuery + "\"");
    
    // 1. Translasi AI (dengan fallback)
    const { queries: englishVariants, provider } = await translateTitleToQueries(originalQuery);
    console.log("  ?? Translasi (" + provider + "): " + englishVariants.join(" | "));

    // 2. Fetch Multi-Variant
    const journals = await fetchAllVariants(englishVariants);

    // 3. Simpan
    if (journals.length > 0) {
      const { error: insertError } = await supabase.from("journal_cache").insert({
        search_query: originalQuery,
        journals: journals
      });

      if (insertError && insertError.code !== '23505') {
        console.error("  ? Gagal menyimpan ke Supabase: " + insertError.message);
        failCount++;
      } else {
        console.log("  ? Disimpan " + journals.length + " jurnal ke cache.");
        successCount++;
      }
    } else {
      console.log("  ?? Tidak ditemukan jurnal bahasa inggris yang cocok. Dilewati.");
      failCount++;
    }

    if (i < uniqueTitles.length - 1) {
      console.log("  ? Jeda 10 detik agar tidak diblokir API...\n");
      await sleep(10000);
    }
  }

  console.log("\n?? Proses Backfill Selesai! Berhasil disedot: " + successCount + ", Gagal/Dilewati: " + failCount);
}

runBackfill();
