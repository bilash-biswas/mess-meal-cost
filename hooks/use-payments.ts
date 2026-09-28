"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "./use-auth";
import { useMess } from "./use-mess";
import {
  addMessPayment,
  updateMessPayment,
  deleteMessPayment,
} from "@/lib/firebase/firestore";
import { roundCurrency } from "@/lib/calculations/meal-rate";
import type { MessPayment, PaymentMethod } from "@/types/payment";

export function usePayments() {
  const { user } = useAuth();
  const {
    mess,
    members,
    payments,
    selectedMonthId,
    isMonthClosed,
    canManage,
    loading,
  } = useMess();

  const memberPaymentTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const member of members) {
      map[member.uid] = 0;
    }
    for (const pay of payments) {
      map[pay.userId] = roundCurrency((map[pay.userId] ?? 0) + pay.amount);
    }
    return map;
  }, [members, payments]);

  const createPayment = useCallback(
    async (input: {
      date: string;
      userId: string;
      amount: number;
      method: PaymentMethod;
      note: string;
    }): Promise<MessPayment> => {
      if (!mess || !user) {
        throw new Error("You are not a member of this mess.");
      }
      if (!canManage) {
        throw new Error("You don't have permission to perform this action.");
      }
      if (isMonthClosed) {
        throw new Error("This month is already closed.");
      }

      const monthId = input.date.slice(0, 7) || selectedMonthId;
      const member = members.find((m) => m.uid === input.userId);

      return addMessPayment({
        messId: mess.id,
        monthId,
        date: input.date,
        userId: input.userId,
        memberName: member?.name || "Member",
        amount: input.amount,
        method: input.method,
        note: input.note,
        createdBy: user.uid,
        isMonthClosed,
      });
    },
    [mess, user, canManage, isMonthClosed, selectedMonthId, members]
  );

  const editPayment = useCallback(
    async (
      paymentId: string,
      input: {
        date: string;
        userId: string;
        amount: number;
        method: PaymentMethod;
        note: string;
      }
    ): Promise<void> => {
      if (!mess || !user) {
        throw new Error("You are not a member of this mess.");
      }
      if (!canManage) {
        throw new Error("You don't have permission to perform this action.");
      }
      if (isMonthClosed) {
        throw new Error("This month is already closed.");
      }

      const monthId = input.date.slice(0, 7) || selectedMonthId;
      const member = members.find((m) => m.uid === input.userId);

      await updateMessPayment({
        paymentId,
        messId: mess.id,
        monthId,
        date: input.date,
        userId: input.userId,
        memberName: member?.name || "Member",
        amount: input.amount,
        method: input.method,
        note: input.note,
        isMonthClosed,
      });
    },
    [mess, user, canManage, isMonthClosed, selectedMonthId, members]
  );

  const removePayment = useCallback(
    async (payment: MessPayment): Promise<void> => {
      if (!mess || !user) {
        throw new Error("You are not a member of this mess.");
      }
      if (!canManage) {
        throw new Error("You don't have permission to perform this action.");
      }
      if (isMonthClosed) {
        throw new Error("This month is already closed.");
      }

      await deleteMessPayment({
        messId: mess.id,
        monthId: payment.monthId,
        paymentId: payment.id,
        isMonthClosed,
      });
    },
    [mess, user, canManage, isMonthClosed]
  );

  return {
    payments,
    memberPaymentTotals,
    createPayment,
    editPayment,
    removePayment,
    loading,
  };
}
