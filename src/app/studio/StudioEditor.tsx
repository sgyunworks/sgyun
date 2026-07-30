"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ArchiveCategory,
  ArchiveProjectSource,
  PortfolioSource,
  ProjectStage,
  PublishStatus,
} from "@/lib/archive";
import styles from "./studio.module.css";

type SaveResponse = {
  mode?: "local" | "github";
  message?: string;
  commitUrl?: string;
  error?: string;
};

const categories: Array<{ value: ArchiveCategory; label: string }> = [
  { value: "physical", label: "Physical" },
  { value: "digital", label: "Digital" },
  { value: "systems", label: "Systems" },
];

const stages: Array<{ value: ProjectStage; label: string }> = [
  { value: "completed", label: "완료" },
  { value: "active", label: "진행 중" },
  { value: "concept", label: "콘셉트" },
];

function emptyProject(order: number): ArchiveProjectSource {
  const id = `draft-${Date.now()}`;
  return {
    id,
    slug: "new-project",
    order,
    status: "draft",
    stage: "active",
    title: "NEW PROJECT",
    year: String(new Date().getFullYear()),
    category: "physical",
    description: { ko: "", en: "" },
    role: { ko: "", en: "" },
    heroImage: "",
    heroAspectRatio: 1.5,
    imageAlt: { ko: "프로젝트 이미지 준비 중", en: "Project media pending" },
    imageFit: "contain",
    imageTone: "dark",
    detailIntro: { ko: "", en: "" },
    detailChapters: [
      { code: "01", title: { ko: "", en: "" }, body: { ko: "", en: "" } },
      { code: "02", title: { ko: "", en: "" }, body: { ko: "", en: "" } },
      { code: "03", title: { ko: "", en: "" }, body: { ko: "", en: "" } },
    ],
    detailMedia: [],
  };
}

