import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#071a32", borderRadius: 38 }}>
        <div style={{ width: 122, height: 122, borderRadius: 34, border: "7px solid #d9b86f", display: "flex", alignItems: "center", justifyContent: "center", color: "#fffdf8", fontFamily: "Arial", fontWeight: 900, fontSize: 82, lineHeight: 1 }}>R</div>
      </div>
    ),
    size,
  );
}
