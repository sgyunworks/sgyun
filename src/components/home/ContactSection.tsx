import type { Dict } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";

export function ContactSection({ t }: { t: Dict }) {
  return (
    <section
      id="contact"
      className="border-t border-line px-6 md:px-12 py-20 md:py-32 scroll-mt-24"
    >
      <div className="max-w-wide mx-auto">
        <span className="block text-[11px] tracking-[0.2em] text-muted uppercase mb-6">
          {t.home.contact.eyebrow}
        </span>
        <h2 className="font-display font-light leading-[0.95] tracking-tighter text-[56px] sm:text-[80px] md:text-[120px] lg:text-[160px] mb-12 md:mb-16">
          {t.home.contact.line1}
          <br />
          {t.home.contact.line2}{" "}
          <a
            href={`mailto:${siteConfig.email}`}
            className="border-b-2 border-transparent hover:border-fg transition-colors"
          >
            {t.home.contact.line3}
          </a>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 pt-10 border-t border-line">
          <ContactBlock label="Email">
            <a
              href={`mailto:${siteConfig.email}`}
              className="hover:opacity-60 transition-opacity break-all"
            >
              {siteConfig.email}
            </a>
          </ContactBlock>
          <ContactBlock label="Instagram">
            <a
              href={siteConfig.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-60 transition-opacity"
            >
              {siteConfig.instagram.handle}
            </a>
          </ContactBlock>
          <ContactBlock label="Name">
            <span>이석윤 / Seokyoon Lee</span>
          </ContactBlock>
          <ContactBlock label="Location">
            <span>Seoul, Korea</span>
          </ContactBlock>
        </div>
      </div>
    </section>
  );
}

function ContactBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block text-[11px] tracking-[0.2em] text-muted uppercase mb-2.5">
        {label}
      </span>
      <span className="block text-sm md:text-[15px] text-fg">{children}</span>
    </div>
  );
}
