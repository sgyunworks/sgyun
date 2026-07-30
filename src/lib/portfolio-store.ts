import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ArchiveProjectSource, PortfolioSource } from "./archive";

const CONTENT_PATH = "src/content/portfolio.json";
const localContentPath = path.join(process.cwd(), CONTENT_PATH);

type GithubFile = {
  content: string;
  encoding: "base64";
  sha: string;
};

export type SaveResult = {
  mode: "local" | "github";
  message: string;
  commitUrl?: string;
};

function githubConfig() {
  const token = process.env.SGYUN_GITHUB_TOKEN ?? "";
  const owner = process.env.SGYUN_GITHUB_OWNER ?? "sgyunworks";
  const repo = process.env.SGYUN_GITHUB_REPO ?? "sgyun";
  const branch = process.env.SGYUN_GITHUB_BRANCH ?? "main";
  return { token, owner, repo, branch };
}

function githubContentUrl() {
  const { owner, repo } = githubConfig();
  const encodedPath = CONTENT_PATH.split("/").map(encodeURIComponent).join("/");
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
}

async function githubRequest(url: string, init?: RequestInit) {
  const { token } = githubConfig();
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub content sync failed (${response.status}): ${body.slice(0, 300)}`);
  }
  return response;
}

function normalizeProject(project: ArchiveProjectSource, index: number) {
  const slug = project.slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`${index + 1}번째 프로젝트의 slug는 영문 소문자, 숫자와 하이픈만 사용할 수 있습니다.`);
  }
  if (!project.title.trim()) {
    throw new Error(`${index + 1}번째 프로젝트의 제목을 입력하세요.`);
  }
  if (!project.description.ko.trim() || !project.description.en.trim()) {
    throw new Error(`${project.title}의 한국어·영어 설명을 모두 입력하세요.`);
  }
  if (!Number.isFinite(project.order) || project.order < 1) {
    throw new Error(`${project.title}의 다이얼 순서는 1 이상이어야 합니다.`);
  }
  return {
    ...project,
    id: project.id.trim() || slug,
    slug,
    title: project.title.trim(),
    heroAspectRatio:
      Number.isFinite(project.heroAspectRatio) && project.heroAspectRatio > 0
        ? project.heroAspectRatio
        : 1.5,
    detailChapters: project.detailChapters.map((chapter, chapterIndex) => ({
      ...chapter,
      code: String(chapterIndex + 1).padStart(2, "0"),
    })),
  };
}

export function validatePortfolioSource(input: PortfolioSource): PortfolioSource {
  if (!input || !Array.isArray(input.projects) || !input.profile) {
    throw new Error("포트폴리오 데이터 형식이 올바르지 않습니다.");
  }
  const projects = input.projects.map(normalizeProject);
  const slugs = projects.map((project) => project.slug);
  if (new Set(slugs).size !== slugs.length) {
    throw new Error("프로젝트 slug가 중복되었습니다.");
  }
  return {
    ...input,
    version: 1,
    updatedAt: new Date().toISOString().slice(0, 10),
    projects: projects.sort((a, b) => a.order - b.order),
  };
}

async function readLocalPortfolio() {
  const raw = await readFile(localContentPath, "utf8");
  return JSON.parse(raw) as PortfolioSource;
}

async function readGithubPortfolio() {
  const { branch } = githubConfig();
  const response = await githubRequest(
    `${githubContentUrl()}?ref=${encodeURIComponent(branch)}`
  );
  const file = (await response.json()) as GithubFile;
  const raw = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString(
    "utf8"
  );
  return { data: JSON.parse(raw) as PortfolioSource, sha: file.sha };
}

export async function readPortfolioForStudio() {
  const { token } = githubConfig();
  if (token) return (await readGithubPortfolio()).data;
  return readLocalPortfolio();
}

export async function savePortfolioForStudio(input: PortfolioSource): Promise<SaveResult> {
  const data = validatePortfolioSource(input);
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  const { token, owner, repo, branch } = githubConfig();

  if (token) {
    const current = await readGithubPortfolio();
    const response = await githubRequest(githubContentUrl(), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `content: update portfolio from SGYUN Studio`,
        content: Buffer.from(serialized, "utf8").toString("base64"),
        sha: current.sha,
        branch,
      }),
    });
    const payload = (await response.json()) as {
      commit?: { html_url?: string };
    };
    return {
      mode: "github",
      message: "GitHub에 게시 원본을 저장했습니다. 연결된 배포가 완료되면 사이트와 다이얼이 갱신됩니다.",
      commitUrl: payload.commit?.html_url,
    };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "운영 환경의 GitHub 동기화가 설정되지 않았습니다. SGYUN_GITHUB_TOKEN을 서버 환경변수로 연결하세요."
    );
  }

  await writeFile(localContentPath, serialized, "utf8");
  return {
    mode: "local",
    message: "로컬 콘텐츠 원본에 저장했습니다. 개발 화면을 새로고침하면 다이얼이 갱신됩니다.",
  };
}
