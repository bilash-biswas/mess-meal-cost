"use client";

import React, { useState, useMemo } from "react";
import {
  Receipt,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMess } from "@/hooks/use-mess";
import { useExpenses } from "@/hooks/use-expenses";
import { formatBDT, formatReadableDate } from "@/lib/utils";
import { getFriendlyErrorMessage } from "@/lib/utils/error-messages";
import {
  EXPENSE_CATEGORIES,
  type MessExpense,
} from "@/types/expense";
import { ExpenseFormModal } from "@/components/expenses/expense-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog, Modal } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";

export default function ExpensesPage() {
  const { user } = useAuth();
  const { accounting, canManage, isMonthClosed } = useMess();
  const { expenses, removeExpense } = useExpenses();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MessExpense | null>(
    null
  );
  const [deletingExpense, setDeletingExpense] = useState<MessExpense | null>(
    null
  );
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<MessExpense | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "meal" | "other">("all");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const categoryLabelMap = useMemo(() => {
    return new Map(EXPENSE_CATEGORIES.map((c) => [c.value, c]));
  }, []);

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return expenses.filter((exp) => {
      if (typeFilter !== "all" && exp.expenseType !== typeFilter) return false;
      if (!q) return true;
      return (
        exp.description.toLowerCase().includes(q) ||
        exp.paidByName.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q)
      );
    });
  }, [expenses, searchQuery, typeFilter]);

  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    setErrorMsg(null);
    setDeletingLoading(true);
    try {
      await removeExpense(deletingExpense);
      setDeletingExpense(null);
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setDeletingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-emerald-600" /> Bazar & Shared
            Expenses (বাজার ও খরচ)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Whoever adds an expense pays for that product — the amount is
            automatically added to their Paid (জমা) balance.
          </p>
        </div>

        {!isMonthClosed && (
          <Button
            onClick={() => {
              setEditingExpense(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        )}
      </div>

      {isMonthClosed && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            This month is closed. Expenses are read-only unless reopened by an
            Owner or Admin.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">
            Total Meal Expense (বাজার খরচ)
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBDT(accounting.totalMealExpense)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Included in Meal Rate ({formatBDT(accounting.mealRate)}/meal)
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">
            Other Shared Expense (বিল ও অন্যান্য)
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {formatBDT(accounting.totalOtherExpense)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Electricity, Gas, Wi-Fi, Khala & Cleaning
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">
            Total Monthly Expense (মোট খরচ)
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatBDT(accounting.totalExpense)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {expenses.length} recorded transactions (credited to payers)
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>Expense History</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  placeholder="Search bazar, member, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "meal", label: "Meal" },
                    { key: "other", label: "Shared" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTypeFilter(tab.key)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      typeFilter === tab.key
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredExpenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses yet."
              description="Start recording your first mess expense."
              actionLabel={!isMonthClosed ? "Add Expense" : undefined}
              onAction={
                !isMonthClosed
                  ? () => {
                      setEditingExpense(null);
                      setModalOpen(true);
                    }
                  : undefined
              }
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((exp) => {
                const catMeta = categoryLabelMap.get(exp.category);
                const canModifyThis =
                  !isMonthClosed &&
                  (canManage ||
                    exp.paidBy === user?.uid ||
                    exp.createdBy === user?.uid);
                return (
                  <div
                    key={exp.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {exp.description}
                        </span>
                        <Badge
                          variant={
                            exp.expenseType === "meal" ? "positive" : "info"
                          }
                        >
                          {exp.expenseType === "meal"
                            ? "Meal Expense"
                            : "Other Shared"}
                        </Badge>
                        <Badge variant="outline">
                          {catMeta
                            ? `${catMeta.label} (${catMeta.bengaliHint})`
                            : exp.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatReadableDate(exp.date)} • Added & Paid by{" "}
                        <strong className="text-emerald-700 dark:text-emerald-400">
                          {exp.paidByName}
                        </strong>{" "}
                        <span className="text-[11px] text-slate-400">
                          (Credited to Paid balance)
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                        {formatBDT(exp.amount)}
                      </span>

                      <div className="flex items-center gap-1">
                        {exp.receiptUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setReceiptPreview(exp)}
                          >
                            <Eye className="h-3.5 w-3.5" /> Receipt
                          </Button>
                        )}

                        {canModifyThis && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingExpense(exp);
                                setModalOpen(true);
                              }}
                              aria-label={`Edit ${exp.description}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingExpense(exp)}
                              aria-label={`Delete ${exp.description}`}
                              className="text-rose-600 hover:text-rose-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ExpenseFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
      />

      <ConfirmDialog
        open={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleConfirmDelete}
        loading={deletingLoading}
        title="Delete Expense Record?"
        description={`Are you sure you want to delete "${deletingExpense?.description}" (${formatBDT(
          deletingExpense?.amount ?? 0
        )})? This will immediately recalculate the monthly meal rate and member balances.`}
        confirmLabel="Delete Expense"
      />

      {/* Receipt Lightbox Modal */}
      <Modal
        open={Boolean(receiptPreview)}
        onClose={() => setReceiptPreview(null)}
        title={receiptPreview?.description || "Expense Receipt"}
        description={
          receiptPreview
            ? `${formatReadableDate(receiptPreview.date)} • ${formatBDT(
                receiptPreview.amount
              )} • Paid by ${receiptPreview.paidByName}`
            : ""
        }
      >
        {receiptPreview?.receiptUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptPreview.receiptUrl}
              alt={`Receipt for ${receiptPreview.description}`}
              className="max-h-[70vh] w-auto object-contain"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
