"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck2,
  Lock,
  Unlock,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMess } from "@/hooks/use-mess";
import {
  closeMessMonth,
  reopenMessMonth,
  updateMonthCustomSplit,
} from "@/lib/firebase/firestore";
import { formatBDT, formatMonthTitle } from "@/lib/utils";
import { getFriendlyErrorMessage } from "@/lib/utils/error-messages";
import type { SharedSplitMode } from "@/types/mess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";

export default function MonthlyAccountPage() {
  const { user } = useAuth();
  const {
    mess,
    members,
    selectedMonthId,
    monthDoc,
    isMonthClosed,
    canManage,
    accounting,
  } = useMess();

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [splitMode, setSplitMode] = useState<SharedSplitMode>("equal");
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [savingSplit, setSavingSplit] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const mode = monthDoc?.sharedSplitMode || mess?.sharedExpenseSplitMode || "equal";
    setSplitMode(mode);
    const map: Record<string, string> = {};
    for (const m of members) {
      const val = monthDoc?.customSharedShares?.[m.uid];
      map[m.uid] =
        typeof val === "number"
          ? String(val)
          : String(
              Math.round(
                (accounting.totalOtherExpense / Math.max(1, members.length)) * 100
              ) / 100
            );
    }
    setCustomShares(map);
  }, [
    monthDoc?.sharedSplitMode,
    monthDoc?.customSharedShares,
    mess?.sharedExpenseSplitMode,
    members,
    accounting.totalOtherExpense,
  ]);

  if (!mess) return null;

  const handleCloseMonth = async () => {
    if (!user) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setProcessing(true);
    try {
      await closeMessMonth({
        messId: mess.id,
        monthId: selectedMonthId,
        closedBy: user.uid,
        closedByName: user.name,
        snapshot: {
          totalMealExpense: accounting.totalMealExpense,
          totalOtherExpense: accounting.totalOtherExpense,
          totalExpense: accounting.totalExpense,
          totalMeals: accounting.totalMeals,
          mealRate: accounting.mealRate,
          totalPayments: accounting.totalPayments,
          memberSummaries: accounting.memberBalances.map((b) => ({
            userId: b.userId,
            memberName: b.memberName,
            meals: b.meals,
            mealCost: b.mealCost,
            sharedExpenseShare: b.sharedExpenseShare,
            customExpenseShare: b.customExpenseShare,
            totalCost: b.totalCost,
            totalPaid: b.totalPaid,
            balance: b.balance,
            balanceStatus: b.status,
          })),
        },
      });
      setCloseModalOpen(false);
      setStatusMsg(
        `${formatMonthTitle(selectedMonthId)} has been closed and its financial calculations are frozen.`
      );
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleReopenMonth = async () => {
    if (!user) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setProcessing(true);
    try {
      await reopenMessMonth({
        messId: mess.id,
        monthId: selectedMonthId,
        reopenedBy: user.uid,
        reopenedByName: user.name,
      });
      setReopenModalOpen(false);
      setStatusMsg(
        `${formatMonthTitle(selectedMonthId)} was reopened by ${user.name}.`
      );
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveSplitConfig = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    setSavingSplit(true);
    try {
      const numericMap: Record<string, number> = {};
      for (const [uid, raw] of Object.entries(customShares)) {
        const val = Number(raw);
        numericMap[uid] = Number.isFinite(val) && val >= 0 ? val : 0;
      }
      await updateMonthCustomSplit({
        messId: mess.id,
        monthId: selectedMonthId,
        sharedSplitMode: splitMode,
        customSharedShares: numericMap,
      });
      setStatusMsg(
        `Shared expense split mode updated to "${splitMode.toUpperCase()}" for ${formatMonthTitle(
          selectedMonthId
        )}.`
      );
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setSavingSplit(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarCheck2 className="h-6 w-6 text-emerald-600" />
              {formatMonthTitle(selectedMonthId)}
            </h1>
            <Badge variant={isMonthClosed ? "warning" : "positive"}>
              Status: {isMonthClosed ? "CLOSED" : "OPEN"}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Complete monthly accounting summary (মাসের সম্পূর্ণ হিসাব).
          </p>
        </div>

        {canManage && (
          <div>
            {isMonthClosed ? (
              <Button
                variant="outline"
                onClick={() => setReopenModalOpen(true)}
              >
                <Unlock className="h-4 w-4 text-amber-600" /> Reopen Month
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => setCloseModalOpen(true)}
              >
                <Lock className="h-4 w-4" /> Close Month
              </Button>
            )}
          </div>
        )}
      </div>

      {statusMsg && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-800 dark:text-emerald-200"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Audit Metadata Banner when Closed or Reopened */}
      {(monthDoc?.closedBy || monthDoc?.reopenedBy) && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
          {monthDoc.status === "closed" && (
            <span>
              Closed by{" "}
              <strong>{monthDoc.closedByName || monthDoc.closedBy}</strong>
              {monthDoc.closedAt
                ? ` on ${new Date(monthDoc.closedAt).toLocaleString()}`
                : ""}
            </span>
          )}
          {monthDoc.reopenedBy && (
            <span>
              Last reopened by{" "}
              <strong>{monthDoc.reopenedByName || monthDoc.reopenedBy}</strong>
              {monthDoc.reopenedAt
                ? ` on ${new Date(monthDoc.reopenedAt).toLocaleString()}`
                : ""}
            </span>
          )}
        </div>
      )}

      {/* Top Financial Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Total Meal Expense</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatBDT(accounting.totalMealExpense)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Total Other Expense</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatBDT(accounting.totalOtherExpense)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Total Expense (মোট খরচ)</p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatBDT(accounting.totalExpense)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Total Meals (মোট মিল)</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {accounting.totalMeals}
          </p>
        </Card>
        <Card className="p-4 border-emerald-500/30 bg-emerald-500/5 col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Meal Rate (মিল রেট)
          </p>
          <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
            {formatBDT(accounting.mealRate, { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      {/* Member Account Table / Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Member Monthly Accounts</CardTitle>
          <CardDescription>
            Meal Cost = Member Meals × Meal Rate • Balance = Total Cost - Paid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                  <th className="py-3 px-3">Member</th>
                  <th className="py-3 px-3 text-right">Meals</th>
                  <th className="py-3 px-3 text-right">Meal Cost</th>
                  <th className="py-3 px-3 text-right">Shared Cost</th>
                  <th className="py-3 px-3 text-right">Total Cost</th>
                  <th className="py-3 px-3 text-right">Paid (জমা)</th>
                  <th className="py-3 px-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {accounting.memberBalances.map((row) => (
                  <tr key={row.userId}>
                    <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {row.memberName}
                    </td>
                    <td className="py-3.5 px-3 text-right">{row.meals}</td>
                    <td className="py-3.5 px-3 text-right">
                      {formatBDT(row.mealCost)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {formatBDT(row.sharedExpenseShare + row.customExpenseShare)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold">
                      {formatBDT(row.totalCost)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatBDT(row.totalPaid)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {row.status === "due" ? (
                        <Badge variant="due">
                          {formatBDT(row.absoluteBalance)} Due
                        </Badge>
                      ) : row.status === "receivable" ? (
                        <Badge variant="positive">
                          {formatBDT(row.absoluteBalance)} Receive
                        </Badge>
                      ) : (
                        <Badge variant="outline">Settled</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Equal Split vs Custom Split Configuration */}
      {canManage && !isMonthClosed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sliders className="h-4 w-4 text-emerald-600" /> Shared Expense
              Split Configuration
            </CardTitle>
            <CardDescription>
              Choose how non-meal Shared Expenses ({formatBDT(accounting.totalOtherExpense)})
              are divided among members.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSplitMode("equal")}
                className={`rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  splitMode === "equal"
                    ? "border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                Equal Split (Each member ={" "}
                {formatBDT(
                  accounting.totalOtherExpense / Math.max(1, members.length)
                )}
                )
              </button>
              <button
                type="button"
                onClick={() => setSplitMode("custom")}
                className={`rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  splitMode === "custom"
                    ? "border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                Custom Split (Specify individual shares)
              </button>
            </div>

            {splitMode === "custom" && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {members.map((m) => (
                  <div key={m.uid} className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {m.name} (৳ Share)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customShares[m.uid] ?? "0"}
                      onChange={(e) =>
                        setCustomShares((prev) => ({
                          ...prev,
                          [m.uid]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              size="sm"
              onClick={handleSaveSplitConfig}
              disabled={savingSplit}
            >
              {savingSplit ? "Saving Split Mode..." : "Save Split Configuration"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Close Month Confirmation Dialog (Exact prompt wording from Section 20) */}
      <ConfirmDialog
        open={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        onConfirm={handleCloseMonth}
        loading={processing}
        title="Are you sure?"
        description="After closing, normal members will not be able to modify this month's financial records."
        confirmLabel="Close Month"
        cancelLabel="Cancel"
      />

      {/* Reopen Month Confirmation Dialog */}
      <ConfirmDialog
        open={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        onConfirm={handleReopenMonth}
        loading={processing}
        variant="default"
        title="Reopen Monthly Account?"
        description={`Reopening ${formatMonthTitle(
          selectedMonthId
        )} will allow authorized members to edit meals, expenses, and payments again. Your name will be recorded in the audit log.`}
        confirmLabel="Reopen Month"
      />
    </div>
  );
}
