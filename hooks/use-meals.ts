"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "./use-auth";
import { useMess } from "./use-mess";
import { saveDailyMealsBatch, getMealsForDate } from "@/lib/firebase/firestore";
import { calculateDailyMealTotal, roundCurrency } from "@/lib/calculations/meal-rate";
import { getPreviousDateString, getTodayDateString } from "@/lib/utils";
import type { MemberDailyMealInput } from "@/types/meal";

export function useMeals(selectedDate?: string) {
  const { user } = useAuth();
  const {
    mess,
    members,
    meals,
    selectedMonthId,
    isMonthClosed,
    canManage,
    loading,
  } = useMess();

  const targetDate = selectedDate || getTodayDateString();

  // Map of userId -> meal entry for `targetDate`
  const dateMealsMap = useMemo(() => {
    const map: Record<string, MemberDailyMealInput & { total: number }> = {};
    for (const member of members) {
      map[member.uid] = {
        userId: member.uid,
        memberName: member.name,
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        total: 0,
      };
    }
    for (const entry of meals) {
      if (entry.date === targetDate) {
        map[entry.userId] = {
          userId: entry.userId,
          memberName: entry.memberName,
          breakfast: entry.breakfast,
          lunch: entry.lunch,
          dinner: entry.dinner,
          total: calculateDailyMealTotal(entry),
        };
      }
    }
    return map;
  }, [members, meals, targetDate]);

  const dateTotalMeals = useMemo(() => {
    return roundCurrency(
      Object.values(dateMealsMap).reduce((sum, item) => sum + item.total, 0)
    );
  }, [dateMealsMap]);

  // Per-member monthly total meals
  const monthlyMemberMealTotals = useMemo(() => {
    const totals: Record<
      string,
      { breakfast: number; lunch: number; dinner: number; total: number }
    > = {};
    for (const member of members) {
      totals[member.uid] = { breakfast: 0, lunch: 0, dinner: 0, total: 0 };
    }
    for (const entry of meals) {
      if (!totals[entry.userId]) {
        totals[entry.userId] = { breakfast: 0, lunch: 0, dinner: 0, total: 0 };
      }
      totals[entry.userId].breakfast = roundCurrency(
        totals[entry.userId].breakfast + entry.breakfast
      );
      totals[entry.userId].lunch = roundCurrency(
        totals[entry.userId].lunch + entry.lunch
      );
      totals[entry.userId].dinner = roundCurrency(
        totals[entry.userId].dinner + entry.dinner
      );
      totals[entry.userId].total = roundCurrency(
        totals[entry.userId].total + calculateDailyMealTotal(entry)
      );
    }
    return totals;
  }, [members, meals]);

  const saveMealsForDate = useCallback(
    async (date: string, entries: MemberDailyMealInput[]) => {
      if (!mess || !user) {
        throw new Error("You are not a member of this mess.");
      }
      if (isMonthClosed) {
        throw new Error("This month is already closed.");
      }
      if (!canManage && !mess.allowMemberMealEntry) {
        throw new Error("You don't have permission to perform this action.");
      }

      const monthId = date.slice(0, 7) || selectedMonthId;
      await saveDailyMealsBatch({
        messId: mess.id,
        monthId,
        date,
        entries,
        updatedBy: user.uid,
        isMonthClosed,
      });
    },
    [mess, user, isMonthClosed, canManage, selectedMonthId]
  );

  const fetchPreviousDayEntries = useCallback(
    async (currentDate: string): Promise<Record<string, MemberDailyMealInput>> => {
      if (!mess) return {};
      const prevDate = getPreviousDateString(currentDate);
      const prevEntries = await getMealsForDate(mess.id, prevDate);
      const result: Record<string, MemberDailyMealInput> = {};
      for (const item of prevEntries) {
        result[item.userId] = {
          userId: item.userId,
          memberName: item.memberName,
          breakfast: item.breakfast,
          lunch: item.lunch,
          dinner: item.dinner,
        };
      }
      return result;
    },
    [mess]
  );

  return {
    meals,
    dateMealsMap,
    dateTotalMeals,
    monthlyMemberMealTotals,
    saveMealsForDate,
    fetchPreviousDayEntries,
    defaultMealConfig: mess?.defaultMealConfig || {
      breakfast: 1,
      lunch: 1,
      dinner: 1,
    },
    loading,
  };
}
