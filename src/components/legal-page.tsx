import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <nav aria-label="Breadcrumb" className="mb-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Kembali ke Beranda
            </Link>
          </nav>

          <header className="mb-12 border-b border-border pb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Terakhir diperbarui: {updatedAt}
            </p>
          </header>

          <div className="space-y-10 text-[0.9375rem] leading-relaxed text-muted-foreground">
            {children}
          </div>

          <div className="mt-16 border-t border-border pt-8">
            <p className="text-sm text-muted-foreground">
              Pertanyaan lain? Hubungi{" "}
              <a
                href="mailto:trexzrex123@gmail.com"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                trexzrex123@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{heading}</h2>
      {children}
    </section>
  );
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5 pl-1">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
