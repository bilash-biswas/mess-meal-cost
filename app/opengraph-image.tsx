import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "MessCost — Simple Mess হিসাব, Shared by Everyone";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#064e3b",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.15) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(16, 185, 129, 0.2) 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          padding: "60px 70px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "white",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              backgroundColor: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: "900",
              color: "#ffffff",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            }}
          >
            Tk
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "36px",
                fontWeight: "800",
                letterSpacing: "-0.03em",
              }}
            >
              MessCost
            </span>
            <span
              style={{
                fontSize: "18px",
                color: "#a7f3d0",
                fontWeight: "500",
              }}
            >
              mess-meal-cost.vercel.app
            </span>
          </div>
        </div>

        {/* Hero Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxWidth: "960px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(16, 185, 129, 0.25)",
              border: "1px solid rgba(110, 231, 183, 0.4)",
              borderRadius: "9999px",
              padding: "6px 20px",
              fontSize: "18px",
              fontWeight: "600",
              color: "#6ee7b7",
            }}
          >
            100% Free Forever • Built for Bachelor Messes in Bangladesh
          </div>

          <h1
            style={{
              fontSize: "56px",
              fontWeight: "900",
              lineHeight: "1.15",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Simple Mess Hisab, Shared by Everyone.
          </h1>

          <p
            style={{
              fontSize: "26px",
              color: "#d1fae5",
              margin: 0,
              fontWeight: "400",
              lineHeight: "1.4",
            }}
          >
            Smart Daily Meal Sheet • Bazar Expenses • Live Meal Rate • Instant Settlement
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            width: "100%",
            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            paddingTop: "24px",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "8px 18px",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            • Day-Wise Meal Khata
          </div>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "8px 18px",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            • Auto Payer Bazar Credit
          </div>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "8px 18px",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            • Android APK & PWA
          </div>
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "8px 18px",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            • WhatsApp & QR Share
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
