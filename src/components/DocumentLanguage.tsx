"use client";

import { useLayoutEffect } from "react";
import type { Locale } from "@/lib/i18n";

export function DocumentLanguage({ locale }: { locale: Locale }) {
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
