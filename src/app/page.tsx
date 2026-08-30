import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { CtaSection } from "@/components/sections/cta-section";
import { MotionConfig } from "framer-motion";

export default function Home() {
  return (
    <>
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
