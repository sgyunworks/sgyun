"use client";

import { useEffect } from "react";

export function MobileAppVisualGuard() {
  useEffect(() => {
    const root = document.documentElement;
    const zones = Array.from(
      document.querySelectorAll<HTMLElement>("[data-mobile-app-visual]")
    );
    const visible = new Set<Element>();

    const sync = () => {
      if (visible.size > 0) root.dataset.mobileAppVisual = "true";
      else delete root.dataset.mobileAppVisual;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.08) {
            visible.add(entry.target);
          } else {
            visible.delete(entry.target);
          }
        });
        sync();
      },
      { threshold: [0, 0.08, 0.3] }
    );

    zones.forEach((zone) => observer.observe(zone));

    return () => {
      observer.disconnect();
      delete root.dataset.mobileAppVisual;
    };
  }, []);

  return null;
}
