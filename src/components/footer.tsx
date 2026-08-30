import Link from "next/link";
import { FlaskConical } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FlaskConical className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>
            Landasan<span className="text-primary">Teori</span> — Generator
            Landasan Teori Analisis Kimia
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center sm:items-end sm:text-right">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/privacy-policy" className="inline-flex min-h-11 items-center rounded-md px-2 underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Kebijakan Privasi
            </Link>
            <Link href="/terms-of-service" className="inline-flex min-h-11 items-center rounded-md px-2 underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Syarat &amp; Ketentuan
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()}
          </p>
          <p className="text-xs text-muted-foreground">
            Dibuat oleh{" "}
            <a
              href="https://instagram.com/athaar.mp"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Athar | @athaar.mp
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