export function StudioEditor({ initialSource }: { initialSource: PortfolioSource }) {
  const router = useRouter();
  const [source, setSource] = useState(initialSource);
  const [selectedId, setSelectedId] = useState(initialSource.projects[0]?.id ?? "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("게시 원본과 연결되었습니다.");
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");

  const selected = useMemo(
    () => source.projects.find((project) => project.id === selectedId),
    [selectedId, source.projects]
  );
  const publishedCount = source.projects.filter((project) => project.status === "published").length;

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const changeProject = (patch: Partial<ArchiveProjectSource>) => {
    if (!selected) return;
    setSource((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === selected.id ? { ...project, ...patch } : project
      ),
    }));
    setDirty(true);
  };

  const changeLocalized = (
    field: "description" | "role" | "imageAlt" | "detailIntro",
    locale: "ko" | "en",
    value: string
  ) => {
    if (!selected) return;
    changeProject({ [field]: { ...selected[field], [locale]: value } });
  };

  const changeChapter = (
    chapterIndex: number,
    field: "title" | "body",
    locale: "ko" | "en",
    value: string
  ) => {
    if (!selected) return;
    changeProject({
      detailChapters: selected.detailChapters.map((chapter, index) =>
        index === chapterIndex
          ? { ...chapter, [field]: { ...chapter[field], [locale]: value } }
          : chapter
      ),
    });
  };

  const addProject = () => {
    const project = emptyProject(source.projects.length + 1);
    setSource((current) => ({ ...current, projects: [...current.projects, project] }));
    setSelectedId(project.id);
    setDirty(true);
    setMessage("새 프로젝트를 초안으로 만들었습니다. 내용을 입력한 뒤 저장하세요.");
    setMessageTone("neutral");
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setMessage("게시 원본을 검증하고 저장하고 있습니다.");
    setMessageTone("neutral");
    const response = await fetch("/api/studio/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(source),
    });
    const result = (await response.json()) as SaveResponse;
    setSaving(false);
    if (!response.ok) {
      setMessage(result.error ?? "저장하지 못했습니다.");
      setMessageTone("error");
      return;
    }
    setDirty(false);
    setMessage(result.message ?? "저장했습니다.");
    setMessageTone("success");
    router.refresh();
  };

  const signOut = async () => {
    if (dirty && !window.confirm("저장하지 않은 변경이 있습니다. 로그아웃할까요?")) return;
    await fetch("/api/studio/session", { method: "DELETE" });
    router.push("/studio/login");
    router.refresh();
  };

  if (!selected) return null;

  return (
    <main className={styles.studioPage}>
      <header className={styles.studioHeader}>
        <div className={styles.studioBrand}>
          <span>SGYUN</span>
          <small>OWNER STUDIO / CONTENT SOURCE</small>
        </div>
        <div className={styles.studioStatus}>
          <span><b>{String(publishedCount).padStart(2, "0")}</b> PUBLISHED</span>
          <span><b>{String(source.projects.length - publishedCount).padStart(2, "0")}</b> DRAFT</span>
        </div>
        <button className={styles.quietButton} type="button" onClick={signOut}>로그아웃</button>
      </header>

      <div className={styles.studioLayout}>
        <aside className={styles.projectRail}>
          <div className={styles.railHeading}>
            <div><span>PROJECTS</span><small>다이얼 순서</small></div>
            <button type="button" onClick={addProject}>새 글</button>
          </div>
          <div className={styles.projectList}>
            {[...source.projects].sort((a, b) => a.order - b.order).map((project) => (
              <button
                type="button"
                key={project.id}
                className={project.id === selected.id ? styles.activeProject : undefined}
                onClick={() => setSelectedId(project.id)}
              >
                <span>{String(project.order).padStart(2, "0")}</span>
                <strong>{project.title}</strong>
                <small data-status={project.status}>{project.status === "published" ? "게시" : "초안"}</small>
              </button>
            ))}
          </div>
          <p>게시 상태의 프로젝트만 공개 인덱스와 메인 다이얼에 순서대로 나타납니다.</p>
        </aside>

        <form className={styles.editorForm} onSubmit={(event) => { event.preventDefault(); void save(); }}>
          <div className={styles.editorHeading}>
            <div>
              <span>EDITING / {String(selected.order).padStart(2, "0")}</span>
              <h1>{selected.title}</h1>
            </div>
            <div className={styles.saveCluster}>
              <p className={styles.saveMessage} data-tone={messageTone} aria-live="polite">{message}</p>
              <button className={styles.primaryButton} type="submit" disabled={saving || !dirty}>
                <span>{saving ? "저장 중" : dirty ? "변경 저장" : "저장됨"}</span><i aria-hidden="true" />
              </button>
            </div>
          </div>

          <section className={styles.formSection}>
            <header><span>01</span><div><h2>게시 설정</h2><p>공개 여부와 다이얼의 위치를 정합니다.</p></div></header>
            <div className={styles.formBody}>
              <fieldset className={styles.segmentField}>
                <legend>게시 상태</legend>
                <span className={styles.helper}>초안은 Studio에만 남고 공개 사이트에는 나타나지 않습니다.</span>
                <div>
                  {(["draft", "published"] as PublishStatus[]).map((status) => (
                    <label key={status}><input type="radio" name="status" checked={selected.status === status} onChange={() => changeProject({ status })} /><span>{status === "draft" ? "초안" : "게시"}</span></label>
                  ))}
                </div>
              </fieldset>
              <div className={styles.field}><label htmlFor="project-order">다이얼 순서</label><span className={styles.helper}>숫자가 작을수록 먼저 나타납니다.</span><input id="project-order" type="number" min="1" value={selected.order} onChange={(event) => changeProject({ order: Number(event.target.value) })} /></div>
              <div className={styles.field}><label htmlFor="project-stage">프로젝트 단계</label><select id="project-stage" value={selected.stage} onChange={(event) => changeProject({ stage: event.target.value as ProjectStage })}>{stages.map((stage) => <option value={stage.value} key={stage.value}>{stage.label}</option>)}</select></div>
              <div className={styles.field}><label htmlFor="project-category">분류</label><select id="project-category" value={selected.category} onChange={(event) => changeProject({ category: event.target.value as ArchiveCategory })}>{categories.map((category) => <option value={category.value} key={category.value}>{category.label}</option>)}</select></div>
            </div>
          </section>

          <section className={styles.formSection}>
            <header><span>02</span><div><h2>기본 정보</h2><p>인덱스와 다이얼에 먼저 보이는 정보입니다.</p></div></header>
            <div className={styles.formBody}>
              <div className={styles.field}><label htmlFor="project-title">표시 제목</label><input id="project-title" value={selected.title} onChange={(event) => changeProject({ title: event.target.value })} /></div>
              <div className={styles.field}><label htmlFor="project-slug">주소 slug</label><span className={styles.helper}>영문 소문자, 숫자와 하이픈만 사용합니다.</span><input id="project-slug" value={selected.slug} onChange={(event) => changeProject({ slug: event.target.value })} /></div>
              <div className={styles.field}><label htmlFor="project-year">연도</label><input id="project-year" inputMode="numeric" value={selected.year} onChange={(event) => changeProject({ year: event.target.value })} /></div>
              <LocalizedField id="description" label="한 줄 설명" value={selected.description} multiline onChange={(locale, value) => changeLocalized("description", locale, value)} />
              <LocalizedField id="role" label="역할" value={selected.role} onChange={(locale, value) => changeLocalized("role", locale, value)} />
            </div>
          </section>

          <section className={styles.formSection}>
            <header><span>03</span><div><h2>미디어</h2><p>이미지는 나중에 경로만 연결해도 됩니다.</p></div></header>
            <div className={styles.formBody}>
              <div className={styles.field}><label htmlFor="hero-image">대표 이미지 경로</label><span className={styles.helper}>비워두면 MEDIA PENDING 상태가 표시됩니다. 예: /images/project/hero.jpg</span><input id="hero-image" value={selected.heroImage} onChange={(event) => changeProject({ heroImage: event.target.value })} /></div>
              <div className={styles.field}><label htmlFor="hero-ratio">원본 가로÷세로 비율</label><input id="hero-ratio" type="number" min="0.1" step="0.001" value={selected.heroAspectRatio} onChange={(event) => changeProject({ heroAspectRatio: Number(event.target.value) })} /></div>
              <LocalizedField id="image-alt" label="이미지 설명" value={selected.imageAlt} onChange={(locale, value) => changeLocalized("imageAlt", locale, value)} />
            </div>
          </section>

          <section className={styles.formSection}>
            <header><span>04</span><div><h2>상세 이야기</h2><p>문제, 설계 판단, 결과가 구분되도록 작성합니다.</p></div></header>
            <div className={styles.formBody}>
              <LocalizedField id="detail-intro" label="프로젝트 소개" value={selected.detailIntro} multiline onChange={(locale, value) => changeLocalized("detailIntro", locale, value)} />
              {selected.detailChapters.map((chapter, index) => (
                <div className={styles.chapterEditor} key={`${selected.id}-${chapter.code}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <LocalizedField id={`chapter-${index}-title`} label="장면 제목" value={chapter.title} onChange={(locale, value) => changeChapter(index, "title", locale, value)} />
                  <LocalizedField id={`chapter-${index}-body`} label="장면 설명" value={chapter.body} multiline onChange={(locale, value) => changeChapter(index, "body", locale, value)} />
                </div>
              ))}
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}

function LocalizedField({ id, label, value, multiline = false, onChange }: { id: string; label: string; value: { ko: string; en: string }; multiline?: boolean; onChange: (locale: "ko" | "en", value: string) => void }) {
  return (
    <div className={styles.localizedField}>
      <span className={styles.localizedLabel}>{label}</span>
      {(["ko", "en"] as const).map((locale) => (
        <div className={styles.field} key={locale}>
          <label htmlFor={`${id}-${locale}`}>{locale === "ko" ? "한국어" : "English"}</label>
          {multiline ? <textarea id={`${id}-${locale}`} rows={4} value={value[locale]} onChange={(event) => onChange(locale, event.target.value)} /> : <input id={`${id}-${locale}`} value={value[locale]} onChange={(event) => onChange(locale, event.target.value)} />}
        </div>
      ))}
    </div>
  );
}
