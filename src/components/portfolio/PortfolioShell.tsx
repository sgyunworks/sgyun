"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import type {Locale} from "@/lib/i18n";
import styles from "./Portfolio.module.css";
export function PortfolioShell({locale,children,legacy}:{locale:Locale;children:React.ReactNode;legacy:React.ReactNode}){
 const path=usePathname(),other=locale==='ko'?'en':'ko';
 const normal=path===`/${locale}`||path.startsWith(`/${locale}/works`)||path===`/${locale}/about`||path===`/${locale}/contact`;
 if(path===`/${locale}`)return <div className={styles.site}><main id="main-content">{children}</main></div>;
 if(!normal)return <>{legacy}</>;
 return <div className={styles.site}><a className={styles.skip} href="#main-content">{locale==='ko'?'본문으로 이동':'Skip to content'}</a><nav className={styles.nav} aria-label="Main navigation"><Link className={styles.wordmark} href={`/${locale}`}>SGYUN</Link><div><Link href={`/${locale}/works`} aria-current={path.includes('/works')?'page':undefined}>Works</Link><Link href={`/${locale}/about`} aria-current={path.endsWith('/about')?'page':undefined}>Profile</Link><Link href={`/${locale}/contact`} aria-current={path.endsWith('/contact')?'page':undefined}>Contact</Link><Link className={styles.locale} href={path.replace(`/${locale}`,`/${other}`)} aria-label={other==='en'?'English':'한국어'}>{other.toUpperCase()}</Link></div></nav><main id="main-content">{children}</main><footer className={styles.footer}><span>© 2026 SGYUN</span><span>Industrial · Metalcraft · AI Creative Design</span><Link href={`/${locale}/contact`}>Contact ↗</Link></footer></div>;
}
