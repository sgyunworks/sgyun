import type { Metadata } from "next";
import Presentation from "./Presentation";

export const metadata: Metadata = {
  title: { absolute: "VESA Floating Speaker" },
  description: "소리는 띄우고, 책상은 비우다. VESA Floating Speaker의 제품 디자인과 제작 과정.",
  alternates: { canonical: "/vesafloatingspeakerpresentation" },
  openGraph: { title: "VESA Floating Speaker", description: "제품 디자인, 사용 방식과 시제품 영상", url: "/vesafloatingspeakerpresentation" },
  twitter: { title: "VESA Floating Speaker", description: "제품 디자인, 사용 방식과 시제품 영상" },
};

export default function Page() { return <Presentation />; }
