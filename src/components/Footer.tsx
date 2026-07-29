import type { Dict } from "@/lib/i18n";

export function Footer({ t }: { t: Dict }) {
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} SGYUN</span>
      <span>{t.footer.tagline}</span>
    </footer>
  );
}
