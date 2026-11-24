// Plain-text site summaries for AI answer engines (llmstxt.org format), built from portfolio.json so they never drift.
import { portfolioProfile as p, portfolioUpdatedAt, localizeArchiveProject } from "./archive";
import { siteConfig } from "./site-config";
import { abs, publishedWorks } from "./seo";

const yearEn = (y: string) => y.replace("현재", "present").replace(" · 2학기", " (fall semester)");
const node = p.exhibitions.find((e) => e.href === "/node");

const header = () => [
  `# ${p.name.en} (${p.name.ko}) — SGYUN`,
  "",
  `> ${p.name.en} (${p.name.ko}, alias SGYUN) is a builder and industrial designer ("Builder • Industrial Designer") based in Seoul, Republic of Korea, who designs physical products and builds working AI-assisted software. ${p.summary.ko}`,
  "",
  `- Website: ${siteConfig.url} (Korean: ${abs("/ko")}, English: ${abs("/en")})`,
  `- Email: ${siteConfig.email}`,
  `- Instagram: ${siteConfig.instagram.url} (${siteConfig.instagram.handle})`,
  `- Education: ${p.education.map((e) => `${e.en} (${e.ko})`).join("; ")}`,
  `- Last updated: ${portfolioUpdatedAt}`,
];

export function llmsTxt() {
  const lines = [
    ...header(),
    "",
    "## Key facts",
    "",
    ...p.activities.slice(0, 1).map((a) => `- ${yearEn(a.year)}: ${a.detail.en}, ${a.title.en} (${a.title.ko})`),
    ...p.recognitions.slice(0, 1).map((r) => `- ${r.year}: ${r.title.en} — ${r.result.en} for ${r.note.en} (${r.title.ko} ${r.result.ko})`),
    ...(node ? [`- ${node.year}: ${node.title.en} — ${node.detail.en}`] : []),
    "",
    "## Works",
    "",
    ...publishedWorks.map((w) => `- [${w.title}](${abs(`/en/works/${w.slug}`)}): ${(w.detailSummary?.en ?? w.description.en).replace(/\.$/, "")}. Korean: ${abs(`/ko/works/${w.slug}`)}`),
    `- [NODE humanoid robot simulator](${abs("/node")}): Web simulator of the NODE humanoid robot shown at Design Korea 2026 (credit: AI Builder & Designer).`,
    "",
    "## Pages",
    "",
    `- [Profile](${abs("/en/about")}): education, experience, awards, exhibitions (Korean: ${abs("/ko/about")})`,
    `- [Contact](${abs("/en/contact")}): email and Instagram`,
    `- [Selected works](${abs("/en/works")})`,
    "",
    "## Optional",
    "",
    `- [Full profile and work descriptions in Korean and English](${abs("/llms-full.txt")})`,
    "",
  ];
  return lines.join("\n");
}

export function llmsFullTxt() {
  const lines = [
    ...header(),
    "",
    "## Profile",
    "",
    `- Name: ${p.name.en} / ${p.name.ko} / SGYUN`,
    `- Role: ${p.title.en}`,
    `- Location: Seoul, Republic of Korea`,
    `- Skills: Metal welding (TIG), concept development and design, 3D modeling and visualization (Rhino, Fusion 360, Blender, KeyShot), physical prototyping, Arduino, AI-assisted coding and development`,
    `- Summary (EN): ${p.summary.en}`,
    `- Summary (KO): ${p.summary.ko}`,
    "",
    "## Experience and teaching",
    "",
    ...p.activities.map((a) => `- ${yearEn(a.year)} — ${a.title.en}: ${a.detail.en} / ${a.title.ko}: ${a.detail.ko}`),
    "",
    "## Awards and recognition",
    "",
    ...p.recognitions.map((r) => `- ${r.year} — ${r.title.en}: ${r.result.en} (${r.note.en}) / ${r.title.ko}: ${r.result.ko}`),
    "",
    "## Exhibitions",
    "",
    ...p.exhibitions.map((e) => `- ${e.year} — ${e.title.en}: ${e.detail.en} / ${e.title.ko}: ${e.detail.ko}${e.href ? ` (${abs(e.href)})` : ""}`),
    "",
    "## Works",
    "",
  ];
  for (const w of publishedWorks) {
    const en = localizeArchiveProject(w, "en"), ko = localizeArchiveProject(w, "ko");
    lines.push(
      `### ${w.title}${w.year ? ` (${w.year})` : ""}`,
      "",
      `- URL: ${abs(`/en/works/${w.slug}`)} (Korean: ${abs(`/ko/works/${w.slug}`)})`,
      `- Category: ${en.categoryText} · Status: ${en.statusText}`,
      `- Role: ${en.roleText} / ${ko.roleText}`,
      "",
      `EN — ${w.description.en} ${en.detailSummaryText} ${w.detailIntro.en}`,
      ...en.chapterTexts.map((c) => `- ${c.title}: ${c.body}`),
      "",
      `KO — ${w.description.ko}. ${ko.detailSummaryText}. ${w.detailIntro.ko}`,
      ...ko.chapterTexts.map((c) => `- ${c.title}: ${c.body}`),
      "",
    );
  }
  lines.push(
    "### NODE (2026)",
    "",
    `- URL: ${abs("/node")}`,
    `- ${node ? `${node.title.en}: ${node.detail.en} / ${node.title.ko}: ${node.detail.ko}` : "Design Korea 2026 humanoid robot"}`,
    "- Built with Blender, Three.js and Claude Code; the page embeds an interactive web simulator of the robot.",
    "",
  );
  return lines.join("\n");
}
