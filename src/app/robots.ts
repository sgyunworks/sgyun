import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Search and AI-answer crawlers are welcome; the owner studio, API and QA pages are not for indexing.
const disallow = ["/studio", "/api/", "/arcade-dev"];
const aiAgents = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "PerplexityBot", "Perplexity-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "Google-Extended", "Googlebot", "Bingbot", "Yeti",
  "Applebot", "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // Named groups replace the * group for that crawler, so each repeats the same rules explicitly.
      { userAgent: aiAgents, allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
