"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { motion, MotionConfig } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { GenerateForm } from "@/components/generate-form";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function GeneratePage() {
  return (
    <MotionConfig reducedMotion="user">
      <Navbar />
      <main id="main-content" className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            aria-label="Breadcrumb"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Kembali ke Dashboard
            </Link>
          </motion.nav>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
            className="mt-6 mb-10"
          >
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Buat Landasan Teori
            </h1>
            <p className="mt-3 text-muted-foreground">
              Isi semua kolom yang bertanda{" "}
              <span className="text-destructive font-medium">*</span> dan pilih
              tingkat kedalaman teori yang sesuai kebutuhan Anda.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: EASE }}
          >
            <GenerateForm />
          </motion.div>
        </div>
      </main>
      <Footer />
    </MotionConfig>
  );
}
