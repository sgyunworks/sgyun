"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect, useState} from "react";
import type {Locale} from "@/lib/i18n";
import styles from "./Portfolio.module.css";
import {DeskCursor} from "./DeskCursor";
import {YPull} from "./YPull";
export function PortfolioShell({locale,children,legacy}:{locale:Locale;children:React.ReactNode;legacy:React.ReactNode}){
 const path=usePathname(),other=locale==='ko'?'en':'ko';
 // Builder cues in the menu bar: role + live NODE status + Seoul time. Local comparison: ?builder=0 hides them.
 const [builder,setBuilder]=useState(true),[clock,setClock]=useState("");
 useEffect(()=>{
  if(new URLSearchParams(location.search).get("builder")==="0")setBuilder(false);
  const f=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Seoul",hour:"2-digit",minute:"2-digit"});
  const tick=()=>setClock(f.format(new Date()));tick();const t=setInterval(tick,20000);return()=>clearInterval(t);
 },[]);
 const normal=path===`/${locale}`||path.startsWith(`/${locale}/works`)||path===`/${locale}/about`||path===`/${locale}/contact`;
 if(path===`/${locale}`)return <div className={styles.site}><main id="main-content">{children}</main></div>;
 if(!normal)return <>{legacy}</>;
 const desk=path===`/${locale}/works`||path===`/${locale}/about`||path===`/${locale}/contact`;
 return <div className={styles.site} data-desk={desk?'':undefined}><a className={styles.skip} href="#main-content">{locale==='ko'?'본문으로 이동':'Skip to content'}</a><nav className={styles.nav} aria-label="Main navigation"><span className={styles.navLeft}><Link className={styles.wordmark} href={`/${locale}`} aria-label="SGYUN"><u>S</u>G<YPull enabled={path===`/${locale}/works`}/>UN</Link>{desk&&builder&&<span className={styles.navRole}>Designer &amp; AI Builder</span>}</span><div>{desk&&builder&&<><Link className={styles.navStatus} href="/node" title={locale==='ko'?'NODE 시뮬레이터 열기':'Open the NODE simulator'}><i/>NODE live</Link><span className={styles.navClock} suppressHydrationWarning>{clock?`Seoul ${clock}`:''}</span></>}<Link href={`/${locale}/works`} aria-current={path.includes('/works')?'page':undefined}>Works</Link><Link href={`/${locale}/about`} aria-current={path.endsWith('/about')?'page':undefined}>Profile</Link><Link href={`/${locale}/contact`} aria-current={path.endsWith('/contact')?'page':undefined}>Contact</Link><Link className={styles.locale} href={path.replace(`/${locale}`,`/${other}`)} aria-label={other==='en'?'English':'한국어'}>{other.toUpperCase()}</Link></div></nav>{desk&&<DeskCursor/>}<main id="main-content">{children}</main><footer className={styles.footer}><span>© 2026 SGYUN</span><span>Industrial · Metalcraft · AI Creative Design</span><Link href={`/${locale}/contact`}>Contact ↗</Link></footer></div>;
}
