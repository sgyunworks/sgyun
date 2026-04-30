"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale, Dict } from "@/lib/i18n";

export function Nav({ locale, t }: { locale: Locale; t: Dict }) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // 다른 언어로의 경로 생성
  const otherLocale: Locale = locale === "ko" ? "en" : "ko";
  const otherLocalePath = pathname.replace(
    new RegExp(`^/${locale}`),
    `/${otherLocale}`
  );

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-12 py-5 md:py-7 backdrop-blur-md bg-bg/70 transition-colors duration-300 ${
        scrolled ? "border-b border-line" : "border-b border-transparent"
      }`}
    >
      <Link
        href={`/${locale}`}
        className="font-display text-base md:text-lg font-medium tracking-[0.08em]"
      >
        SGYUN
      </Link>

      <ul className="flex gap-5 md:gap-10 items-center list-none">
        <li>
          <Link
            href={`/${locale}/works`}
            className="nav-link text-xs md:text-[13px] tracking-wider hover:opacity-100 transition-opacity"
          >
            {t.nav.works}
          </Link>
        </li>
        <li>
          <Link
            href={`/${locale}/about`}
            className="nav-link text-xs md:text-[13px] tracking-wider hover:opacity-100 transition-opacity"
          >
            {t.nav.about}
          </Link>
        </li>
        <li>
          <Link
            href={`/${locale}/contact`}
            className="nav-link text-xs md:text-[13px] tracking-wider hover:opacity-100 transition-opacity"
          >
            {t.nav.contact}
          </Link>
        </li>
        <li className="flex gap-2 ml-2 md:ml-4 pl-3 md:pl-6 border-l border-line text-xs">
          <span className="px-1.5 py-1 text-fg">
            {locale.toUpperCase()}
          </span>
          <Link
            href={otherLocalePath}
            className="px-1.5 py-1 text-muted hover:text-fg transition-colors tracking-wider"
          >
            {otherLocale.toUpperCase()}
          </Link>
        </li>
      </ul>

      <style jsx>{`
        .nav-link {
          position: relative;
          padding: 4px 0;
        }
        .nav-link::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: #f4f4f4;
          transition: width 0.3s ease;
        }
        .nav-link:hover::after {
          width: 100%;
        }
      `}</style>
    </nav>
  );
}
