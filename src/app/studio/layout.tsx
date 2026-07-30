import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner Studio | SGYUN",
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
