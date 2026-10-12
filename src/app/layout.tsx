import type { Metadata, Viewport } from "next";
import { Geist_Mono, Poppins, Noto_Sans_KR } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { siteConfig } from "@/lib/site-config";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({subsets:["latin"],weight:["300","400","500","700"],variable:"--font-noto-sans-kr",display:"swap"});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Industrial · Metalcraft · AI Creative Design`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description.ko,
  openGraph: {
    title: `${siteConfig.name} | Industrial · Metalcraft · AI Creative Design`,
    description: siteConfig.description.ko,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Industrial · Metalcraft · AI Creative Design`,
    description: siteConfig.description.ko,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${poppins.variable} ${geistMono.variable} ${notoSansKR.variable}`}>
        {children}
      </body>
    </html>
  );
}
