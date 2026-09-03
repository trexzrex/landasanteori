import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { CtaSection } from "@/components/sections/cta-section";
import { MotionConfig } from "framer-motion";
import { getSiteUrl } from "@/lib/utils";

export default function Home() {
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Landasan Teori Generator",
    applicationCategory: "EducationalApplication",
    operatingSystem: "All",
    url: siteUrl,
    description:
      "Platform penyusun landasan teori laporan praktikum analisis kimia otomatis berbasis referensi jurnal open access dan standar SNI.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "IDR",
    },
    featureList: [
      "Penyusunan landasan teori kimia otomatis",
      "Sitasi gaya APA dari jurnal Open Access",
      "Integrasi parameter analisis SNI",
      "Ekspor dokumen Word dan PDF",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main id="main-content" className="flex-1">
        <MotionConfig reducedMotion="user">
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <CtaSection />
        </MotionConfig>
      </main>
      <Footer />
    </>
  );
}

