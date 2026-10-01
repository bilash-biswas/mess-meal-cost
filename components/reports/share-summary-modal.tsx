"use client";

import React, { useState, useMemo } from "react";
import {
  MessageCircle,
  Copy,
  Check,
  Share2,
  FileText,
  ArrowRightLeft,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  generateWhatsAppSummary,
  type SummaryFormatType,
} from "@/lib/utils/format-whatsapp-summary";
import type { MonthlyAccountingSummary } from "@/lib/calculations/member-balance";
import type { SettlementTransfer } from "@/lib/calculations/settlement";

interface ShareSummaryModalProps {
  open: boolean;
  onClose: () => void;
  messName: string;
  monthId: string;
  accounting: MonthlyAccountingSummary;
  settlements: SettlementTransfer[];
}

export function ShareSummaryModal({
  open,
  onClose,
  messName,
  monthId,
  accounting,
  settlements,
}: ShareSummaryModalProps) {
  const [formatType, setFormatType] = useState<SummaryFormatType>("full");
  const [copied, setCopied] = useState(false);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://mess-meal-cost.vercel.app";

  const summaryText = useMemo(() => {
    return generateWhatsAppSummary({
      messName,
      monthId,
      accounting,
      settlements,
      appUrl,
      formatType,
    });
  }, [messName, monthId, accounting, settlements, appUrl, formatType]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(summaryText)}`;
    window.open(waUrl, "_blank");
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${messName} Monthly Summary`,
          text: summaryText,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    await handleCopy();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share Mess হিসাব (WhatsApp / Messenger)"
      description="Share a formatted monthly breakdown or settlement guide directly with your mess group."
    >
      <div className="space-y-4">
        {/* Format Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 p-1 text-xs">
          <button
            type="button"
            onClick={() => setFormatType("full")}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 font-semibold transition-colors cursor-pointer ${
              formatType === "full"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Full Breakdown</span>
          </button>

          <button
            type="button"
            onClick={() => setFormatType("summary")}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 font-semibold transition-colors cursor-pointer ${
              formatType === "summary"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Short Summary</span>
          </button>

          <button
            type="button"
            onClick={() => setFormatType("settlement")}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 font-semibold transition-colors cursor-pointer ${
              formatType === "settlement"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Settlement Only</span>
          </button>
        </div>

        {/* Message Preview Box */}
        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              WhatsApp Message Preview
            </span>
            <Badge variant="outline" className="text-[10px]">
              Ready to send
            </Badge>
          </div>

          <pre className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed select-all">
            {summaryText}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied to
                  Clipboard!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy Text
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNativeShare}
              className="cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" /> More Options
            </Button>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleWhatsAppShare}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" /> Share on WhatsApp
          </Button>
        </div>
      </div>
    </Modal>
  );
}
