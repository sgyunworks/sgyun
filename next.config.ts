import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    const node = "https://humanoid-sim.vercel.app";
    return ["/node", "/ko/node", "/en/node"].map((source) => ({ source, destination: node, permanent: false }));
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: [],
  },
};

export default nextConfig;
