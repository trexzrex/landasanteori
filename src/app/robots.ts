import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/privacy-policy",
          "/terms-of-service",
        ],
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard/",
          "/generate",
          "/result",
          "/verify",
          "/reset-password",
          "/onboarding",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
