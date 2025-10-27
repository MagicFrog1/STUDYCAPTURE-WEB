import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = { width: 48, height: 48 };

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 60%, #2563eb 100%)",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 22,
            fontWeight: 800,
            fontFamily: "system-ui, Segoe UI, Arial",
          }}
        >
          SC
        </span>
      </div>
    ),
    size
  );
}


