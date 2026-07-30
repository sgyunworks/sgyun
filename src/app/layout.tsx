import type { Metadata, Viewport } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { siteConfig } from "@/lib/site-config";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Product Designer · Builder`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description.ko,
  openGraph: {
    title: `${siteConfig.name} | Product Designer · Builder`,
    description: siteConfig.description.ko,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Product Designer · Builder`,
    description: siteConfig.description.ko,
  },
};

export const viewport: Viewport = {
  themeColor: "#08090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${poppins.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
