"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale, Dict } from "@/lib/i18n";
import { RouteDial } from "@/components/RouteDial";

export function Nav({ locale, t }: { locale: Locale; t: Dict }) {
  const pathname = usePathname();
  const worksActive = pathname.startsWith(`/${locale}/works`);
  const aboutActive = pathname.startsWith(`/${locale}/about`);
  const contactActive = pathname.startsWith(`/${locale}/contact`);
  // 다른 언어로의 경로 생성
  const otherLocale: Locale = locale === "ko" ? "en" : "ko";
  const otherLocalePath = pathname.replace(
    new RegExp(`^/${locale}`),
    `/${otherLocale}`
  );

  return (
    <nav
      className="site-nav fixed top-0 left-0 right-0 z-50 grid items-center px-5 md:px-12"
    >
      <div className="site-nav__identity">
        <RouteDial locale={locale} />
        <Link href={`/${locale}`} className="site-nav__mark">
          <Image
            src="/brand/sgyun-wordmark.png"
            alt="SGYUN"
            width={900}
            height={340}
            className="site-nav__wordmark"
            priority
          />
          <small>DESIGNER / BUILDER</small>
        </Link>
      </div>

      <ul className="site-nav__links flex items-center list-none">
        <li>
          <Link
            href={`/${locale}/works`}
            className="nav-link"
            aria-current={worksActive ? "page" : undefined}
          >
            INDEX
          </Link>
        </li>
        <li>
          <Link
            href={`/${locale}/about`}
            className="nav-link"
            aria-current={aboutActive ? "page" : undefined}
          >
            {t.nav.about}
          </Link>
        </li>
        <li>
          <Link
            href={`/${locale}/contact`}
            className="nav-link"
            aria-current={contactActive ? "page" : undefined}
          >
            {t.nav.contact}
          </Link>
        </li>
        <li className="site-nav__locale flex gap-2">
          <span>
            {locale.toUpperCase()}
          </span>
          <Link
            href={otherLocalePath}
          >
            {otherLocale.toUpperCase()}
          </Link>
        </li>
      </ul>

    </nav>
  );
}
