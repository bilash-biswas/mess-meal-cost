import React from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  bengaliSubLabel?: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "due" | "info";
}

export function SummaryCard({
  title,
  bengaliSubLabel,
  value,
  subtitle,
  icon: Icon,
  tone = "default",
}: SummaryCardProps) {
  const toneStyles = {
    default: "text-slate-900 dark:text-white",
    positive: "text-emerald-600 dark:text-emerald-400",
    due: "text-rose-600 dark:text-rose-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  const iconBgStyles = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    due: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };

  return (
    <Card className="p-4 sm:p-5 flex items-start justify-between gap-3">
      <div className="space-y-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
          {title}{" "}
          {bengaliSubLabel && (
            <span className="opacity-75">({bengaliSubLabel})</span>
          )}
        </p>
        <p
          className={cn(
            "text-xl sm:text-2xl font-extrabold tracking-tight",
            toneStyles[tone]
          )}
        >
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
            {subtitle}
          </p>
        )}
      </div>

      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          iconBgStyles[tone]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </Card>
  );
}
