import { notFound } from "next/navigation";
import { ArchiveProjectDetail } from "@/components/archive/ArchiveProjectDetail";
import {
  archiveProjects,
  getArchiveProject,
  localizeArchiveProject,
} from "@/lib/archive";
import type { Locale } from "@/lib/i18n";
import { locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    archiveProjects.map((project) => ({ lang, slug: project.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { slug, lang } = await params;
  const project = getArchiveProject(slug);
  if (!project) return {};
  const locale = (locales as readonly string[]).includes(lang)
    ? (lang as Locale)
    : "ko";
  const item = localizeArchiveProject(project, locale);

  return {
    title: item.title,
    description: item.descriptionText,
  };
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

  return <ArchiveProjectDetail project={project} locale={lang as Locale} />;
}
