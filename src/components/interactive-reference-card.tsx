"use client";

import * as React from "react";
import { Check, Copy, ExternalLink, FileCode, Globe, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cleanCitationText,
  generateBibTeX,
  parseCitationString,
  type ParsedCitation,
} from "@/lib/citation-utils";
import { cn } from "@/lib/utils";

interface InteractiveReferenceCardProps {
  citation: string;
  index: number;
  isHighlighted?: boolean;
}

export function InteractiveReferenceCard({
  citation,
  index,
  isHighlighted,
}: InteractiveReferenceCardProps) {
  const [copiedType, setCopiedType] = React.useState<"apa" | "bibtex" | null>(null);

  const parsed: ParsedCitation = React.useMemo(
    () => parseCitationString(citation),
    [citation]
  );

  const handleCopyAPA = async () => {
    try {
      const cleanText = cleanCitationText(citation);
      await navigator.clipboard.writeText(cleanText);
      setCopiedType("apa");
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("Gagal menyalin sitasi APA:", err);
    }
  };

  const handleCopyBibTeX = async () => {
    try {
      const bibtex = generateBibTeX(parsed, index + 1);
      await navigator.clipboard.writeText(bibtex);
      setCopiedType("bibtex");
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("Gagal menyalin BibTeX:", err);
    }
  };

  // Render teks dengan style italic untuk nama jurnal (*...*)
  const renderFormattedCitation = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={idx} className="font-serif italic text-foreground">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div
      id={`ref-${index + 1}`}
      className={cn(
        "group relative rounded-xl border p-4 transition-all duration-300 scroll-mt-24",
        isHighlighted
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/15 ring-2 ring-primary/40 scale-[1.01]"
          : "border-border/70 bg-card hover:border-primary/40 hover:bg-card/90 hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Badge Nomor Rujukan */}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          [{index + 1}]
        </span>

        {/* Konten & Tombol Aksi */}
        <div className="min-w-0 flex-1 space-y-3">
          {/* Teks Sitasi Utama */}
          <div className="text-sm leading-relaxed text-foreground">
            {renderFormattedCitation(citation)}
          </div>

          {/* Baris Tombol Aksi Cepat */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Tombol Salin Sitasi APA */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAPA}
              className="h-8 gap-1.5 px-2.5 text-xs transition-colors hover:border-primary/50"
              title="Salin sitasi berformat APA untuk laporan Word"
            >
              {copiedType === "apa" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span className="text-success font-medium">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Salin APA</span>
                </>
              )}
            </Button>

            {/* Tombol Salin BibTeX */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyBibTeX}
              className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              title="Salin BibTeX untuk Mendeley, Zotero, atau LaTeX"
            >
              {copiedType === "bibtex" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span className="text-success font-medium">BibTeX Tersalin</span>
                </>
              ) : (
                <>
                  <FileCode className="h-3.5 w-3.5" />
                  <span>BibTeX</span>
                </>
              )}
            </Button>

            {/* Tombol Buka DOI / Link Asli */}
            {parsed.url && (
              <a
                href={parsed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-secondary/30 px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Buka publikasi jurnal asli di tab baru"
              >
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span>Buka Jurnal</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground ml-0.5" />
              </a>
            )}

            {/* Badge Tipe Sumber */}
            {parsed.doi && (
              <span className="ml-auto hidden sm:inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                DOI: {parsed.doi}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
