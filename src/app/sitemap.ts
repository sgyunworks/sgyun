import type { MetadataRoute } from "next";
import { abs, portfolioLastModified, publishedWorks } from "@/lib/seo";

// Every indexable page in both locales, with hreflang alternates. lastModified follows portfolio.json `updatedAt`.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = portfolioLastModified;
  const localized = (rest: string, priority: number, changeFrequency: "weekly" | "monthly") =>
    (["ko", "en"] as const).map((locale) => ({
      url: abs(`/${locale}${rest}`),
      lastModified,
      changeFrequency,
      priority: locale === "ko" ? priority : Math.round(priority * 90) / 100,
      alternates: { languages: { ko: abs(`/ko${rest}`), en: abs(`/en${rest}`), "x-default": abs(`/ko${rest}`) } },
    }));

  return [
    ...localized("", 1, "weekly"),
    ...localized("/works", 0.9, "weekly"),
    ...localized("/about", 0.9, "monthly"),
    ...publishedWorks.flatMap((p) => localized(`/works/${p.slug}`, 0.8, "monthly")),
    ...localized("/contact", 0.5, "monthly"),
    { url: abs("/node"), lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: abs("/vesafloatingspeakerpresentation"), lastModified, changeFrequency: "monthly", priority: 0.5 },
  ];
}
