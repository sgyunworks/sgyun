import type { Metadata } from "next";
import Presentation from "./Presentation";

export const metadata: Metadata = {
  title: { absolute: "VESA Floating Speaker" },
  description: "소리는 띄우고, 책상은 비우다. VESA Floating Speaker의 제품 디자인과 제작 과정.",
  alternates: { canonical: "/vesafloatingspeakerpresentation" },
  openGraph: { type: "website", siteName: "SGYUN", locale: "ko_KR", title: "VESA Floating Speaker", description: "제품 디자인, 사용 방식과 시제품 영상", url: "/vesafloatingspeakerpresentation", images: [{ url: "/portfolio-a/vesa-cover.webp", alt: "VESA Based Floating Speaker" }] },
  twitter: { card: "summary_large_image", title: "VESA Floating Speaker", description: "제품 디자인, 사용 방식과 시제품 영상", images: ["/portfolio-a/vesa-cover.webp"] },
};

export default function Page() { return <Presentation />; }
