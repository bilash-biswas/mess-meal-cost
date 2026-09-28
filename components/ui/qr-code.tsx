"use client";

import React, { useMemo, useRef } from "react";
import { Download } from "lucide-react";
import { generateQrMatrix } from "@/lib/utils/qrcode";
import { Button } from "@/components/ui/button";

interface QrCodeProps {
  value: string;
  size?: number;
  title?: string;
  subtitle?: string;
  downloadFileName?: string;
  showDownloadButton?: boolean;
}

export function QrCode({
  value,
  size = 200,
  title,
  subtitle,
  downloadFileName = "messcost-qr.png",
  showDownloadButton = true,
}: QrCodeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const matrix = useMemo(() => {
    return generateQrMatrix(value || "https://messcost.app");
  }, [value]);

  const moduleCount = matrix.length;
  const quietZone = 3;
  const viewBoxSize = moduleCount + quietZone * 2;

  const handleDownloadPng = () => {
    const canvas = document.createElement("canvas");
    const scale = 12;
    const padding = quietZone * scale;
    const qrPixelSize = moduleCount * scale + padding * 2;
    const headerHeight = title ? 56 : 16;
    const footerHeight = subtitle ? 44 : 16;

    canvas.width = qrPixelSize;
    canvas.height = qrPixelSize + headerHeight + footerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White background card
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Optional Title
    if (title) {
      ctx.fillStyle = "#059669";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(title, canvas.width / 2, 34);
    }

    // Draw QR modules
    ctx.fillStyle = "#0f172a";
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(
            padding + c * scale,
            headerHeight + padding + r * scale,
            scale,
            scale
          );
        }
      }
    }

    // Optional Subtitle
    if (subtitle) {
      ctx.fillStyle = "#475569";
      ctx.font = "600 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        subtitle,
        canvas.width / 2,
        headerHeight + qrPixelSize + 22
      );
    }

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = downloadFileName;
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative rounded-2xl border-2 border-emerald-500/30 bg-white p-3 shadow-sm">
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          shapeRendering="crispEdges"
          role="img"
          aria-label={title || "QR Code"}
          className="block"
        >
          <rect
            x={0}
            y={0}
            width={viewBoxSize}
            height={viewBoxSize}
            fill="#ffffff"
          />
          {matrix.map((row, rIdx) =>
            row.map((cell, cIdx) =>
              cell ? (
                <rect
                  key={`${rIdx}-${cIdx}`}
                  x={cIdx + quietZone}
                  y={rIdx + quietZone}
                  width={1}
                  height={1}
                  fill="#0f172a"
                />
              ) : null
            )
          )}
        </svg>
      </div>

      {showDownloadButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadPng}
        >
          <Download className="h-3.5 w-3.5" /> Download QR Image (PNG)
        </Button>
      )}
    </div>
  );
}
