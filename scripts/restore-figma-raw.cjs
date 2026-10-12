// Reconstruct image fills from original uploads, never from parent-clipped exports.
const fs=require('fs'),sharp=require('sharp');
(async()=>{
 const sourceDirectory=process.argv[2];
 if(!sourceDirectory)throw new Error('Usage: node scripts/restore-figma-raw.cjs <original-download-directory>');
 const records=JSON.parse(fs.readFileSync('docs/FIGMA_RAW_IMAGE_RESTORATION.json')); 
 const pages=JSON.parse(fs.readFileSync('src/content/portfolio-a-pages.json'));
 for(const r of records){
  const input=`${sourceDirectory}/original-${r.id.replace(':','-')}.png`;
  let pipeline=sharp(input); const m=await pipeline.metadata();
  if(r.fill.scaleMode==='CROP'){
   const t=r.fill.imageTransform;
   const left=Math.max(0,Math.round(t[0][2]*m.width)),top=Math.max(0,Math.round(t[1][2]*m.height));
   pipeline=pipeline.extract({left,top,width:Math.min(m.width-left,Math.round(t[0][0]*m.width)),height:Math.min(m.height-top,Math.round(t[1][1]*m.height))});
  }
  // Keep original pixels: lossless WebP, no rescaling or invented detail.
  const src=`/portfolio-a/raw-${r.id.replace(':','-')}.webp`;
  await pipeline.webp({lossless:true}).toFile('public'+src);
  for(const p of pages)for(const n of p.nodes)if(n.id===r.id){n.src=src;n.rawSource=true;}
 }
 fs.writeFileSync('src/content/portfolio-a-pages.json',JSON.stringify(pages,null,2)+'\n');
 fs.writeFileSync('docs/FIGMA_RAW_IMAGE_RESTORATION.json',JSON.stringify(records,null,2)+'\n');
})().catch(e=>{console.error(e);process.exit(1)});
