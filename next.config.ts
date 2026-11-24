import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // parallel local servers (agents) can use their own build folder: NEXT_DIST_DIR=.next-xyz
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    return ["/ko/node", "/en/node"].map((source) => ({ source, destination: "/node", permanent: false }));
  },
  // No source maps in production, and no framing of this site by other domains.
  productionBrowserSourceMaps: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 88, 90, 95],
  },
  experimental: {
    optimizePackageImports: [],
  },
};

export default nextConfig;
