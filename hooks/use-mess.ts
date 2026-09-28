"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "./use-auth";
import {
  subscribeToMessAndMembers,
  subscribeToMonthMeals,
  subscribeToMonthExpenses,
  subscribeToMonthPayments,
  ensureMonthExists,
} from "@/lib/firebase/firestore";
import { getCurrentMonthId } from "@/lib/utils";
import {
  isOwner as checkIsOwner,
  isAdmin as checkIsAdmin,
  canManage as checkCanManage,
} from "@/lib/firebase/permissions";
import {
  calculateMonthlyAccounting,
  type MonthlyAccountingSummary,
} from "@/lib/calculations/member-balance";
import {
  calculateSettlement,
  type SettlementTransfer,
} from "@/lib/calculations/settlement";
import type { Mess, MessMember, MessRole } from "@/types/mess";
import type { MessMonth } from "@/types/month";
import type { DailyMealEntry } from "@/types/meal";
import type { MessExpense } from "@/types/expense";
import type { MessPayment } from "@/types/payment";

interface MessContextValue {
  mess: Mess | null;
  members: MessMember[];
  currentMember: MessMember | null;
  role: MessRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  canManage: boolean;
  selectedMonthId: string;
  setSelectedMonthId: (monthId: string) => void;
  monthDoc: MessMonth | null;
  isMonthClosed: boolean;
  meals: DailyMealEntry[];
  expenses: MessExpense[];
  payments: MessPayment[];
  accounting: MonthlyAccountingSummary;
  settlements: SettlementTransfer[];
  loading: boolean;
}

const MessContext = createContext<MessContextValue | undefined>(undefined);

export function MessProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [mess, setMess] = useState<Mess | null>(null);
  const [members, setMembers] = useState<MessMember[]>([]);
  const [selectedMonthId, setSelectedMonthIdState] = useState<string>(
    getCurrentMonthId()
  );
  const [monthDoc, setMonthDoc] = useState<MessMonth | null>(null);
  const [meals, setMeals] = useState<DailyMealEntry[]>([]);
  const [expenses, setExpenses] = useState<MessExpense[]>([]);
  const [payments, setPayments] = useState<MessPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const activeMessId = user?.activeMessId || null;

  useEffect(() => {
    if (authLoading) return;
    if (!activeMessId) {
      setMess(null);
      setMembers([]);
      setMonthDoc(null);
      setMeals([]);
      setExpenses([]);
      setPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToMessAndMembers(
      activeMessId,
      {
        onMess: (m) => {
          setMess(m);
          setLoading(false);
        },
        onMembers: (list) => setMembers(list),
        onMonth: (mo) => setMonthDoc(mo),
      },
      selectedMonthId
    );

    return () => unsub();
  }, [activeMessId, selectedMonthId, authLoading]);

  // Subscribe to current selected month's meals, expenses, and payments
  useEffect(() => {
    if (!activeMessId || !selectedMonthId) return;

    const unsubMeals = subscribeToMonthMeals(
      activeMessId,
      selectedMonthId,
      setMeals
    );
    const unsubExpenses = subscribeToMonthExpenses(
      activeMessId,
      selectedMonthId,
      setExpenses
    );
    const unsubPayments = subscribeToMonthPayments(
      activeMessId,
      selectedMonthId,
      setPayments
    );

    return () => {
      unsubMeals();
      unsubExpenses();
      unsubPayments();
    };
  }, [activeMessId, selectedMonthId]);

  const setSelectedMonthId = useCallback(
    async (nextMonthId: string) => {
      setSelectedMonthIdState(nextMonthId);
      if (activeMessId) {
        await ensureMonthExists(
          activeMessId,
          nextMonthId,
          mess?.sharedExpenseSplitMode || "equal"
        );
      }
    },
    [activeMessId, mess?.sharedExpenseSplitMode]
  );

  const currentMember = useMemo(() => {
    if (!user) return null;
    return members.find((m) => m.uid === user.uid) || null;
  }, [members, user]);

  const role: MessRole | null = currentMember?.role ?? null;

  const permissionCtx = useMemo(
    () => ({
      authUid: user?.uid,
      userMessId: activeMessId,
      targetMessId: mess?.id || activeMessId || "",
      role,
      monthStatus: monthDoc?.status || "open",
      allowMemberMealEntry: mess?.allowMemberMealEntry ?? true,
    }),
    [user?.uid, activeMessId, mess?.id, mess?.allowMemberMealEntry, role, monthDoc?.status]
  );

  const isOwner = checkIsOwner(permissionCtx);
  const isAdmin = checkIsAdmin(permissionCtx);
  const canManage = checkCanManage(permissionCtx);
  const isMonthClosed = monthDoc?.status === "closed";

  const accounting = useMemo(() => {
    return calculateMonthlyAccounting({
      members: members.map((m) => ({
        uid: m.uid,
        name: m.name,
        isActive: m.isActive,
      })),
      meals,
      expenses,
      payments,
      monthSplitMode:
        monthDoc?.sharedSplitMode || mess?.sharedExpenseSplitMode || "equal",
      monthCustomShares: monthDoc?.customSharedShares,
    });
  }, [members, meals, expenses, payments, monthDoc, mess?.sharedExpenseSplitMode]);

  const settlements = useMemo(() => {
    return calculateSettlement(
      accounting.memberBalances.map((b) => ({
        userId: b.userId,
        memberName: b.memberName,
        balance: b.balance,
      }))
    );
  }, [accounting.memberBalances]);

  return React.createElement(
    MessContext.Provider,
    {
      value: {
        mess,
        members,
        currentMember,
        role,
        isOwner,
        isAdmin,
        canManage,
        selectedMonthId,
        setSelectedMonthId,
        monthDoc,
        isMonthClosed,
        meals,
        expenses,
        payments,
        accounting,
        settlements,
        loading,
      },
    },
    children
  );
}

export function useMess(): MessContextValue {
  const ctx = useContext(MessContext);
  if (!ctx) {
    throw new Error("useMess must be used within a MessProvider.");
  }
  return ctx;
}
