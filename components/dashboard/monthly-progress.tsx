import React from "react";
import { formatBDT } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface MonthlyProgressProps {
  totalExpense: number;
  totalPayments: number;
  totalDue: number;
}

export function MonthlyProgress({
  totalExpense,
  totalPayments,
  totalDue,
}: MonthlyProgressProps) {
  const collectionPercent =
    totalExpense > 0
      ? Math.min(100, Math.round((totalPayments / totalExpense) * 100))
      : 100;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">
              Monthly Collection Progress (জমা বনাম খরচ)
            </span>
            <span className="ml-2 text-xs text-slate-500">
              Collected {formatBDT(totalPayments)} of {formatBDT(totalExpense)}
            </span>
          </div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {collectionPercent}% Funded ({formatBDT(totalDue)} Total Due)
          </span>
        </div>

        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${collectionPercent}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
