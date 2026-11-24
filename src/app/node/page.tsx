import type { Metadata, Viewport } from "next";

import { JsonLd } from "@/components/JsonLd";
import { NODE_SIM_URL as SIM_URL, breadcrumbJsonLd, nodeJsonLd, personJsonLd } from "@/lib/seo";

const title = "NODE 휴머노이드 로봇 웹 시뮬레이터 — 디자인코리아 2026";
const description = "디자인코리아 2026 전시작 NODE 휴머노이드 로봇 웹 시뮬레이터 — AI Builder·Designer 이석윤(Seokyun Lee, SGYUN). NODE humanoid robot web simulator, Design Korea 2026.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/node", languages: { ko: "/node", "x-default": "/node" } },
  openGraph: {
    title: `${title} | SGYUN`,
    description,
    url: "/node",
    type: "website",
    siteName: "SGYUN",
    locale: "ko_KR",
    images: [{ url: "/node/og.jpg", width: 1200, height: 630, alt: "NODE humanoid robot" }],
  },
  twitter: { card: "summary_large_image", title: `${title} | SGYUN`, description, images: ["/node/og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#000000", viewportFit: "cover" };

export default function NodeSimulatorPage() {
  return (
    <main style={{ position: "fixed", inset: 0, background: "#000" }}>
      <JsonLd data={[nodeJsonLd(), personJsonLd("ko"), breadcrumbJsonLd([{ name: "SGYUN", path: "/ko" }, { name: "작품", path: "/ko/works" }, { name: "NODE", path: "/node" }])]} />
      {/* Text label for the iframe-only page (same words as the iframe title and meta description). */}
      <h1 className="sr-only">NODE Simulator — 디자인코리아 2026 NODE 휴머노이드 로봇 웹 시뮬레이터</h1>
      <p className="sr-only">{description}</p>
      <iframe
        src={SIM_URL}
        title="NODE Simulator"
        allow="fullscreen; autoplay; xr-spatial-tracking; gyroscope; accelerometer"
        allowFullScreen
        style={{ border: 0, width: "100%", height: "100%", display: "block" }}
      />
    </main>
  );
}
