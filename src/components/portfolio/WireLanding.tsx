'use client';
import {useRouter} from 'next/navigation';
import {useEffect, useRef, useState, type PointerEvent} from 'react';
import type {Locale} from '@/lib/i18n';
import {portfolioAudio, readPortfolioSound, savePortfolioSound, wireTone} from '@/lib/portfolio-audio';
import styles from './WireLanding.module.css';

type Point = {x:number;y:number};
export function WireLanding({locale}:{locale:Locale}) {
 const router=useRouter(), ko=locale==='ko';
 const letter=useRef<HTMLButtonElement>(null), frame=useRef(0), alive=useRef(true);
 const drag=useRef<{id:number;start:Point;position:Point}|null>(null);
 const [anchor,setAnchor]=useState({x:0,y:0,w:0,h:0,vw:0,vh:0});
 const [position,setPosition]=useState<Point>({x:0,y:0});
 const [phase,setPhase]=useState<'idle'|'dragging'|'rebound'|'travel'>('idle');
 const [travel,setTravel]=useState(0), [sound,setSound]=useState(true);
 const busy=useRef(false), soundRef=useRef(true);
 useEffect(()=>{soundRef.current=sound;},[sound]);
 useEffect(()=>{
  alive.current=true; setSound(readPortfolioSound()); router.prefetch(`/${locale}/works`);
  const measure=()=>{const el=letter.current;if(!el)return;const r=el.getBoundingClientRect();setAnchor({x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,vw:window.innerWidth,vh:window.innerHeight});};
  measure(); void document.fonts.ready.then(()=>{if(alive.current)measure();});
  const onResize=()=>{if(!busy.current&&!drag.current){setPosition({x:0,y:0});requestAnimationFrame(measure);}};
  window.addEventListener('resize',onResize);
  return()=>{alive.current=false;cancelAnimationFrame(frame.current);window.removeEventListener('resize',onResize);};
 },[locale,router]);
 const enter=()=>router.push(`/${locale}/works`);
 const release=(from:Point,continueToWorks:boolean)=>{
  cancelAnimationFrame(frame.current);busy.current=continueToWorks;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setPosition({x:0,y:0});setPhase('idle');if(continueToWorks)enter();return;}
  if(soundRef.current&&continueToWorks)wireTone(Math.min(1.3,.65+Math.hypot(from.x,from.y)/140));
  setPhase('rebound');const start=performance.now();
  const animate=(now:number)=>{
   const elapsed=now-start;
   const seconds=elapsed/1000,decay=Math.exp(-4.6*seconds);
   const spring={x:from.x*decay*Math.cos(22*seconds),y:from.y*decay*Math.cos(26*seconds)};
   if(continueToWorks){
    // Overlap the first recoil with flight: no settled pose or second start.
    const t=Math.min(1,Math.max(0,(elapsed-70)/980)),e=t*t*(3-2*t);
    setPhase(t>0?'travel':'rebound');setTravel(e);
    const mobile=window.innerWidth<=700,dx=window.innerWidth-(mobile?45:65)-anchor.x,dy=window.innerHeight-(mobile?70:100)-anchor.y;
    const arc=Math.sin(Math.PI*e)*Math.min(140,window.innerHeight*.16);
    setPosition({x:spring.x*(1-e)+dx*e,y:spring.y*(1-e)+dy*e-arc});
    if(t===1){if(soundRef.current)wireTone(.3);enter();return;}
   }else if(elapsed<620){setPosition(spring);}
   else{setPosition({x:0,y:0});setPhase('idle');return;}
   frame.current=requestAnimationFrame(animate);
  };frame.current=requestAnimationFrame(animate);
 };
 const down=(e:PointerEvent<HTMLButtonElement>)=>{
  if(busy.current||e.button!==0||!e.isPrimary)return;
  cancelAnimationFrame(frame.current);if(sound)portfolioAudio();
  e.currentTarget.setPointerCapture(e.pointerId);drag.current={id:e.pointerId,start:{x:e.clientX-position.x,y:e.clientY-position.y},position};setPhase('dragging');
 };
 const move=(e:PointerEvent<HTMLButtonElement>)=>{
  const d=drag.current;if(!d||d.id!==e.pointerId)return;
  const limit=Math.min(180,window.innerWidth*.3),elastic=(v:number)=>limit*Math.tanh(v/limit);
  d.position={x:elastic(e.clientX-d.start.x),y:elastic(e.clientY-d.start.y)};setPosition(d.position);
 };
 const up=(e:PointerEvent<HTMLButtonElement>,cancel=false)=>{
  const d=drag.current;if(!d||d.id!==e.pointerId)return;drag.current=null;
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  release(d.position,!cancel&&Math.hypot(d.position.x,d.position.y)>24);
 };
 const rotation=position.x*.1*(1-travel)+travel*300;
 const x=anchor.x+position.x,y=anchor.y+position.y;
 const attach=(dx:number,dy:number)=>{const r=rotation*Math.PI/180;return {x:x+dx*Math.cos(r)-dy*Math.sin(r),y:y+dx*Math.sin(r)+dy*Math.cos(r)};};
 const left=attach(-anchor.w*.36,-anchor.h*.29),right=attach(anchor.w*.36,-anchor.h*.29),bottom=attach(0,anchor.h*.28);
 const bend=(phase==='rebound'||phase==='travel')?position.x*.7*(1-travel):0;
 const paths=[`M${anchor.x-anchor.vh*.24},0 Q${(anchor.x-anchor.vh*.24+left.x)/2+bend},${left.y/2} ${left.x},${left.y}`,`M${anchor.x+anchor.vh*.24},0 Q${(anchor.x+anchor.vh*.24+right.x)/2-bend},${right.y/2} ${right.x},${right.y}`,`M${bottom.x},${bottom.y} Q${bottom.x+bend},${(bottom.y+anchor.vh)/2} ${anchor.x},${anchor.vh}`];
 return <section className={styles.landing} data-phase={phase} aria-label="SGYUN Portfolio 2026">
  <span className={styles.corner}>S̲GYUN</span>
  <svg className={styles.wires} width="100%" height="100%" aria-hidden="true" style={{opacity:1-travel}}><defs><linearGradient id="steel-wire" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={anchor.vw} y2={anchor.vh}><stop stopColor="#a4a7a9"/><stop offset=".46" stopColor="#d1d3d4"/><stop offset=".7" stopColor="#8e9294"/><stop offset="1" stopColor="#b9bdbe"/></linearGradient></defs>{anchor.w>0&&paths.map((d,i)=><path key={i} d={d} stroke="url(#steel-wire)" strokeWidth=".7" fill="none"/>)}</svg>
  <div className={styles.copy}>
   <h1 aria-label="SGYUN"><span style={{opacity:1-travel}} aria-hidden="true"><u>S</u>G</span><button ref={letter} className={styles.letter} onPointerDown={down} onPointerMove={move} onPointerUp={e=>up(e)} onPointerCancel={e=>up(e,true)} onLostPointerCapture={e=>{if(drag.current)up(e,true);}} onClick={e=>{if(e.detail===0&&!busy.current){if(sound)portfolioAudio();release({x:70,y:45},true);}}} aria-label={ko?'Y를 튕겨 작품으로 이동':'Pluck Y to enter Works'} aria-describedby="wire-instruction" aria-disabled={busy.current} style={{transform:`translate(${position.x}px,${position.y}px) rotate(${rotation}deg) scale(${1-travel*.65})`,opacity:1-travel}}>Y</button><span aria-hidden="true" style={{opacity:1-travel}}>UN</span></h1>
   <div className={styles.subtitle} style={{opacity:1-travel}}><p>PORTFOLIO 2026</p><p>Industrial · Metalcraft · AI Creative Design</p></div>
  <div className={styles.guidance} style={{opacity:1-travel}}><p id="wire-instruction">{phase==='dragging'?(ko?'놓으면, 다음으로':'Release to continue'):(ko?'Y를 드래그해 튕겨서 계속':'Drag and release Y to continue')}</p></div>
  </div>
  <svg className={styles.arrivingDial} aria-hidden="true" width="80" height="80" viewBox="0 0 100 100" style={{left:x,top:y,opacity:Math.max(0,(travel-.55)/.45),transform:`translate(-50%,-50%) rotate(${(1-travel)*-160}deg)`}}>{Array.from({length:60},(_,i)=><line key={i} x1="50" y1="8" x2="50" y2={i%5===0?'15':'11'} stroke={i%5===0?'#555':'#b7b7b7'} strokeWidth={i%5===0?1: .6} transform={`rotate(${i*6} 50 50)`}/>)}<text x="50" y="55" textAnchor="middle" fill="#444" fontSize="15">01</text></svg>
  <button className={styles.sound} aria-pressed={sound} aria-label={ko?'사운드':'Sound'} onClick={()=>{savePortfolioSound(!sound);setSound(!sound);if(!sound)portfolioAudio();}}>Sound {sound?'on':'off'}</button>
 </section>;
}
