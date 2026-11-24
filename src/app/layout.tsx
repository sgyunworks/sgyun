import type { Metadata, Viewport } from "next";
import { Geist_Mono, Poppins, Noto_Sans_KR } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { siteConfig } from "@/lib/site-config";
import { SiteGuard } from "@/components/SiteGuard";
import { OG_DEFAULT } from "@/lib/seo";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({subsets:["latin"],weight:["300","400","500","700"],variable:"--font-noto-sans-kr",display:"swap",preload:false});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Search-console ownership tags: set these env vars in Vercel (Production) and redeploy; unset ones render nothing.
const verificationOther: Record<string, string> = {};
if (process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION) verificationOther["naver-site-verification"] = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION;
if (process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION) verificationOther["msvalidate.01"] = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.fullName.ko} SGYUN | Builder • Industrial Designer`,
    template: `%s | ${siteConfig.fullName.ko} SGYUN`,
  },
  description: siteConfig.description.ko,
  applicationName: "SGYUN",
  authors: [{ name: `${siteConfig.fullName.ko} (${siteConfig.fullName.en})`, url: siteConfig.url }],
  creator: siteConfig.fullName.en,
  publisher: siteConfig.fullName.en,
  formatDetection: { email: false, telephone: false, address: false },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: verificationOther,
  },
  openGraph: {
    title: `${siteConfig.fullName.ko} SGYUN | Builder • Industrial Designer`,
    description: siteConfig.description.ko,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "ko_KR",
    type: "website",
    images: [OG_DEFAULT],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.fullName.ko} SGYUN | Builder • Industrial Designer`,
    description: siteConfig.description.ko,
    images: [OG_DEFAULT.url],
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
        <SiteGuard/>
        {children}
      </body>
    </html>
  );
}
