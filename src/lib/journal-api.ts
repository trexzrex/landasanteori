/**
 * journal-api.ts
 * 
 * Modul pencarian jurnal akademik open access dari:
 * 1. OpenAlex (primary)
 * 2. Semantic Scholar (fallback)
 * 
 * Mengambil metadata (title, authors, year, journal) dan abstrak
 * untuk digunakan sebagai konteks RAG.
 */

export interface JournalMetadata {
  title: string;
  authors: string[];
  year: number;
  journal: string;
  doi?: string;
  url?: string;
  abstract: string;
  citationCount: number;
  source: "openalex" | "semantic" | "crossref";
}

const OPENALEX_API_KEY = process.env.OPENALEX_API_KEY;
const OPENALEX_EMAIL = process.env.OPENALEX_EMAIL;
const OPENALEX_BASE_URL = "https://api.openalex.org/works";

/**
 * Kata Indonesia yang tersisa bila penerjemahan gagal separuh jalan.
 * OpenAlex mengindeks literatur berbahasa Inggris, jadi token ini menihilkan hasil.
 */
const RESIDUAL_INDONESIAN = new Set([
  "penetapan", "penentuan", "analisa", "analisis", "kadar", "kandungan", "konsentrasi",
  "dalam", "pada", "secara", "dengan", "menggunakan", "metode", "cara", "teknik",
  "sampel", "bahan", "untuk", "dan", "yang", "dari", "terhadap", "sulfat", "klorida",
  "bromida", "iodida", "nitrat", "fosfat", "karbonat", "oksalat", "endapan",
  "pengendapan", "pengabuan", "abu", "besi", "kalsium", "gula", "lemak", "air",
  "gravimetri", "gravimetrik", "titrasi", "titrimetri", "spektrofotometri",
  "kompleksometri", "kromatografi", "proksumat", "proksimat",
]);

/** Kata sambung Inggris tanpa daya pembeda; menyempitkan pencarian tanpa manfaat. */
const ENGLISH_STOPWORDS = new Set([
  "the", "a", "an", "of", "in", "on", "at", "by", "for", "with", "to", "from",
  "using", "used", "use", "and", "or", "as", "is", "are", "be", "its", "into",
  "method", "methods", "sample", "samples", "material", "materials", "content",
]);

/**
 * Bersihkan query sebelum dikirim ke penyedia literatur.
 *
 * OpenAlex memperlakukan parameter `search` sebagai AND atas seluruh token, jadi
 * satu token mustahil membuat seluruh pencarian nol. Terverifikasi lewat panggilan
 * langsung: "determination content ba in bacl2.2h2o by gravimetric with method"
 * menghasilkan 2 dokumen, dan penambahan "sulfat" menjadikannya 0.
 *
 * Yang dibuang: rumus kimia (bacl2, h2so4), penanda hidrat (2h2o, dihydrate),
 * angka lepas, sisa kata Indonesia, dan kata sambung tanpa daya pembeda.
 */
