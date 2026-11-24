import type { Metadata, Viewport } from "next";

const SIM_URL = "https://humanoid-sim.vercel.app";
const description = "디자인코리아 2026 전시작 NODE 휴머노이드 로봇 웹 시뮬레이터 — AI Builder·Designer 이석윤";

export const metadata: Metadata = {
  title: "NODE Simulator",
  description,
  alternates: { canonical: "/node" },
  openGraph: {
    title: "NODE Simulator | SGYUN",
    description,
    url: "/node",
    type: "website",
    images: [{ url: "/node/og.jpg", width: 1200, height: 630, alt: "NODE humanoid robot" }],
  },
  twitter: { card: "summary_large_image", title: "NODE Simulator | SGYUN", description, images: ["/node/og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#000000", viewportFit: "cover" };

export default function NodeSimulatorPage() {
  return (
    <main style={{ position: "fixed", inset: 0, background: "#000" }}>
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
