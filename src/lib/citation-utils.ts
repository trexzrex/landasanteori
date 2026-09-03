/**
 * citation-utils.ts
 * 
 * Utilitas untuk mem-parsing string sitasi APA dari pipeline jurnal,
 * mengekstrak URL/DOI, dan mengonversinya menjadi format BibTeX serta teks murni.
 */

export interface ParsedCitation {
  raw: string;
  authors: string;
  year: string;
  title: string;
  journal: string;
  url: string | null;
  doi: string | null;
}

/**
 * Parsing teks sitasi APA hasil formatAPA():
 * Contoh format: "Smith, J., & Doe, A. (2024). Analisis Kadar Besi. *Journal of Analytical Chemistry*. https://doi.org/10.1000/182"
 */
export function parseCitationString(citation: string): ParsedCitation {
  const trimmed = citation.trim();

  // Ekstrak URL atau DOI
  let url: string | null = null;
  let doi: string | null = null;

  const urlMatch = trimmed.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    url = urlMatch[0];
    const doiMatch = url.match(/doi\.org\/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
    if (doiMatch) {
      doi = doiMatch[1];
    }
  }

  // Bersihkan URL dari teks sitasi untuk ekstraksi komponen
  const textWithoutUrl = trimmed.replace(/https?:\/\/[^\s]+/, "").trim();

  // Pola umum APA: Authors (Year). Title. *Journal*.
  const yearMatch = textWithoutUrl.match(/\((\d{4}[a-z]?)\)/);
  const year = yearMatch ? yearMatch[1] : "";

  let authors = "";
  let titleAndJournal = textWithoutUrl;

  if (yearMatch && yearMatch.index !== undefined) {
    authors = textWithoutUrl.slice(0, yearMatch.index).trim().replace(/[.,;]$/, "");
    titleAndJournal = textWithoutUrl.slice(yearMatch.index + yearMatch[0].length).trim().replace(/^[.,\s]+/, "");
  }

  // Pisahkan title dan journal (biasanya journal diapit tanda bintang markdown *...*)
  let title = titleAndJournal;
  let journal = "";

  const journalMatch = titleAndJournal.match(/\*([^*]+)\*/);
  if (journalMatch) {
    journal = journalMatch[1];
    title = titleAndJournal.replace(/\*([^*]+)\*/, "").replace(/[.,\s]+$/, "").trim();
  } else {
    // Jika tidak ada markdown italic, pisahkan berdasarkan titik
    const dotParts = titleAndJournal.split(/\.\s+/);
    if (dotParts.length > 1) {
      title = dotParts[0].trim();
      journal = dotParts.slice(1).join(". ").replace(/[.,\s]+$/, "").trim();
    }
  }

  return {
    raw: trimmed,
    authors: authors || "Penulis",
    year: year || "n.d.",
    title: title.replace(/[.*]+$/, "").trim(),
    journal: journal.trim(),
    url,
    doi,
  };
}

/**
 * Menghasilkan format sitasi BibTeX untuk import ke Mendeley / Zotero / LaTeX
 */
export function generateBibTeX(parsed: ParsedCitation, citationIndex: number): string {
  const firstAuthor = parsed.authors.split(/[,&]/)[0].trim().replace(/[^a-zA-Z]/g, "") || "ref";
  const citeKey = `${firstAuthor.toLowerCase()}${parsed.year || "unknown"}_${citationIndex}`;

  const cleanTitle = parsed.title.replace(/[{}\\]/g, "");
  const cleanJournal = parsed.journal.replace(/[{}\\]/g, "");

  const fields: string[] = [
    `  title = {${cleanTitle}}`,
    `  author = {${parsed.authors}}`,
  ];

  if (parsed.year && parsed.year !== "n.d.") {
    fields.push(`  year = {${parsed.year}}`);
  }

  if (cleanJournal) {
    fields.push(`  journal = {${cleanJournal}}`);
  }

  if (parsed.doi) {
    fields.push(`  doi = {${parsed.doi}}`);
  }

  if (parsed.url) {
    fields.push(`  url = {${parsed.url}}`);
  }

  return `@article{${citeKey},\n${fields.join(",\n")}\n}`;
}

/**
 * Membersihkan format markdown italic (*Journal*) menjadi teks polos siap salin
 */
export function cleanCitationText(citation: string): string {
  return citation.replace(/\*([^*]+)\*/g, "$1").trim();
}
