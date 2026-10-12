"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import type {Locale} from "@/lib/i18n";
import {VaultDial} from "@/components/VaultDial";
import styles from "./Portfolio.module.css";

export function PortfolioDial({locale}:{locale:Locale}) {
 const pathname=usePathname();
 const [items,setItems]=useState<{id:string;number:string;label:string}[]>([]);
 const [active,setActive]=useState(0),[visual,setVisual]=useState(0),[sound,setSound]=useState(false);
 const positions=useRef<number[]>([]);
 useEffect(()=>{
  const sections=Array.from(document.querySelectorAll<HTMLElement>('[data-portfolio-section]'));
  setItems(sections.map((e,i)=>({id:e.id,number:String(i+1).padStart(2,'0'),label:e.dataset.portfolioSection??''})));
  let raf=0;
  const measure=()=>{positions.current=sections.map(e=>e.getBoundingClientRect().top+window.scrollY-80);update();};
  const update=()=>{raf=0;const y=window.scrollY;let idx=0;positions.current.forEach((p,i)=>{if(y>=p-180)idx=i;});setActive(idx);const a=positions.current[idx]??0,b=positions.current[idx+1]??a;setVisual(idx+(b>a?Math.max(0,Math.min(1,(y-a)/(b-a))):0));};
  const onScroll=()=>{if(!raf)raf=requestAnimationFrame(update);};
  const observer=new ResizeObserver(measure);sections.forEach(s=>observer.observe(s));measure();
  window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',measure);
  return()=>{observer.disconnect();cancelAnimationFrame(raf);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',measure);};
 },[pathname]);
 const select=(i:number)=>{const el=document.getElementById(items[i]?.id);el?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});};
 if(!items.length)return null;
 return <div className={styles.dialDock}>
  <VaultDial activeIndex={active} visualIndex={visual} items={items} ariaLabel={locale==='ko'?'작품 다이얼 · 방향키로 이동':'Project dial · use arrow keys'} appearance="editorial" touchMode="scrub" sound={sound} stepDegrees={360/items.length} onSelect={select} onScrub={setVisual} onScrubEnd={i=>select(Math.round(i))}/>
  <button className={styles.soundButton} aria-pressed={sound} aria-label={locale==='ko'?'다이얼 소리':'Dial sound'} onClick={()=>setSound(!sound)}>Sound {sound?'on':'off'}</button>
 </div>;
}
