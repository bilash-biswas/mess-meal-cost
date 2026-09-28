"use client";

import React, { useState, useEffect } from "react";
import { Upload, AlertCircle, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMess } from "@/hooks/use-mess";
import { useExpenses } from "@/hooks/use-expenses";
import { validateReceiptFile } from "@/lib/validations";
import { getTodayDateString } from "@/lib/utils";
import { getFriendlyErrorMessage } from "@/lib/utils/error-messages";
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type ExpenseType,
  type MessExpense,
} from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/dialog";

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  editingExpense?: MessExpense | null;
}

export function ExpenseFormModal({
  open,
  onClose,
  editingExpense,
}: ExpenseFormModalProps) {
  const { user } = useAuth();
  const { members, currentMember, selectedMonthId } = useMess();
  const { createExpense, editExpense } = useExpenses();

  const defaultDate = getTodayDateString().startsWith(selectedMonthId)
    ? getTodayDateString()
    : `${selectedMonthId}-26`;

  const [date, setDate] = useState(defaultDate);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("vegetables");
  const [paidBy, setPaidBy] = useState("");
  const [expenseType, setExpenseType] = useState<ExpenseType>("meal");
  const [description, setDescription] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const payerName =
    editingExpense?.paidByName ||
    currentMember?.name ||
    user?.name ||
    members.find((m) => m.uid === paidBy)?.name ||
    "You";

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    setReceiptFile(null);

    if (editingExpense) {
      setDate(editingExpense.date);
      setAmount(String(editingExpense.amount));
      setCategory(editingExpense.category);
      setPaidBy(editingExpense.paidBy);
      setExpenseType(editingExpense.expenseType);
      setDescription(editingExpense.description);
    } else {
      setDate(defaultDate);
      setAmount("");
      setCategory("vegetables");
      // Whoever adds the expense automatically pays for this product
      setPaidBy(user?.uid || currentMember?.uid || members[0]?.uid || "");
      setExpenseType("meal");
      setDescription("");
    }
  }, [open, editingExpense, defaultDate, user?.uid, currentMember?.uid, members]);

  const handleCategoryChange = (nextCategory: ExpenseCategory) => {
    setCategory(nextCategory);
    const meta = EXPENSE_CATEGORIES.find((c) => c.value === nextCategory);
    if (meta && !editingExpense) {
      setExpenseType(meta.defaultExpenseType);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0] || null;
    if (!file) {
      setReceiptFile(null);
      return;
    }
    const validation = validateReceiptFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || "Invalid receipt image.");
      e.target.value = "";
      return;
    }
    setReceiptFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setErrorMsg("Please enter an expense amount greater than 0.");
      return;
    }
    const resolvedPayerId = editingExpense
      ? editingExpense.paidBy
      : user?.uid || paidBy;
    if (!resolvedPayerId) {
      setErrorMsg("Unable to identify current member.");
      return;
    }
    if (description.trim().length < 2) {
      setErrorMsg("Please enter a short description (e.g. Vegetables + potatoes).");
      return;
    }

    setSubmitting(true);
    try {
      if (editingExpense) {
        await editExpense(editingExpense.id, {
          date,
          category,
          amount: numAmount,
          paidBy: resolvedPayerId,
          expenseType,
          description: description.trim(),
          receiptFile,
          existingReceiptUrl: editingExpense.receiptUrl,
        });
      } else {
        await createExpense({
          date,
          category,
          amount: numAmount,
          paidBy: resolvedPayerId,
          expenseType,
          description: description.trim(),
          receiptFile,
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(
        getFriendlyErrorMessage(err, "Unable to save expense. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingExpense ? "Edit Expense" : "+ Add Expense (খরচ যোগ করুন)"}
      description="Whoever adds this expense is recorded as paying for this product and automatically credited in their Paid (জমা) balance."
    >
      {errorMsg && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs sm:text-sm text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="exp-amount">৳ Amount</Label>
            <Input
              id="exp-amount"
              type="number"
              step="0.01"
              min="1"
              placeholder="850"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-base font-bold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-date">Date</Label>
            <Input
              id="exp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="exp-category">Category</Label>
            <select
              id="exp-category"
              value={category}
              onChange={(e) =>
                handleCategoryChange(e.target.value as ExpenseCategory)
              }
              className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            >
              <optgroup label="Food (বাজার ও খাবার)">
                {EXPENSE_CATEGORIES.filter((c) => c.group === "food").map(
                  (c) => (
                    <option key={c.value} value={c.value}>
                      {c.label} ({c.bengaliHint})
                    </option>
                  )
                )}
              </optgroup>
              <optgroup label="Utilities (ইউটিলিটি বিল)">
                {EXPENSE_CATEGORIES.filter((c) => c.group === "utilities").map(
                  (c) => (
                    <option key={c.value} value={c.value}>
                      {c.label} ({c.bengaliHint})
                    </option>
                  )
                )}
              </optgroup>
              <optgroup label="Household (বাসা ও খালা)">
                {EXPENSE_CATEGORIES.filter((c) => c.group === "household").map(
                  (c) => (
                    <option key={c.value} value={c.value}>
                      {c.label} ({c.bengaliHint})
                    </option>
                  )
                )}
              </optgroup>
              <optgroup label="Other">
                {EXPENSE_CATEGORIES.filter((c) => c.group === "other").map(
                  (c) => (
                    <option key={c.value} value={c.value}>
                      {c.label} ({c.bengaliHint})
                    </option>
                  )
                )}
              </optgroup>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Paid By (কে এই পণ্যের টাকা দিয়েছেন)</Label>
            <div className="flex h-10 w-full items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              <span className="truncate">{payerName}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0">
                Auto-Credited
              </span>
            </div>
          </div>
        </div>

        {/* Expense Type Selector */}
        <div className="space-y-1.5">
          <Label>Expense Type (হিসাবের ধরন)</Label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setExpenseType("meal")}
              className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                expenseType === "meal"
                  ? "border-emerald-600 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <span className="block text-xs font-bold">Meal Expense</span>
              <span className="block text-[11px] opacity-80 mt-0.5">
                Included in Meal Rate (বাজার)
              </span>
            </button>
            <button
              type="button"
              onClick={() => setExpenseType("other")}
              className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                expenseType === "other"
                  ? "border-blue-600 bg-blue-500/10 text-blue-900 dark:text-blue-200"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <span className="block text-xs font-bold">
                Other Shared Expense
              </span>
              <span className="block text-[11px] opacity-80 mt-0.5">
                Utilities, Khala, Wi-Fi, Gas
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="exp-desc">Description</Label>
          <Input
            id="exp-desc"
            placeholder="e.g. Vegetables + potatoes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Receipt Upload */}
        <div className="space-y-1.5">
          <Label htmlFor="exp-receipt">
            Receipt Image (Optional • JPG, PNG, WEBP ≤ 5 MB)
          </Label>
          <label
            htmlFor="exp-receipt"
            className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 px-4 py-3 text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:border-emerald-500"
          >
            <div className="flex items-center gap-2 truncate">
              {receiptFile ? (
                <>
                  <ImageIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-900 dark:text-white truncate">
                    {receiptFile.name} (
                    {Math.round(receiptFile.size / 1024)} KB)
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 shrink-0" />
                  <span>
                    {editingExpense?.receiptUrl
                      ? "Replace existing receipt photo..."
                      : "Click to attach receipt photo (compressed automatically)"}
                  </span>
                </>
              )}
            </div>
            <span className="font-semibold text-emerald-600 shrink-0">
              Browse
            </span>
          </label>
          <input
            id="exp-receipt"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Saving..."
              : editingExpense
              ? "Update Expense"
              : "Save Expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
