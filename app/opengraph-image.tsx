import { ImageResponse } from "next/og";

export const alt = "Ross Tax Pro Software Co. — Taxes, People, Technology";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#071a32",
          color: "#fffdf8",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 760,
            height: 760,
            borderRadius: 760,
            right: -140,
            top: -260,
            background: "rgba(225,194,122,.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: 520,
            right: 40,
            bottom: -300,
            background: "rgba(200,206,214,.09)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "68px 76px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ width: 88, height: 88, borderRadius: 24, border: "4px solid #d9b86f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, fontWeight: 900 }}>R</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 4 }}>ROSS TAX PRO</div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 6, color: "#d9b86f", marginTop: 4 }}>SOFTWARE CO.</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 6, color: "#d9b86f", marginBottom: 22 }}>TAXES • PEOPLE • TECHNOLOGY</div>
            <div style={{ fontSize: 78, lineHeight: .98, fontWeight: 800, letterSpacing: -4 }}>Tax intelligence for a brighter tomorrow.</div>
            <div style={{ fontSize: 24, lineHeight: 1.45, color: "#cbd4df", marginTop: 28 }}>Professional tax operations, education, payroll, documents, and secure virtual-office support.</div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 18, color: "#cbd4df" }}>
            <span>rosstaxsoftware.com</span><span>•</span><span>Tax Practitioner Virtual Office</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
