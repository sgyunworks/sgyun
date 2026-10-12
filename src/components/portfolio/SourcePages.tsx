import Image from "next/image";
import type { CSSProperties } from "react";
import pages from "@/content/portfolio-a-pages.json";
import translations from "@/content/portfolio-a-en.json";
import type { Locale } from "@/lib/i18n";
import styles from "./Portfolio.module.css";

const videoLinks: Record<string,string>={"36:751":"https://www.instagram.com/p/DUNxuMTEiFl/","54:950":"https://www.instagram.com/reel/DWYtP7Lkudp/","80:616":"https://youtu.be/m0Xcpsa-vuI"};
const ranges: Record<string,[number,number]>={vesa:[5,11],vibey:[13,16],wrgs:[19,22],wishbone:[24,27],aviator:[29,33],cinder:[35,39]};
type SourceNode={opacity?:number;corner?:number;decorative?:boolean;fill?:string;blendMode?:CSSProperties["mixBlendMode"];rawSource?:boolean;id:string;type:string;x:number;y:number;w:number;h:number;text?:string;size?:number;font?:string;weight?:number;align?:string;src?:string;name?:string;color?:{r:number;g:number;b:number};letterSpacing?:{unit:string;value:number};paragraphSpacing?:number;lineHeight?:{unit:string;value?:number}};
export function SourcePages({projectId,title,locale}:{projectId:string;title:string;locale:Locale}) {
 const range=ranges[projectId];if(!range)return null;
 return <div className={styles.sourcePages} lang={locale}>{pages.filter(p=>Number(p.page)>=range[0]&&Number(p.page)<=range[1]).map(page=>{
 const nodes=page.nodes as SourceNode[];
 const heading=nodes.find(n=>n.type==='text'&&(n.size??0)>=64)?.text?.replaceAll('\n',' ')??`${title} · ${page.page}`;
 const readingOrder=(n:SourceNode)=>{
  if((n.size??0)>=64)return -10000;
  if(page.page==='35'){
    if(n.w>1400)return -9000+n.y;
    return Math.floor(n.x/1250)*10000+n.y;
  }
  // Mobile: show both front desk configurations before the lifestyle pair.
  if(page.page==='8' && n.id==='36:492')return 400;
  if(page.page==='21' && n.id==='36:556')return 300;
  if(page.page==='21' && n.id==='36:555')return 301;
  const mobileSequence:Record<string,number>={'61:247':480,'61:239':600,'61:253':720,'61:243':240,'62:321':241,'61:242':1267,'62:320':1268};
  if((page.page==='15'||page.page==='16') && n.id in mobileSequence)return mobileSequence[n.id];
  return n.y;
 };
 const mobileOrder=[...nodes].sort((a,b)=>readingOrder(a)-readingOrder(b)||a.x-b.x);
 return <section key={page.id} id={`source-${page.page}`} className={`${styles.sourcePage} ${projectId==="cinder"?styles.darkSource:""} ${Number(page.page)===36?styles.configuratorPage:''}`} data-portfolio-section={heading} aria-label={heading} style={{backgroundColor:`rgb(${page.background.r*255} ${page.background.g*255} ${page.background.b*255})`,color:page.background.r<.5?"#f8f8f8":"#202020"}}>
   {page.page==='36' && <><div className={styles.webPreviewTop}><Image src="/portfolio-a/cinder-web-top.webp" alt={locale==='ko'?"CINDER 웹 랜딩 디자인 상단":"CINDER landing page — top"} fill quality={95} sizes="(max-width: 700px) 88vw, 25vw"/></div><div className={styles.webPreviewBottom}><Image src="/portfolio-a/cinder-web-bottom.webp" alt={locale==='ko'?"CINDER 웹 랜딩 디자인 하단":"CINDER landing page — bottom"} fill quality={95} sizes="(max-width: 700px) 88vw, 25vw"/></div></>}
   {nodes.map((node,i)=>{
    const translated=locale==='en'?(translations as Record<string,string>)[node.id]??node.text:node.text;
    const englishLabel=locale==='en'&&page.page==='37'&&node.type==='text'&&(node.size??0)<64&&node.x>3000;
    const pos:CSSProperties={'--source-x':`${(englishLabel&&node.align==='CENTER'?3068:node.x)/38.4}%`,'--source-y':`${node.y/21.6}%`,'--source-w':`${(englishLabel?(node.align==='CENTER'?544:Math.min(600,3720-node.x)):node.w)/38.4}%`,'--source-h':`${node.h/21.6}%`,'--source-font':`${(englishLabel?Math.min(node.size??32,34):node.size??32)/38.4}cqw`,'--source-order':mobileOrder.findIndex(n=>n.id===node.id),opacity:node.opacity,borderRadius:node.corner?`${node.corner/38.4}cqw`:undefined,overflow:node.corner?'hidden':undefined} as CSSProperties;
    if(node.type==='shape')return <div key={node.id} className={`${styles.sourceImage} ${styles.sourceDecoration}`} style={{...pos,background:node.fill}} aria-hidden="true"/>;
    if(node.type==='vector')return <div key={node.id} className={`${styles.sourceImage} ${styles.sourceVector}`} style={{...pos,mixBlendMode:node.blendMode}} aria-hidden="true"><Image src={node.src!} alt="" fill unoptimized/></div>;
    if(node.type==='image'){
      const image=<Image src={node.src!} unoptimized={node.rawSource} alt={`${heading} — ${videoLinks[node.id]?(locale==='ko'?'영상 열기':'Open video'):(locale==='ko'?'작업 이미지 ':'Project image ')+(i+1)}`} fill quality={95} sizes={`(max-width: 700px) 88vw, ${Math.min(100,node.w/38.4).toFixed(2)}vw`}/>;
      return videoLinks[node.id] ? <a key={node.id} className={`${styles.sourceImage} ${styles.videoLink}`} style={{...pos,aspectRatio:node.w/node.h}} href={videoLinks[node.id]} target="_blank" rel="noreferrer">{image}<span>{locale==='ko'?'영상 보기':'Watch video'} ↗</span></a> : <div key={node.id} className={`${styles.sourceImage} ${node.decorative?styles.sourceDecoration:""}`} style={{...pos,aspectRatio:node.w/node.h}}>{image}</div>;
    }
    const Tag=(node.size??0)>=64?'h2':'p';
    const sourceLineHeight=node.lineHeight?.unit==='PIXELS'?(node.lineHeight.value??0):(node.size??32)*(node.lineHeight?.unit==='PERCENT'?(node.lineHeight.value??155)/100:1.5);
    const singleLine=!translated?.includes('\n') && node.h<=sourceLineHeight*1.1;
    return <Tag key={node.id} className={`${styles.sourceText} ${singleLine?styles.sourceSingleLine:""}`} style={{...pos,textAlign:node.align==='CENTER'?'center':node.align==='RIGHT'?'right':node.align==='JUSTIFIED'?'justify':'left',fontFamily:node.font==='Poppins'?'var(--font-poppins), "Pretendard Variable", sans-serif':node.font==='Noto Sans KR'?'var(--font-noto-sans-kr), sans-serif':'"Pretendard Variable", sans-serif',fontWeight:node.weight??400,color:node.color?`rgb(${node.color.r*255} ${node.color.g*255} ${node.color.b*255})`:undefined,letterSpacing:node.letterSpacing?.unit==='PERCENT'?`${node.letterSpacing.value/100}em`:node.letterSpacing?.unit==='PIXELS'?`${node.letterSpacing.value/38.4}cqw`:0,lineHeight:node.lineHeight?.unit==='PIXELS'?`${(node.lineHeight.value??40)/38.4}cqw`:node.lineHeight?.unit==='PERCENT'?(node.lineHeight.value??155)/100:'normal'}}>{translated}</Tag>;
   })}
 </section>;
 })}</div>;
}
