"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "./use-auth";
import { useMess } from "./use-mess";
import {
  addMessExpense,
  updateMessExpense,
  deleteMessExpense,
} from "@/lib/firebase/firestore";
import {
  uploadExpenseReceipt,
  deleteExpenseReceipt,
} from "@/lib/firebase/storage";
import { roundCurrency } from "@/lib/calculations/meal-rate";
import type { ExpenseCategory, ExpenseType, MessExpense } from "@/types/expense";
import type { SharedSplitMode } from "@/types/mess";

export function useExpenses() {
  const { user } = useAuth();
  const {
    mess,
    members,
    currentMember,
    expenses,
    selectedMonthId,
    isMonthClosed,
    canManage,
    loading,
  } = useMess();

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of expenses) {
      map[exp.category] = roundCurrency((map[exp.category] ?? 0) + exp.amount);
    }
    return map;
  }, [expenses]);

  const buyerTotals = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    for (const exp of expenses) {
      const payerId = exp.paidBy || exp.createdBy;
      if (!payerId) continue;
      if (!map[payerId]) {
        map[payerId] = { name: exp.paidByName, total: 0, count: 0 };
      }
      map[payerId].total = roundCurrency(map[payerId].total + exp.amount);
      map[payerId].count += 1;
    }
    return map;
  }, [expenses]);

  const createExpense = useCallback(
    async (input: {
      date: string;
      category: ExpenseCategory;
      amount: number;
      paidBy?: string;
      expenseType: ExpenseType;
      splitMode?: SharedSplitMode;
      customShares?: Record<string, number>;
      description: string;
      receiptFile?: File | null;
    }): Promise<MessExpense> => {
      if (!mess || !user) {
        throw new Error("You are not a member of this mess.");
      }
      if (isMonthClosed) {
        throw new Error("This month is already closed.");
      }

      // Whoever adds the expense pays for this product
      const payerId = user.uid;
      const payerMember =
        currentMember || members.find((m) => m.uid === payerId);

      const expenseId = `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const monthId = input.date.slice(0, 7) || selectedMonthId;

      let receiptUrl: string | null = null;
      if (input.receiptFile) {
        receiptUrl = await uploadExpenseReceipt({
          file: input.receiptFile,
          messId: mess.id,
          monthId,
          expenseId,
        });
      }

      return addMessExpense({
        id: expenseId,
        messId: mess.id,
        monthId,
        date: input.date,
        category: input.category,
        amount: input.amount,
        paidBy: payerId,
        paidByName: payerMember?.name || user.name,
        expenseType: input.expenseType,
        splitMode: input.splitMode,
        customShares: input.customShares,
        description: input.description,
        receiptUrl,
        createdBy: user.uid,
        isMonthClosed,
      });
    },
    [mess, user, isMonthClosed, selectedMonthId, currentMember, members]
  );

  const editExpense = useCallback(
    async (
      expenseId: string,
      input: {
        date: string;
        category: ExpenseCategory;
        amount: number;
        paidBy: string;
        expenseType: ExpenseType;
        splitMode?: SharedSplitMode;
        customShares?: Record<string, number>;
        description: string;
        receiptFile?: File | null;
        existingReceiptUrl?: string | null;
      }
    ): Promise<void> => {
      if (!mess || !user) {
        throw new Error("You are not a member of this mess.");
      }
      if (!canManage && input.paidBy !== user.uid) {
        throw new Error("You don't have permission to perform this action.");
      }
      if (isMonthClosed) {
        throw new Error("This month is already closed.");
      }

      const monthId = input.date.slice(0, 7) || selectedMonthId;
      const buyer = members.find((m) => m.uid === input.paidBy);

      let receiptUrl = input.existingReceiptUrl ?? null;
      if (input.receiptFile) {
        receiptUrl = await uploadExpenseReceipt({
          file: input.receiptFile,
          messId: mess.id,
          monthId,
          expenseId,
        });
      }

      await updateMessExpense({
        expenseId,
        messId: mess.id,
        monthId,
        date: input.date,
        category: input.category,
        amount: input.amount,
        paidBy: input.paidBy,
        paidByName: buyer?.name || user.name,
        expenseType: input.expenseType,
        splitMode: input.splitMode,
        customShares: input.customShares,
        description: input.description,
        receiptUrl,
        isMonthClosed,
      });
    },
    [mess, user, canManage, isMonthClosed, selectedMonthId, members]
  );

  const removeExpense = useCallback(
    async (expense: MessExpense): Promise<void> => {
      if (!mess || !user) {
        throw new Error("You are not a member of this mess.");
      }
      if (
        !canManage &&
        expense.paidBy !== user.uid &&
        expense.createdBy !== user.uid
      ) {
        throw new Error("You don't have permission to perform this action.");
      }
      if (isMonthClosed) {
        throw new Error("This month is already closed.");
      }

      await deleteMessExpense({
        messId: mess.id,
        monthId: expense.monthId,
        expenseId: expense.id,
        isMonthClosed,
      });

      if (expense.receiptUrl) {
        await deleteExpenseReceipt({
          messId: mess.id,
          monthId: expense.monthId,
          expenseId: expense.id,
          receiptUrl: expense.receiptUrl,
        });
      }
    },
    [mess, user, canManage, isMonthClosed]
  );

  return {
    expenses,
    categoryTotals,
    buyerTotals,
    createExpense,
    editExpense,
    removeExpense,
    loading,
  };
}
