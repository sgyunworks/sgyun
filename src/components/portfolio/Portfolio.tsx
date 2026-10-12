import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { archiveProjects, portfolioProfile, type ArchiveProject } from "@/lib/archive";
import { WireLanding } from "./WireLanding";
import { SourcePages } from "./SourcePages";
import { PortfolioDial } from "./PortfolioDial";
import styles from "./Portfolio.module.css";

export function ProjectCover({ project: p, locale, detail = false }: { project: ArchiveProject; locale: Locale; detail?: boolean }) {
  const ko = locale === "ko";
  const Heading = detail ? "h1" : "h2";
  return <section id={p.id} className={`${styles.cover} ${styles[p.id]}`} aria-label={p.title} data-portfolio-section={p.title}>
    <div className={styles.coverArt}>
      <Image src={p.heroImage} alt={p.imageAlt[locale]} fill quality={95} sizes="100vw" priority={detail} />
    </div>
    {p.id === "vibey" && <div className={styles.vibeyObject}><Image src="/portfolio-a/vibey-display.webp" alt="" fill sizes="15vw" /></div>}
    <span className={styles.chapterLabel}>{p.number} / {p.title}</span>
    <div className={styles.coverCopy}>
      <Heading>{p.title}</Heading>
      <p>{p.description[locale]}</p>
      <span>{p.detailSummary?.[locale]}</span>
      {p.id === "vibey" && <small>{ko ? "졸업연구캡스톤디자인" : "Graduation design capstone"}</small>}
      {p.id === "wrgs" && <small>{ko ? "퍼니처디자인 수업 과제작" : "Furniture design coursework"}</small>}
      {p.id === "cinder" && <small>{ko ? "인공지능디자인" : "AI design coursework"}</small>}
      {!detail && <Link className={styles.projectLink} href={`/${locale}/works/${p.slug}`}>{ko ? "작품 보기" : "View project"}<span aria-hidden="true">↗</span></Link>}
    </div>
    {p.id === "vesa" && <div className={styles.awardMarks}><Image src="/portfolio-a/vesa-awards.webp" alt="VESA design award marks" fill sizes="15vw" /></div>}
  </section>;
}

export function PortfolioHome({ locale, indexOnly = false }: { locale: Locale; indexOnly?: boolean }) {
 if (!indexOnly) return <WireLanding locale={locale}/>;
 return <div className={`${styles.portfolio} ${styles.worksEntry}`}>
   <section className={styles.contents} id="selected">{indexOnly?<h1>Selected Works</h1>:<h2>Selected Works</h2>}<ol>{archiveProjects.map(p=><li key={p.id}><a href={`#${p.id}`}><span>{p.number}</span><strong>{p.title}</strong><span aria-hidden="true">↘</span></a></li>)}</ol></section>
   {archiveProjects.map(p=><ProjectCover key={p.id} project={p} locale={locale}/>)}
   <PortfolioDial locale={locale}/>
 </div>;
}

