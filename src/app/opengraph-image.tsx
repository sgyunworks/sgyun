import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "SGYUN Portfolio — Industrial · Metalcraft · AI Creative Design";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [font, logo] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/Poppins-Regular.ttf")),
    readFile(join(process.cwd(), "public/brand/sgyun-wordmark.png")),
  ]);
  return new ImageResponse(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"white",color:"#111",fontFamily:"Poppins"}}>
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{position:"absolute",top:0,left:0}}>
        <path d="M430 0 L597 260 M790 0 L626 260 M612 330 L612 630" fill="none" stroke="#b6b9bb" strokeWidth="1"/>
      </svg>
      <img src={`data:image/png;base64,${logo.toString("base64")}`} width="450" height="170" alt="" style={{marginTop:15}}/>
      <div style={{display:"flex",marginTop:24,fontSize:20,background:"white"}}>PORTFOLIO 2026</div>
      <div style={{display:"flex",fontSize:23,marginTop:5,background:"white"}}>Industrial · Metalcraft · AI Creative Design</div>
      <div style={{position:"absolute",bottom:34,right:46,fontSize:17,color:"#666"}}>sgyun.kr</div>
    </div>,
    {...size,fonts:[{name:"Poppins",data:font,weight:400,style:"normal"}]}
  );
}
