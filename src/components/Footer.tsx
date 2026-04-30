import type { Dict } from "@/lib/i18n";

export function Footer({ t }: { t: Dict }) {
  return (
    <footer className="border-t border-line px-6 md:px-12 py-6 md:py-8 flex flex-col md:flex-row justify-between gap-2 text-[11px] tracking-[0.15em] text-muted uppercase">
      <span>© {new Date().getFullYear()} SGYUN</span>
      <span>{t.footer.tagline}</span>
    </footer>
  );
}