export function PortfolioDetail({ project: p, locale }: { project: ArchiveProject; locale: Locale }) {
 const film:Record<string,string>={vesa:"7zlyT0hP6_w",aviator:"T-T_7QIveWY",cinder:"m0Xcpsa-vuI"};
 const next = archiveProjects[(archiveProjects.findIndex(x=>x.id===p.id)+1)%archiveProjects.length];
 return <article className={styles.portfolio}>
   <ProjectCover project={p} locale={locale} detail/>
   {locale === "en" && <section className={styles.story} id="overview" data-portfolio-section="Overview"><div><span className={styles.eyebrow}>{p.role.en}</span><h2>{p.detailSummary?.en}</h2></div><p>{p.detailIntro.en}</p></section>}
   <SourcePages projectId={p.id} title={p.title}/>
   {film[p.id] && <section className={styles.projectFilm} id={`${p.id}-film`} data-portfolio-section={`${p.title} in motion`} aria-labelledby={`${p.id}-film-title`}><header><h2 id={`${p.id}-film-title`}>{p.id==='vesa'?'VESA':p.title} in motion</h2><p>{p.title} {locale==='ko'?'소개 영상':'— project film'}</p></header><div className={styles.filmPlayer}><iframe src={`https://www.youtube-nocookie.com/embed/${film[p.id]}`} title={`${p.title} — project film`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div><a href={`https://www.youtube.com/watch?v=${film[p.id]}`} target="_blank" rel="noreferrer">{locale==='ko'?'YouTube에서 보기':'Watch on YouTube'} ↗</a></section>}
   {(p.id === "wishbone" || p.id === "wrgs") && <p className={styles.evidenceNote}>{p.id === "wishbone" ? (locale==="ko" ? "콘셉트 모델 · Rhino SubD → STEP → Fusion 조인트 및 모션 애니메이션. 실물 제작 및 구조 시뮬레이션은 진행하지 않았습니다." : "Concept model · Rhino SubD → STEP → Fusion joints and motion animation. No physical fabrication or structural simulation.") : p.role[locale]}</p>}
   <nav className={styles.nextProject} aria-label="Next project"><span>{locale === "ko" ? "다음 작품" : "Next project"}</span><Link href={`/${locale}/works/${next.slug}`}>{next.title}<span aria-hidden="true">↗</span></Link><Link href={`/${locale}/works`} className={styles.backLink}>{locale === "ko" ? "전체 작품" : "All works"}</Link></nav>
   <PortfolioDial locale={locale}/>
 </article>;
}

export function PortfolioProfile({locale}:{locale:Locale}) {
 const p=portfolioProfile,ko=locale==="ko";
 return <div className={styles.profile}>
  <header><h1>Profile</h1><span>Seokyun Lee</span></header>
  <div className={styles.profileGrid}>
   <aside><Image className={styles.portrait} src="/portfolio-a/portrait.webp" alt="Seokyun Lee" width={478} height={603}/><h2>Seokyun Lee</h2><p>{p.title[locale]}</p><p>Seoul, Republic of Korea</p><a href="mailto:pio1075@naver.com">pio1075@naver.com</a><h3>{ko?"학력":"Education"}</h3>{p.education.map(x=><p key={x.en}>{x[locale]}</p>)}<h3>Skills</h3><p>Metal Welding<br/>Concept Development and Design<br/>3D Modeling & Visualization<br/>Physical Prototyping<br/>AI-assisted Coding & Development</p></aside>
   <div><section><h2>{ko?"경력·강의":"Experience & teaching"}</h2>{p.activities.slice(0,3).map(x=><div className={styles.record} key={x.title.en}><time>{x.year}</time><div><h3>{x.title[locale]}</h3><p>{x.detail[locale]}</p></div></div>)}</section><section><h2>{ko?"리더십·전시 운영":"Leadership & exhibitions"}</h2>{p.activities.slice(3,8).map(x=><div className={styles.record} key={x.title.en}><time>{x.year}</time><div><h3>{x.title[locale]}</h3><p>{x.detail[locale]}</p></div></div>)}</section></div>
   <div><section><h2>{ko?"수상·선정":"Awards & recognition"}</h2>{p.recognitions.map(x=><div className={styles.record} key={x.title.en}><time>{x.year}</time><div><h3>{x.title[locale]}</h3><p>{x.result[locale]}</p><small>{x.note[locale]}</small></div></div>)}</section><section><h2>{ko?"창업 프로그램":"Startup program"}</h2>{p.activities.slice(8).map(x=><div className={styles.record} key={x.title.en}><time>{x.year}</time><div><h3>{x.title[locale]}</h3><p>{x.detail[locale]}</p></div></div>)}</section></div>
  </div>
 </div>;
}

export function PortfolioContact({locale}:{locale:Locale}) {
 return <section className={styles.contact}><span>Contact</span><h1>{locale==="ko" ? "함께할 다음 작업을 기다립니다." : "Looking forward to what comes next."}</h1><a href="mailto:pio1075@naver.com">pio1075@naver.com ↗</a><p>Seokyun Lee · Seoul, Republic of Korea</p><a className={styles.social} href="https://www.instagram.com/sgyunworks/" target="_blank" rel="noreferrer">Instagram @sgyunworks ↗</a></section>;
}
