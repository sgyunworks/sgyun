import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioDetail } from "@/components/portfolio/Portfolio";
import { archiveProjects, getArchiveProject, localizeArchiveProject } from "@/lib/archive";
import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, pageMetadata, toLocale, workDescription, workJsonLd, workTitle } from "@/lib/seo";

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    archiveProjects.map((project) => ({ lang, slug: project.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, lang } = await params;
  const project = getArchiveProject(slug);
  if (!project) return {};
  const locale = toLocale(lang);
  const item = localizeArchiveProject(project, locale);

  return pageMetadata({
    locale,
    rest: `/works/${item.slug}`,
    type: "article",
    title: workTitle(project, locale),
    description: workDescription(project, locale),
    images: item.heroImage ? [{ url: item.heroImage, alt: item.imageAltText }] : undefined,
  });
}

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();

  const project = getArchiveProject(slug);
  if (!project) notFound();
  const locale = lang as Locale;

  return <>
    <JsonLd data={[
      workJsonLd(project, locale),
      breadcrumbJsonLd([
        { name: "SGYUN", path: `/${locale}` },
        { name: locale === "ko" ? "작품" : "Works", path: `/${locale}/works` },
        { name: project.title, path: `/${locale}/works/${project.slug}` },
      ]),
    ]} />
    <PortfolioDetail project={project} locale={locale} />
  </>;
}
