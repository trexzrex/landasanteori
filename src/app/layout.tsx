import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { getSiteUrl } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Landasan Teori | Generator Analisis Kimia Berbasis Jurnal Ilmiah",
    template: "%s | Landasan Teori",
  },
  description:
    "Platform penyusunan landasan teori laporan praktikum analisis kimia otomatis berbasis referensi jurnal open access dan standar SNI.",
  applicationName: "Landasan Teori Generator",
  authors: [{ name: "Tim Landasan Teori" }],
  generator: "Next.js",
  keywords: [
    "landasan teori",
    "analisis kimia",
    "generator landasan teori",
    "laporan praktikum kimia",
    "sitasi jurnal kimia",
    "jurnal open access",
    "SNI analisis kimia",
    "spektrofotometri",
    "titrimetri",
    "gravimetri",
  ],
  creator: "Landasan Teori",
  publisher: "Landasan Teori",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Landasan Teori | Generator Analisis Kimia",
    description:
      "Susun landasan teori praktikum analisis kimia berbasis referensi jurnal open access dan standar SNI.",
    url: siteUrl,
    siteName: "Landasan Teori",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Landasan Teori | Generator Analisis Kimia",
    description:
      "Susun landasan teori praktikum analisis kimia berbasis referensi jurnal open access dan standar SNI.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
        >
          Langsung ke konten utama
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <FeedbackDialog />
        </ThemeProvider>
      </body>
    </html>
  );
}
