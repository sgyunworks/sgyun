import { ImageResponse } from "next/og";

export const alt = "SGYUN — Designer and builder portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "62px 68px",
          color: "#f4f4f0",
          background:
            "radial-gradient(circle at 78% 28%, #1b222c 0%, #0d1015 31%, #08090b 67%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 18,
            letterSpacing: "0.16em",
          }}
        >
          <span>SGYUN</span>
          <span style={{ color: "#8c929b" }}>PORTFOLIO SYSTEM / 2026</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#8c929b", fontSize: 20, letterSpacing: "0.12em" }}>
              DESIGNER / BUILDER
            </span>
            <span style={{ marginTop: 24, fontSize: 108, fontWeight: 300, letterSpacing: "-0.06em" }}>
              Engineering Art
            </span>
          </div>
          <div
            style={{
              width: 154,
              height: 154,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #535963",
              borderRadius: "50%",
              background: "radial-gradient(circle, #252a32 0 14%, #101318 15% 58%, #08090b 59%)",
            }}
          >
            <span style={{ color: "#8c929b", fontSize: 22 }}>01 / 07</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
