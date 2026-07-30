"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Locale } from "@/lib/i18n";

type DialStyle = CSSProperties & {
  "--route-angle": string;
};

const routeLabels = {
  ko: ["홈", "작품", "소개", "연락", "어펜딕스", "캘리브레이션"],
  en: ["Home", "Works", "About", "Contact", "Appendix", "Calibration"],
} as const;

export function RouteDial({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const routes = useMemo(
    () => [
      { href: `/${locale}`, code: "ENTRY", label: routeLabels[locale][0] },
      { href: `/${locale}/works`, code: "INDEX", label: routeLabels[locale][1] },
      { href: `/${locale}/about`, code: "PROFILE", label: routeLabels[locale][2] },
      { href: `/${locale}/contact`, code: "CONTACT", label: routeLabels[locale][3] },
      { href: `/${locale}/appendix`, code: "APPENDIX", label: routeLabels[locale][4] },
      {
        href: `/${locale}/calibration`,
        code: "FIELD_00",
        label: routeLabels[locale][5],
        easter: true,
      },
    ],
    [locale]
  );

  const activeIndex = pathname.startsWith(`/${locale}/calibration`)
    ? 5
    : pathname.startsWith(`/${locale}/works`)
      ? 1
      : pathname.startsWith(`/${locale}/about`)
        ? 2
        : pathname.startsWith(`/${locale}/contact`)
          ? 3
          : pathname.startsWith(`/${locale}/appendix`)
            ? 4
            : 0;

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const focusRelativeRoute = (offset: number) => {
    const links = shellRef.current?.querySelectorAll<HTMLAnchorElement>(
      ".route-dial__routes a"
    );
    if (!links?.length) return;
    const focusedIndex = Array.from(links).indexOf(document.activeElement as HTMLAnchorElement);
    const origin = focusedIndex < 0 ? activeIndex : focusedIndex;
    links[(origin + offset + links.length) % links.length]?.focus();
  };

  return (
    <div
      ref={shellRef}
      className="route-dial"
      style={{ "--route-angle": `${activeIndex === 5 ? 332 : activeIndex * 58}deg` } as DialStyle}
    >
      <button
        ref={triggerRef}
        type="button"
        className="site-nav__dial"
        aria-label={locale === "ko" ? "경로 다이얼 열기" : "Open route dial"}
        aria-expanded={open}
        aria-controls="route-dial-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true" />
      </button>

      {open ? (
        <div
          id="route-dial-menu"
          className="route-dial__panel"
          aria-label={locale === "ko" ? "사이트 경로" : "Site routes"}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              focusRelativeRoute(1);
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              focusRelativeRoute(-1);
            }
          }}
        >
          <header>
            <span>ROUTE DIAL</span>
            <b>{activeIndex === 5 ? "00 / 05" : `${String(activeIndex + 1).padStart(2, "0")} / 05`}</b>
          </header>
          <nav className="route-dial__routes">
            {routes.map((route, index) => (
              <Link
                href={route.href}
                key={route.code}
                aria-current={index === activeIndex ? "page" : undefined}
                data-easter={route.easter ? "true" : undefined}
              >
                <small>{route.easter ? "00" : String(index + 1).padStart(2, "0")}</small>
                <span>{route.label}</span>
                <b>{route.code}</b>
              </Link>
            ))}
          </nav>
          <p>{locale === "ko" ? "↑ ↓ 로 선택 · Enter로 이동" : "Select with ↑ ↓ · Enter to open"}</p>
        </div>
      ) : null}
    </div>
  );
}
