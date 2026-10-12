import Image from "next/image";
import type { CSSProperties } from "react";
import pages from "@/content/portfolio-a-pages.json";
import styles from "./Portfolio.module.css";

const videoLinks: Record<string,string>={"36:751":"https://www.instagram.com/p/DUNxuMTEiFl/","54:950":"https://www.instagram.com/reel/DWYtP7Lkudp/","80:616":"https://youtu.be/m0Xcpsa-vuI"};
const ranges: Record<string,[number,number]>={vesa:[5,11],vibey:[13,16],wrgs:[19,22],wishbone:[24,27],aviator:[29,33],cinder:[35,39]};
type SourceNode={id:string;type:string;x:number;y:number;w:number;h:number;text?:string;size?:number;font?:string;weight?:number;align?:string;src?:string;name?:string;color?:{r:number;g:number;b:number};lineHeight?:{unit:string;value?:number}};
export function SourcePages({projectId,title}:{projectId:string;title:string}) {
 const range=ranges[projectId];if(!range)return null;
 return <div className={styles.sourcePages} lang="ko">{pages.filter(p=>Number(p.page)>=range[0]&&Number(p.page)<=range[1]).map(page=>{
 const nodes=page.nodes as SourceNode[];
 const heading=nodes.find(n=>n.type==='text'&&(n.size??0)>=64)?.text?.replaceAll('\n',' ')??`${title} · ${page.page}`;
 const readingOrder=(n:SourceNode)=>{
  if((n.size??0)>=64)return -10000;
  if(page.page==='35'){
    if(n.w>1400)return -9000+n.y;
    return Math.floor(n.x/1250)*10000+n.y;
  }
  return n.y;
 };
 const mobileOrder=[...nodes].sort((a,b)=>readingOrder(a)-readingOrder(b)||a.x-b.x);
 return <section key={page.id} id={`source-${page.page}`} className={`${styles.sourcePage} ${projectId==="cinder"?styles.darkSource:""} ${Number(page.page)===36?styles.configuratorPage:''}`} data-portfolio-section={heading} aria-label={heading} style={{backgroundColor:`rgb(${page.background.r*255} ${page.background.g*255} ${page.background.b*255})`,color:page.background.r<.5?"#f8f8f8":"#202020"}}>
   {page.page==='36' && <><div className={styles.webPreviewTop}><Image src="/portfolio-a/cinder-web-top.webp" alt="CINDER 웹 랜딩 디자인 상단" fill sizes="(max-width: 700px) 88vw, 25vw"/></div><div className={styles.webPreviewBottom}><Image src="/portfolio-a/cinder-web-bottom.webp" alt="CINDER 웹 랜딩 디자인 하단" fill sizes="(max-width: 700px) 88vw, 25vw"/></div></>}
   {nodes.map((node,i)=>{
    const pos:CSSProperties={'--source-x':`${node.x/38.4}%`,'--source-y':`${node.y/21.6}%`,'--source-w':`${node.w/38.4}%`,'--source-h':`${node.h/21.6}%`,'--source-font':`${(node.size??32)/38.4}cqw`,'--source-order':mobileOrder.findIndex(n=>n.id===node.id)} as CSSProperties;
    if(node.type==='image'){
      const image=<Image src={node.src!} alt={`${heading} — ${videoLinks[node.id]?'영상 열기':'작업 이미지 '+(i+1)}`} fill sizes="(max-width: 700px) 90vw, 85vw"/>;
      return videoLinks[node.id] ? <a key={node.id} className={`${styles.sourceImage} ${styles.videoLink}`} style={{...pos,aspectRatio:node.w/node.h}} href={videoLinks[node.id]} target="_blank" rel="noreferrer">{image}<span>영상 보기 ↗</span></a> : <div key={node.id} className={styles.sourceImage} style={{...pos,aspectRatio:node.w/node.h}}>{image}</div>;
    }
    const Tag=(node.size??0)>=64?'h2':'p';
    return <Tag key={node.id} className={styles.sourceText} style={{...pos,textAlign:node.align==='CENTER'?'center':node.align==='RIGHT'?'right':'left',fontFamily:node.font==='Poppins'?'var(--font-poppins), "Pretendard Variable", sans-serif':'"Pretendard Variable", sans-serif',fontWeight:node.weight??400,color:node.color?`rgb(${node.color.r*255} ${node.color.g*255} ${node.color.b*255})`:undefined,lineHeight:node.lineHeight?.unit==='PIXELS'?`${(node.lineHeight.value??40)/38.4}cqw`:1.55}}>{node.text}</Tag>;
   })}
 </section>;
 })}</div>;
}
