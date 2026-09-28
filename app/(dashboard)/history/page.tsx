"use client";

import React, { useEffect, useState } from "react";
import {
  History as HistoryIcon,
  Lock,
  Calendar,
  Eye,
  ArrowRight,
} from "lucide-react";
import { useMess } from "@/hooks/use-mess";
import { listMessMonths } from "@/lib/firebase/firestore";
import { formatBDT, formatMonthTitle } from "@/lib/utils";
import type { MessMonth } from "@/types/month";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";

export default function HistoryPage() {
  const { mess, accounting, setSelectedMonthId } = useMess();
  const [months, setMonths] = useState<MessMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSnapshotMonth, setSelectedSnapshotMonth] =
    useState<MessMonth | null>(null);

  useEffect(() => {
    if (!mess) return;
    let active = true;
    setLoading(true);
    listMessMonths(mess.id)
      .then((list) => {
        if (active) setMonths(list);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mess]);

  if (!mess) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HistoryIcon className="h-6 w-6 text-emerald-600" /> Monthly History
          (পূর্ববর্তী মাসের হিসাব)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Browse closed and active monthly accounts. Clicking a closed month
          opens its preserved read-only financial report.
        </p>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          Loading monthly history...
        </Card>
      ) : months.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No monthly history yet."
          description="Your monthly accounts will appear here as you record expenses and meals."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {months.map((m) => {
            const isCurrentActive = m.id === mess.activeMonthId;
            const totalExpense = m.snapshot
              ? m.snapshot.totalExpense
              : isCurrentActive
              ? accounting.totalExpense
              : 0;
            const mealRate = m.snapshot
              ? m.snapshot.mealRate
              : isCurrentActive
              ? accounting.mealRate
              : 0;

            return (
              <Card
                key={m.id}
                className="p-5 flex flex-col justify-between gap-4 hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      {m.title || formatMonthTitle(m.id)}
                    </h2>
                    <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <p>
                        Total Expense:{" "}
                        <strong className="text-slate-900 dark:text-white">
                          {formatBDT(totalExpense)}
                        </strong>
                      </p>
                      <p>
                        Meal Rate:{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {formatBDT(mealRate, { minimumFractionDigits: 2 })}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={m.status === "closed" ? "warning" : "positive"}
                  >
                    {m.status === "closed" ? "Closed" : "Open"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  {m.snapshot ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSnapshotMonth(m)}
                    >
                      <Eye className="h-3.5 w-3.5" /> Read-Only Report
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Live calculation active
                    </span>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMonthId(m.id)}
                  >
                    Switch to {m.id} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Read-only Frozen Snapshot Report Modal */}
      <Modal
        open={Boolean(selectedSnapshotMonth)}
        onClose={() => setSelectedSnapshotMonth(null)}
        title={`${
          selectedSnapshotMonth?.title || ""
        } — Closed Read-Only Report`}
        description="Historical snapshot preserved at the time the month was closed."
        maxWidthClass="max-w-2xl"
      >
        {selectedSnapshotMonth?.snapshot && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-200">
              <Lock className="h-4 w-4 shrink-0" />
              <span>
                Closed by{" "}
                <strong>
                  {selectedSnapshotMonth.closedByName ||
                    selectedSnapshotMonth.closedBy ||
                    "Owner"}
                </strong>
                . Historical figures are locked.
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                <p className="text-xs text-slate-500">Total Expense</p>
                <p className="text-base font-bold mt-0.5">
                  {formatBDT(selectedSnapshotMonth.snapshot.totalExpense)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                <p className="text-xs text-slate-500">Total Meals</p>
                <p className="text-base font-bold mt-0.5">
                  {selectedSnapshotMonth.snapshot.totalMeals}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Meal Rate
                </p>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {formatBDT(selectedSnapshotMonth.snapshot.mealRate, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                    <th className="py-2 px-2">Member</th>
                    <th className="py-2 px-2 text-right">Meals</th>
                    <th className="py-2 px-2 text-right">Cost</th>
                    <th className="py-2 px-2 text-right">Paid</th>
                    <th className="py-2 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedSnapshotMonth.snapshot.memberSummaries.map((row) => (
                    <tr key={row.userId}>
                      <td className="py-2.5 px-2 font-medium">
                        {row.memberName}
                      </td>
                      <td className="py-2.5 px-2 text-right">{row.meals}</td>
                      <td className="py-2.5 px-2 text-right">
                        {formatBDT(row.totalCost)}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {formatBDT(row.totalPaid)}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <Badge
                          variant={
                            row.balanceStatus === "due"
                              ? "due"
                              : row.balanceStatus === "receivable"
                              ? "positive"
                              : "outline"
                          }
                        >
                          {row.balanceStatus === "settled"
                            ? "Settled"
                            : `${formatBDT(Math.abs(row.balance))} ${
                                row.balanceStatus === "due" ? "Due" : "Receive"
                              }`}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