export function sanitizeSearchQuery(query: string): string {
  const tokens = query
    .toLowerCase()
    .replace(/[()[\]{}"'`,;:]/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^[.\-–—]+|[.\-–—]+$/g, "").trim())
    .filter(Boolean);

  const kept = tokens.filter((token) => {
    // Rumus kimia: huruf diikuti angka (bacl2, h2o, baso4, fe2o3), termasuk varian hidrat 2h2o
    if (/\d/.test(token)) return false;
    // Penanda hidrat dalam bentuk kata
    if (/^(mono|di|tri|tetra|penta|hexa|hepta|octa|nona|deca)?hydrate$/.test(token)) return false;
    if (/^(anhydrous|anhidrat|dihidrat|monohidrat)$/.test(token)) return false;
    // Sisa bahasa Indonesia
    if (RESIDUAL_INDONESIAN.has(token)) return false;
    // Kata sambung tanpa daya pembeda
    if (ENGLISH_STOPWORDS.has(token)) return false;
    // Token satu huruf tidak berguna sebagai kata kunci
    if (token.length < 2) return false;
    return true;
  });

  const result = [...new Set(kept)].join(" ").trim();
  // Bila penyaringan menyisakan terlalu sedikit, kembalikan versi ringan
  // agar tidak malah menghapus satu-satunya kata kunci yang ada.
  if (result.split(/\s+/).filter(Boolean).length < 2) {
    return tokens.filter((token) => !/\d/.test(token) && !RESIDUAL_INDONESIAN.has(token) && token.length >= 2).join(" ").trim();
  }
  return result;
}

/** Ambil kata analit dari query, mis. "barium" dari query panjang apa pun. */
function extractAnalyte(query: string): string | null {
  const match = query.toLowerCase().match(/\b(barium|iron|calcium|magnesium|sodium|potassium|copper|zinc|lead|nickel|chromium|manganese|aluminium|aluminum|phosphorus|nitrogen|sulfur|chloride|sulfate|nitrate|phosphate|carbonate|protein|ash|moisture|water|sugar|carbohydrate|fat|lipid|vitamin)\b/);
  return match ? match[1] : null;
}

/** Ambil kata metode dari query, mis. "gravimetric". */
function extractMethod(query: string): string | null {
  const match = query.toLowerCase().match(/\b(gravimetric|gravimetry|titration|titrimetric|titrimetry|spectrophotometry|spectrophotometric|spectrometry|chromatography|precipitation|complexometric|potentiometric|volumetric)\b/);
  return match ? match[1] : null;
}

/**
 * Pencarian jurnal di OpenAlex dengan filter open access.
 * Prioritas: publikasi 10 tahun terakhir, relevansi tinggi.
 */
async function searchOpenAlexQuery(
  cleanQuery: string,
  filter: string
): Promise<JournalMetadata[]> {
  const currentYear = new Date().getFullYear();
  const params = new URLSearchParams({
    search: cleanQuery,
    filter,
    per_page: "10",
    sort: "relevance_score:desc",
  });
  const headers: HeadersInit = {
    "User-Agent": OPENALEX_EMAIL
      ? `LandasanTeoriGenerator/1.0 (mailto:${OPENALEX_EMAIL})`
      : "LandasanTeoriGenerator/1.0",
  };
  if (OPENALEX_API_KEY) headers["Authorization"] = `Bearer ${OPENALEX_API_KEY}`;

  const url = `${OPENALEX_BASE_URL}?${params.toString()}`;
  console.log(`OpenAlex URL: ${url}`);
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => "No text");
    throw new Error(`OpenAlex API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const results: JournalMetadata[] = [];
  for (const work of data.results || []) {
    const abstract = work.abstract || reconstructAbstract(work.abstract_inverted_index);
    if (!abstract || abstract.length < 100) continue;
    const authorNames = (work.authorships || [])
      .slice(0, 3)
      .map((a: { author?: { display_name?: string } }) => a.author?.display_name)
      .filter(Boolean) as string[];
    results.push({
      title: work.title || "Untitled",
      authors: authorNames.length > 0 ? authorNames : ["Unknown"],
      year: work.publication_year || currentYear,
      journal: work.primary_location?.source?.display_name || "Unknown Journal",
      doi: work.doi?.replace("https://doi.org/", ""),
      url: work.doi || work.id,
      abstract: abstract.slice(0, 1500),
      citationCount: work.cited_by_count || 0,
      source: "openalex" as const,
    });
  }
  return results;
}

export async function searchOpenAlex(
  query: string,
  keywords: string[] = []
): Promise<JournalMetadata[]> {
  const rawQuery = [query, ...keywords].filter(Boolean).join(" ").replace(/\bait\b/gi, "air");
  const sanitized = sanitizeSearchQuery(rawQuery);
  if (sanitized !== rawQuery.toLowerCase().trim()) {
    console.log(`🧼 Query dibersihkan: "${rawQuery}" → "${sanitized}"`);
  }

  const analyte = extractAnalyte(sanitized) ?? extractAnalyte(rawQuery);
  const method = extractMethod(sanitized) ?? extractMethod(rawQuery);
  const tokens = sanitized.split(/\s+/).filter(Boolean);

  // Strategi bertingkat, dari paling sempit ke paling longgar.
  // OpenAlex ber-AND, jadi query pendek justru lebih besar peluang menemukan hasil.
  const variants = [
    sanitized,
    // Empat token pertama saja
    tokens.slice(0, 4).join(" "),
    // Analit + metode: inti pertanyaan penelitian
    analyte && method ? `${analyte} ${method}` : null,
    // Analit + determination
    analyte ? `${analyte} determination` : null,
    // Metode saja sebagai jaring terakhir
    method,
  ];

  const uniqueVariants = [...new Set(
    variants
      .filter((value): value is string => Boolean(value))
      .map((value) => value.trim())
      .filter((value) => value.length >= 4)
  )];

  const fromYear = 1999;
  const filters = [
    `is_oa:true,publication_year:>${fromYear}`,
    "is_oa:true",
    `publication_year:>${fromYear}`,
  ];

  for (const variant of uniqueVariants) {
    for (const filter of filters) {
      try {
        const results = await searchOpenAlexQuery(variant, filter);
        if (results.length > 0) {
          if (variant !== sanitized) {
            console.log(`🔎 Varian pencarian berhasil: "${variant}" (${results.length} hasil)`);
          }
          return results;
        }
      } catch (error) {
        console.error("OpenAlex search failed:", error);
      }
    }
  }
  return [];
}

/**
 * Rekonstruksi abstrak dari inverted index OpenAlex.
 */
function reconstructAbstract(invertedIndex: Record<string, number[]> | null): string {
  if (!invertedIndex) return "";
  
  try {
    const words: [string, number][] = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
      for (const pos of positions) {
        words.push([word, pos]);
      }
    }
    words.sort((a, b) => a[1] - b[1]);
    return words.map(([word]) => word).join(" ");
  } catch {
    return "";
  }
}

/**
 * Pencarian jurnal di Semantic Scholar (fallback).
 */
export async function searchSemanticScholar(
  query: string,
  keywords: string[] = []
): Promise<JournalMetadata[]> {
  try {
    const currentYear = new Date().getFullYear();
    const fromYear = 1999;

    const rawQuery = keywords.length > 0 
      ? `${query} ${keywords.join(" ")}`
      : query;

    // Sanitasi yang sama dengan OpenAlex: rumus kimia dan sisa kata Indonesia
    // membuat pencarian literatur berbahasa Inggris menjadi nol.
    const cleanQuery = sanitizeSearchQuery(rawQuery) || rawQuery.replace(/[()[\]{}"']/g, " ").replace(/\s+/g, " ").trim();

    const params = new URLSearchParams({
      query: cleanQuery,
      limit: "10",
      fields: "title,authors,year,venue,abstract,openAccessPdf,externalIds,citationCount",
      year: `${fromYear}-`,
      openAccessPdf: "",
    });

    const response = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?${params.toString()}`,
      {
        headers: {
          "User-Agent": "LandasanTeoriGenerator/1.0",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("Semantic Scholar rate limited (429), gracefully skipping...");
        return [];
      }
      const errText = await response.text().catch(() => "No text");
      throw new Error(`Semantic Scholar API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const results: JournalMetadata[] = [];

    for (const paper of data.data || []) {
      if (!paper.abstract || paper.abstract.length < 100) continue;

      const authorNames = (paper.authors || [])
        .slice(0, 3)
        .map((a: { name?: string }) => a.name)
        .filter(Boolean) as string[];

      results.push({
        title: paper.title || "Untitled",
        authors: authorNames.length > 0 ? authorNames : ["Unknown"],
        year: paper.year || currentYear,
        journal: paper.venue || "Unknown Journal",
        doi: paper.externalIds?.DOI,
        url: paper.openAccessPdf?.url,
        abstract: paper.abstract.slice(0, 1500),
        citationCount: paper.citationCount || 0,
        source: "semantic" as const,
      });
    }

    return results;
  } catch (error) {
    console.error("Semantic Scholar search failed:", error);
    return [];
  }
}

/**
 * Strategi pencarian dengan fallback otomatis.
 * Coba OpenAlex dulu, jika gagal/kosong → Semantic Scholar.
 */
async function searchCrossref(query: string): Promise<JournalMetadata[]> {
  try {
    const params = new URLSearchParams({
      query,
      rows: "10",
      filter: `from-pub-date:${new Date().getFullYear() - 15}-01-01`,
      select: "title,author,published,container-title,DOI,URL,abstract",
    });
    const response = await fetch(`https://api.crossref.org/works?${params}`, {
      headers: {
        "User-Agent": OPENALEX_EMAIL
          ? `LandasanTeoriGenerator/1.0 (mailto:${OPENALEX_EMAIL})`
          : "LandasanTeoriGenerator/1.0",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.message?.items || [])
      .filter((item: { abstract?: string }) => item.abstract)
      .map((item: {
        title?: string[];
        author?: { given?: string; family?: string }[];
        published?: { "date-parts"?: number[][] };
        [key: string]: unknown;
      }) => {
        const publishedParts = item.published?.["date-parts"]?.[0] || [];
        const abstract = String(item.abstract || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\\s+/g, " ")
          .trim();
        return {
          title: item.title?.[0] || "Untitled",
          authors: (item.author || []).slice(0, 3).map((author) =>
            [author.given, author.family].filter(Boolean).join(" ")
          ),
          year: publishedParts[0] || new Date().getFullYear(),
          journal: Array.isArray(item["container-title"])
            ? String(item["container-title"][0] || "Unknown Journal")
            : "Unknown Journal",
          doi: typeof item.DOI === "string" ? item.DOI : undefined,
          url: typeof item.URL === "string" ? item.URL : undefined,
          abstract: abstract.slice(0, 1500),
          citationCount: 0,
          source: "crossref" as const,
        } satisfies JournalMetadata;
      })
      .filter((item: JournalMetadata) => item.abstract.length >= 100);
  } catch (error) {
    console.error("Crossref search failed:", error);
    return [];
  }
}

/**
 * Deduplicate journals by DOI or title similarity
 */
function deduplicateByDOI(journals: JournalMetadata[]): JournalMetadata[] {
  const seen = new Set<string>();
  
  return journals.filter(journal => {
    const key = journal.doi 
      ? journal.doi.toLowerCase().trim()
      : journal.title.toLowerCase().replace(/\s+/g, " ").trim();
    
    if (seen.has(key)) {
      console.log(`🔄 Duplicate skipped: "${journal.title}"`);
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Rank journals by: citation count (40%), abstract length (30%), recency (30%)
 * Filter: abstract > 500 chars, year >= 2018, citations > 5
 */
function rankJournals(journals: JournalMetadata[], queries: string[]): JournalMetadata[] {
  const filtered = journals.filter(j => 
    j.abstract.length > 200 && 
    j.year >= 2000 &&
    j.citationCount >= 0
  );
  const ignoredTerms = new Set(["analisis", "analysis", "penetapan", "determination", "kadar", "content", "dalam", "secara", "metode", "method", "gravimetri", "gravimetric"]);
  const relevanceTerms = [...new Set(
    queries
      .flatMap((query) => query.toLowerCase().match(/[a-z0-9]+/g) || [])
      .filter((term) => term.length >= 3 && !ignoredTerms.has(term))
  )];
  const score = (journal: JournalMetadata) => {
    const title = journal.title.toLowerCase();
    const abstract = journal.abstract.toLowerCase();
    const relevance = relevanceTerms.reduce((total, term) =>
      total + (title.includes(term) ? 120 : 0) + (abstract.includes(term) ? 20 : 0), 0);
    return relevance +
      (journal.citationCount * 0.4) +
      (journal.abstract.length / 100 * 0.3) +
      ((journal.year - 2018) * 5 * 0.3);
  };

  console.log(`📊 Filtered: ${filtered.length}/${journals.length} journals meet criteria (abstract>200, year>=2000, citations>=0)`);

  return filtered.sort((a, b) => score(b) - score(a));
}

/**
 * Fetch journals from multiple sources in parallel, merge, deduplicate, and rank.
 * Returns top 4-5 most relevant journals.
 * Supports multiple query variants for better coverage.
 */
export async function fetchAllSources(
  queries: string[]
): Promise<JournalMetadata[]> {
  
  console.log(`🔍 Fetching journals (parallel) for ${queries.length} query variant(s): ${queries.map(q => `"${q}"`).join(" | ")}`);
  
  const searchPromises = queries.flatMap(query => [
    searchOpenAlex(query)
      .then(results => ({ source: "openalex", query, results }))
      .catch(err => ({ source: "openalex", query, results: [] as JournalMetadata[], error: err })),
    
    searchSemanticScholar(query)
      .then(results => ({ source: "semantic", query, results }))
      .catch(err => ({ source: "semantic", query, results: [] as JournalMetadata[], error: err }))
  ]);

  const allResults = await Promise.all(searchPromises);
  
  const allJournals: JournalMetadata[] = [];
  for (const result of allResults) {
    const { source, query, results } = result;
    if ("error" in result) {
      console.warn(`⚠️ ${source} failed for query "${query}": ${result.error instanceof Error ? result.error.message : String(result.error)}`);
    } else {
      console.log(`📚 ${source} found ${results.length} journals for "${query}"`);
      allJournals.push(...results);
    }
  }

  const uniqueJournals = deduplicateByDOI(allJournals);
  const rankedJournals = rankJournals(uniqueJournals, queries);
  const top7 = rankedJournals.slice(0, 7);

  console.log(`✅ Total: ${allJournals.length} journals found → ${uniqueJournals.length} unique → ${top7.length} top-ranked selected`);
  
  return top7;
}

import { searchSniStandards } from "@/lib/sni-online";

export async function searchJournals(
  query: string
): Promise<JournalMetadata[]> {
  return fetchAllSources([query]);
}

/**
 * Format metadata jurnal ke APA citation style.
 */
export async function searchStandards(query: string): Promise<string[]> {
  return searchSniStandards(query);
}

export function formatAPA(journal: JournalMetadata): string {
  const authorsStr =
    journal.authors.length > 3
      ? `${journal.authors.slice(0, 3).join(", ")}, et al.`
      : journal.authors.join(", ");

  let citation = `${authorsStr} (${journal.year}). ${journal.title}. `;
  
  if (journal.journal && journal.journal !== "Unknown Journal") {
    citation += `*${journal.journal}*.`;
  }

  if (journal.doi) {
    citation += ` https://doi.org/${journal.doi}`;
  } else if (journal.url) {
    citation += ` ${journal.url}`;
  }

  return citation;
}
