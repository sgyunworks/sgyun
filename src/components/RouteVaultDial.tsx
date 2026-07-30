"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { archiveProjects } from "@/lib/archive";
import type { Locale } from "@/lib/i18n";
import { VaultDial, type VaultDialItem } from "@/components/VaultDial";

type RouteDialItem = VaultDialItem & {
  target: string;
};

function numberItems(items: Array<Omit<RouteDialItem, "number">>): RouteDialItem[] {
  return items.map((item, index) => ({
    ...item,
    number: String(index + 1).padStart(2, "0"),
  }));
}

function getRouteItems(pathname: string, locale: Locale): RouteDialItem[] {
  const root = `/${locale}`;

  if (pathname === `${root}/works`) {
    return numberItems([
      { id: "works-overview", label: "OVERVIEW", target: "works-overview" },
      { id: "works-records", label: "SELECTED", target: "works-records" },
      { id: "works-appendix", label: "APPENDIX", target: "works-appendix" },
    ]);
  }

  if (pathname.startsWith(`${root}/works/`)) {
    const project = archiveProjects.find(
      (item) => pathname === `${root}/works/${item.slug}`
    );
    const detailItems: Array<Omit<RouteDialItem, "number">> = [
      { id: "project-overview", label: "OVERVIEW", target: "project-overview" },
      { id: "project-premise", label: "PREMISE", target: "project-premise" },
      { id: "project-process", label: "PROCESS", target: "project-process" },
      { id: "project-next", label: "NEXT", target: "project-next" },
    ];
    if (project?.evidence) {
      detailItems.splice(3, 0, {
        id: "project-evidence",
        label: "EVIDENCE",
        target: "project-evidence",
      });
    }
    return numberItems(detailItems);
  }

  if (pathname === `${root}/about`) {
    return numberItems([
      { id: "about-profile", label: "PROFILE", target: "about-profile" },
      { id: "about-identity", label: "IDENTITY", target: "about-identity" },
      { id: "about-education", label: "EDUCATION", target: "about-education" },
      { id: "about-practice", label: "PRACTICE", target: "about-practice" },
      { id: "about-records", label: "RECORDS", target: "about-records" },
      { id: "about-contact", label: "CONTACT", target: "about-contact" },
    ]);
  }

  if (pathname === `${root}/contact`) {
    return numberItems([
      { id: "contact-intro", label: "CONTACT", target: "contact-intro" },
      { id: "contact-channels", label: "CHANNELS", target: "contact-channels" },
    ]);
  }

  if (pathname === `${root}/appendix`) {
    return numberItems([
      { id: "appendix-overview", label: "RESERVED", target: "appendix-overview" },
      { id: "appendix-state", label: "STATUS", target: "appendix-state" },
    ]);
  }

  return [];
}

export function RouteVaultDial({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const items = useMemo(() => getRouteItems(pathname, locale), [locale, pathname]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visualIndex, setVisualIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const visualIndexRef = useRef(0);
  const anchorsRef = useRef<number[]>([]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setVisualIndex(0);
    activeIndexRef.current = 0;
    visualIndexRef.current = 0;
    anchorsRef.current = [];
    if (!items.length) return;

    const targets = items
      .map((item, index) => {
        const element = document.getElementById(item.target);
        return element ? { element, index } : null;
      })
      .filter((target): target is { element: HTMLElement; index: number } => Boolean(target));

    const measureAnchors = () => {
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      let previous = 0;
      anchorsRef.current = targets.map(({ element }, index) => {
        const raw = element.getBoundingClientRect().top + window.scrollY - 88;
        const clamped = Math.min(maxScroll, Math.max(0, raw));
        const anchor = index === 0 ? clamped : Math.max(previous, clamped);
        previous = anchor;
        return anchor;
      });
    };

    const cursorAtScroll = (scrollY: number) => {
      const anchors = anchorsRef.current;
      if (anchors.length < 2 || scrollY <= anchors[0]) return 0;
      const lastIndex = anchors.length - 1;
      if (scrollY >= anchors[lastIndex]) return lastIndex;

      for (let index = 0; index < lastIndex; index += 1) {
        const start = anchors[index];
        const end = anchors[index + 1];
        if (scrollY > end) continue;
        const span = Math.max(1, end - start);
        return index + Math.min(1, Math.max(0, (scrollY - start) / span));
      }
      return lastIndex;
    };

    const syncFromScroll = () => {
      frameRef.current = null;
      const cursor = cursorAtScroll(window.scrollY);
      visualIndexRef.current = cursor;
      setVisualIndex((current) =>
        Math.abs(current - cursor) < 0.001 ? current : cursor
      );
      const rounded = Math.round(cursor);
      if (activeIndexRef.current !== rounded) {
        activeIndexRef.current = rounded;
        setActiveIndex(rounded);
      }
    };

    const scheduleSync = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(syncFromScroll);
    };

    const handleResize = () => {
      measureAnchors();
      scheduleSync();
    };

    measureAnchors();
    scheduleSync();
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(handleResize);
    targets.forEach(({ element }) => resizeObserver.observe(element));

    return () => {
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [items]);

  const scrollToCursor = useCallback(
    (cursor: number, behavior: ScrollBehavior) => {
      const anchors = anchorsRef.current;
      if (!anchors.length) return;
      const clamped = Math.min(items.length - 1, Math.max(0, cursor));
      const lower = Math.floor(clamped);
      const upper = Math.min(items.length - 1, Math.ceil(clamped));
      const mix = clamped - lower;
      const targetTop =
        (anchors[lower] ?? 0) +
        ((anchors[upper] ?? anchors[lower] ?? 0) - (anchors[lower] ?? 0)) * mix;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior,
      });
    },
    [items]
  );

  const select = useCallback(
    (index: number) => {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";
      scrollToCursor(Math.round(index), behavior);
    },
    [scrollToCursor]
  );

  if (!items.length) return null;

  return (
    <VaultDial
      activeIndex={activeIndex}
      ariaLabel={
        locale === "ko" ? "현재 페이지 섹션 다이얼" : "Current page section dial"
      }
      getScrubStartIndex={() => visualIndexRef.current}
      items={items}
      onSelect={select}
      onScrub={(index) => {
        visualIndexRef.current = index;
        setVisualIndex(index);
        const rounded = Math.round(index);
        if (activeIndexRef.current !== rounded) {
          activeIndexRef.current = rounded;
          setActiveIndex(rounded);
        }
        scrollToCursor(index, "auto");
      }}
      onScrubEnd={(index) => select(Math.round(index))}
      visualIndex={visualIndex}
      variant="page"
    />
  );
}
