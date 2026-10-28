"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Utensils,
  Calendar,
  Copy,
  RotateCcw,
  Save,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
  Grid3X3,
  CalendarDays,
  Users,
  PlaneTakeoff,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMess } from "@/hooks/use-mess";
import { useMeals } from "@/hooks/use-meals";
import { saveDailyMealsBatch } from "@/lib/firebase/firestore";
import { calculateDailyMealTotal } from "@/lib/calculations/meal-rate";
import {
  formatMonthTitle,
  formatReadableDate,
  getTodayDateString,
} from "@/lib/utils";
import { getFriendlyErrorMessage } from "@/lib/utils/error-messages";
import type { MemberDailyMealInput } from "@/types/meal";
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
import { MealOffModal } from "@/components/meals/meal-off-modal";

/**
 * Generates all YYYY-MM-DD dates for a given YYYY-MM month string.
 */
function getDaysInMonthList(monthId: string): Array<{
  date: string;
  dayNumber: number;
  shortLabel: string;
  weekday: string;
}> {
  const match = /^(\d{4})-(\d{2})$/.exec(monthId);
  const year = match ? Number(match[1]) : new Date().getFullYear();
  const monthIndex = match ? Number(match[2]) - 1 : new Date().getMonth();

  const daysCount = new Date(year, monthIndex + 1, 0).getDate();
  const result = [];

  for (let day = 1; day <= daysCount; day++) {
    const d = new Date(year, monthIndex, day);
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const shortLabel = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    result.push({
      date: dateStr,
      dayNumber: day,
      shortLabel,
      weekday,
    });
  }

  return result;
}

export function DailyMealSheet() {
  const { user } = useAuth();
  const {
    mess,
    members,
    meals,
    canManage,
    isMonthClosed,
    selectedMonthId,
  } = useMess();

  const todayStr = getTodayDateString();
  const defaultDate = todayStr.startsWith(selectedMonthId)
    ? todayStr
    : `${selectedMonthId}-01`;

  const [viewMode, setViewMode] = useState<"khata" | "daily">("khata");
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [mealOffOpen, setMealOffOpen] = useState(false);

  const {
    dateMealsMap,
    saveMealsForDate,
    fetchPreviousDayEntries,
  } = useMeals(selectedDate);

  // --------------------------------------------------------------------------
  // 1. Single-Day State (0: Absent, 0.5: Half, 1: Present, 2: Guest+1, 3: Guest+2, etc.)
  // --------------------------------------------------------------------------
  const [dailyDraft, setDailyDraft] = useState<Record<string, number>>({});
  const [dailyDirty, setDailyDirty] = useState(false);

  // --------------------------------------------------------------------------
  // 2. Full-Month Khata Grid State: key = `${date}_${uid}` -> meal count
  // --------------------------------------------------------------------------
  const [khataDraft, setKhataDraft] = useState<Record<string, number>>({});
  const [dirtyDates, setDirtyDates] = useState<Set<string>>(new Set());

  const [saving, setSaving] = useState(false);
  const [copyingPrev, setCopyingPrev] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const monthDays = useMemo(
    () => getDaysInMonthList(selectedMonthId),
    [selectedMonthId]
  );

  // Sync Single-Day draft when date or Firestore meals change
  useEffect(() => {
    const next: Record<string, number> = {};
    for (const member of members) {
      const existing = dateMealsMap[member.uid];
      const total = existing ? calculateDailyMealTotal(existing) : 0;
      next[member.uid] = total;
    }
    setDailyDraft(next);
    setDailyDirty(false);
  }, [dateMealsMap, members, selectedDate]);

  // Sync Full-Month Khata grid when Firestore month meals change
  useEffect(() => {
    const nextGrid: Record<string, number> = {};
    for (const entry of meals) {
      const total = calculateDailyMealTotal(entry);
      nextGrid[`${entry.date}_${entry.userId}`] = total;
    }
    setKhataDraft(nextGrid);
    setDirtyDates(new Set());
  }, [meals, selectedMonthId]);

  const canEditMember = (memberUid: string) => {
    if (isMonthClosed) return false;
    if (canManage) return true;
    return Boolean(mess?.allowMemberMealEntry && user?.uid === memberUid);
  };

  // ==========================================================================
  // Single-Day View Handlers
  // ==========================================================================
  const setSingleDayMemberVal = (uid: string, value: number) => {
    if (!canEditMember(uid)) return;
    setSuccessMsg(null);
    setErrorMsg(null);
    setDailyDraft((prev) => ({ ...prev, [uid]: value }));
    setDailyDirty(true);
  };

  const handleMarkAllSingleDay = (status: number) => {
    if (isMonthClosed) return;
    setSuccessMsg(null);
    setDailyDraft((prev) => {
      const next = { ...prev };
      for (const m of members) {
        if (canEditMember(m.uid)) {
          next[m.uid] = status;
        }
      }
      return next;
    });
    setDailyDirty(true);
  };

  const handleCopyPreviousDay = async () => {
    if (isMonthClosed) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setCopyingPrev(true);
    try {
      const prevMap = await fetchPreviousDayEntries(selectedDate);
      if (Object.keys(prevMap).length === 0) {
        setErrorMsg("No attendance records found for the previous day to copy.");
        return;
      }
      setDailyDraft((prev) => {
        const next = { ...prev };
        for (const member of members) {
          if (canEditMember(member.uid) && prevMap[member.uid]) {
            const prevTotal = calculateDailyMealTotal(prevMap[member.uid]);
            next[member.uid] = prevTotal;
          }
        }
        return next;
      });
      setDailyDirty(true);
      setSuccessMsg(
        "Copied previous day's attendance. Click 'Save Attendance' to confirm."
      );
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setCopyingPrev(false);
    }
  };

  const handleSaveSingleDay = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const entries: MemberDailyMealInput[] = members
        .filter((m) => canEditMember(m.uid))
        .map((m) => {
          const val = dailyDraft[m.uid] ?? 0;
          return {
            userId: m.uid,
            memberName: m.name,
            breakfast: val,
            lunch: 0,
            dinner: 0,
          };
        });

      await saveMealsForDate(selectedDate, entries);
      setDailyDirty(false);
      setSuccessMsg(
        `Saved attendance and meals for ${formatReadableDate(selectedDate)}.`
      );
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================================
  // Full-Month Khata Grid Handlers
  // ==========================================================================
  const cycleKhataCell = (date: string, uid: string) => {
    if (!canEditMember(uid)) return;
    setSuccessMsg(null);
    setErrorMsg(null);
    const key = `${date}_${uid}`;
    setKhataDraft((prev) => {
      const current = prev[key] ?? 0;
      let nextVal = 0;
      // Cycle: 0 -> 1 -> 2 (Guest +1) -> 3 (Guest +2) -> 0
      // If half meal (0.5), cycle to 1
      if (current === 0) nextVal = 1;
      else if (current === 1) nextVal = 2;
      else if (current === 2) nextVal = 3;
      else if (current === 3) nextVal = 0;
      else if (current === 0.5) nextVal = 1;
      else nextVal = 0;
      return { ...prev, [key]: nextVal };
    });
    setDirtyDates((prev) => {
      const next = new Set(prev);
      next.add(date);
      return next;
    });
  };

  const setKhataRowAll = (date: string, status: number) => {
    if (isMonthClosed) return;
    setSuccessMsg(null);
    setErrorMsg(null);
    setKhataDraft((prev) => {
      const next = { ...prev };
      for (const m of members) {
        if (canEditMember(m.uid)) {
          next[`${date}_${m.uid}`] = status;
        }
      }
      return next;
    });
    setDirtyDates((prev) => {
      const next = new Set(prev);
      next.add(date);
      return next;
    });
  };

  const handleSaveKhataChanges = async () => {
    if (!mess || !user || dirtyDates.size === 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const datesToSave = Array.from(dirtyDates);
      for (const date of datesToSave) {
        const entries: MemberDailyMealInput[] = members
          .filter((m) => canEditMember(m.uid))
          .map((m) => {
            const val = khataDraft[`${date}_${m.uid}`] ?? 0;
            return {
              userId: m.uid,
              memberName: m.name,
              breakfast: val,
              lunch: 0,
              dinner: 0,
            };
          });

        await saveDailyMealsBatch({
          messId: mess.id,
          monthId: date.slice(0, 7) || selectedMonthId,
          date,
          entries,
          updatedBy: user.uid,
          isMonthClosed,
        });
      }
      setDirtyDates(new Set());
      setSuccessMsg(
        `Saved meal attendance for ${datesToSave.length} day(s) in ${formatMonthTitle(
          selectedMonthId
        )}.`
      );
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================================
  // Vacation / Range Meal Off Handler
  // ==========================================================================
  const handleApplyRange = async (
    targetUserId: string,
    dates: string[],
    targetValue: number
  ) => {
    if (!mess || !user || isMonthClosed) return;

    for (const date of dates) {
      const entries: MemberDailyMealInput[] = members
        .filter((m) => canEditMember(m.uid))
        .map((m) => {
          const val =
            m.uid === targetUserId
              ? targetValue
              : khataDraft[`${date}_${m.uid}`] ?? 0;
          return {
            userId: m.uid,
            memberName: m.name,
            breakfast: val,
            lunch: 0,
            dinner: 0,
          };
        });

      await saveDailyMealsBatch({
        messId: mess.id,
        monthId: date.slice(0, 7) || selectedMonthId,
        date,
        entries,
        updatedBy: user.uid,
        isMonthClosed,
      });
    }

    setKhataDraft((prev) => {
      const next = { ...prev };
      for (const d of dates) {
        next[`${d}_${targetUserId}`] = targetValue;
      }
      return next;
    });

    if (dates.includes(selectedDate)) {
      setDailyDraft((prev) => ({
        ...prev,
        [targetUserId]: targetValue,
      }));
    }

    setDirtyDates((prev) => {
      const next = new Set(prev);
      for (const d of dates) next.delete(d);
      return next;
    });

    const targetMember = members.find((m) => m.uid === targetUserId);
    setSuccessMsg(
      `Successfully set ${targetValue} meal(s) for ${targetMember?.name || "Member"} across ${dates.length} days.`
    );
  };

  // Compute live Khata totals per member and overall
  const khataMemberTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const m of members) {
      totals[m.uid] = 0;
    }
    for (const day of monthDays) {
      for (const m of members) {
        const val = khataDraft[`${day.date}_${m.uid}`] ?? 0;
        totals[m.uid] = (totals[m.uid] ?? 0) + val;
      }
    }
    return totals;
  }, [members, monthDays, khataDraft]);

  const khataGrandTotal = useMemo(() => {
    return Object.values(khataMemberTotals).reduce((a, b) => a + b, 0);
  }, [khataMemberTotals]);

  const singleDayTotal = useMemo(() => {
    return Object.values(dailyDraft).reduce<number>((sum, val) => sum + val, 0);
  }, [dailyDraft]);

  return (
    <div className="space-y-6">
      {/* View Switcher, Vacation Range Action, & Stats Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-100/80 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setViewMode("khata")}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  viewMode === "khata"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                Full-Month Khata Grid (1–{monthDays.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode("daily")}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  viewMode === "daily"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                Single-Day Quick View
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMealOffOpen(true)}
              disabled={isMonthClosed}
              className="border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-medium text-xs sm:text-sm"
            >
              <PlaneTakeoff className="h-4 w-4 text-emerald-600" />
              Vacation / Range Off (ছুটিতে মিল বন্ধ)
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" /> 0 Off
              <span className="mx-1 text-slate-300">•</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-400" /> ½ Half
              <span className="mx-1 text-slate-300">•</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" /> 1 Normal
              <span className="mx-1 text-slate-300">•</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500" /> 2 (G+1)
              <span className="mx-1 text-slate-300">•</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" /> 3 (G+2)
            </div>

            <Badge variant="info" className="px-3 py-1.5 text-xs font-bold">
              Month Total: {khataGrandTotal} Meals
            </Badge>
          </div>
        </CardContent>
      </Card>

      {isMonthClosed && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            This month is closed. Day-wise meal records are locked and cannot be
            modified unless an Owner or Admin reopens the month.
          </span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-800 dark:text-emerald-200"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
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

      {/* =====================================================================
          VIEW 1: FULL-MONTH DAY-WISE KHATA GRID (Day 1 to 30/31 × Members)
         ===================================================================== */}
      {viewMode === "khata" && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-emerald-600" />
                Day-Wise Mess Khata — {formatMonthTitle(selectedMonthId)}
              </CardTitle>
              <CardDescription>
                Tap any cell to cycle <strong>0 (Off)</strong> ➜ <strong>1 (Normal)</strong> ➜ <strong>2 (Guest +1)</strong> ➜ <strong>3 (Guest +2)</strong>, then click <strong>Save Changes</strong>.
              </CardDescription>
            </div>

            <Button
              onClick={handleSaveKhataChanges}
              disabled={dirtyDates.size === 0 || isMonthClosed || saving}
            >
              <Save className="h-4 w-4" />
              {saving
                ? "Saving..."
                : dirtyDates.size > 0
                ? `Save Changes (${dirtyDates.size} day${
                    dirtyDates.size > 1 ? "s" : ""
                  })`
                : "All Saved"}
            </Button>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <th className="py-3 px-3 font-semibold sticky left-0 bg-slate-100 dark:bg-slate-800 z-10 min-w-[110px]">
                      Date / Day
                    </th>
                    {members.map((m) => (
                      <th
                        key={m.uid}
                        className="py-3 px-2.5 text-center font-semibold min-w-[90px]"
                      >
                        <span className="block truncate max-w-[100px] mx-auto">
                          {m.name}
                        </span>
                        <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                          Total: {khataMemberTotals[m.uid] ?? 0}
                        </span>
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center font-semibold min-w-[70px]">
                      Day Total
                    </th>
                    {canManage && !isMonthClosed && (
                      <th className="py-3 px-3 text-right font-semibold min-w-[115px]">
                        Quick Row
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {monthDays.map((d) => {
                    const isToday = d.date === todayStr;
                    const isRowDirty = dirtyDates.has(d.date);
                    let rowTotal = 0;

                    return (
                      <tr
                        key={d.date}
                        className={
                          isToday
                            ? "bg-emerald-500/5"
                            : isRowDirty
                            ? "bg-amber-500/5"
                            : "hover:bg-slate-50/70 dark:hover:bg-slate-900/50"
                        }
                      >
                        <td className="py-2.5 px-3 font-medium sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {d.shortLabel}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {d.weekday}
                            </span>
                            {isToday && (
                              <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                                Today
                              </span>
                            )}
                          </div>
                        </td>

                        {members.map((m) => {
                          const val = khataDraft[`${d.date}_${m.uid}`] ?? 0;
                          rowTotal += val;
                          const editable = canEditMember(m.uid);

                          // Style based on meal value
                          let cellClass =
                            "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700";
                          if (val === 1) {
                            cellClass =
                              "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700";
                          } else if (val === 0.5) {
                            cellClass =
                              "bg-sky-500/15 border border-sky-400/40 text-sky-700 dark:text-sky-300 hover:bg-sky-500/25";
                          } else if (val === 2) {
                            cellClass =
                              "bg-purple-600 text-white shadow-2xs hover:bg-purple-700";
                          } else if (val === 3) {
                            cellClass =
                              "bg-amber-600 text-white shadow-2xs hover:bg-amber-700";
                          } else if (val > 3) {
                            cellClass =
                              "bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700";
                          }

                          return (
                            <td
                              key={m.uid}
                              className="py-2 px-2 text-center"
                            >
                              <button
                                type="button"
                                disabled={!editable}
                                onClick={() => cycleKhataCell(d.date, m.uid)}
                                aria-label={`${m.name} on ${d.shortLabel}: ${val} meal(s)`}
                                className={`inline-flex h-8 w-14 items-center justify-center gap-1 rounded-lg font-bold text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${cellClass}`}
                              >
                                {val === 1 && (
                                  <>
                                    <Check className="h-3.5 w-3.5" /> 1
                                  </>
                                )}
                                {val === 0.5 && <span>½</span>}
                                {val === 0 && <span>0</span>}
                                {val === 2 && (
                                  <span className="flex items-center gap-0.5 text-[11px]">
                                    2 <span className="text-[9px] opacity-90 font-normal">G+1</span>
                                  </span>
                                )}
                                {val === 3 && (
                                  <span className="flex items-center gap-0.5 text-[11px]">
                                    3 <span className="text-[9px] opacity-90 font-normal">G+2</span>
                                  </span>
                                )}
                                {val > 3 && <span>{val}</span>}
                              </button>
                            </td>
                          );
                        })}

                        <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                          {rowTotal}
                        </td>

                        {canManage && !isMonthClosed && (
                          <td className="py-2 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setKhataRowAll(d.date, 1)}
                                title="Mark all present (1)"
                                className="rounded px-2 py-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
                              >
                                All 1
                              </button>
                              <button
                                type="button"
                                onClick={() => setKhataRowAll(d.date, 0)}
                                title="Mark all absent (0)"
                                className="rounded px-2 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 cursor-pointer"
                              >
                                All 0
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>

                {/* Monthly Summary Footer Row */}
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 border-t-2 border-slate-200 dark:border-slate-700 font-bold">
                    <td className="py-3.5 px-3 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">
                      Month Total
                    </td>
                    {members.map((m) => (
                      <td
                        key={m.uid}
                        className="py-3.5 px-2 text-center text-emerald-600 dark:text-emerald-400 text-sm"
                      >
                        {khataMemberTotals[m.uid] ?? 0}
                      </td>
                    ))}
                    <td className="py-3.5 px-3 text-center text-base text-emerald-600 dark:text-emerald-400">
                      {khataGrandTotal}
                    </td>
                    {canManage && !isMonthClosed && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>

            {dirtyDates.size > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3.5">
                <span className="text-xs sm:text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  You have unsaved attendance changes for{" "}
                  <strong>{dirtyDates.size} day(s)</strong>.
                </span>
                <Button
                  size="sm"
                  onClick={handleSaveKhataChanges}
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Confirm & Save All"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* =====================================================================
          VIEW 2: SINGLE-DAY QUICK ATTENDANCE & GUEST MEAL VIEW
         ===================================================================== */}
      {viewMode === "daily" && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <div>
                  <label
                    htmlFor="meal-date-picker"
                    className="block text-xs font-medium text-slate-500"
                  >
                    Select Date
                  </label>
                  <Input
                    id="meal-date-picker"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(e.target.value);
                    }}
                    className="h-9 w-44 font-medium"
                  />
                </div>
              </div>
              <div className="pl-2 border-l border-slate-200 dark:border-slate-800">
                <CardTitle className="text-base">
                  {formatReadableDate(selectedDate)}
                </CardTitle>
                <CardDescription>
                  Day Meals: <strong>{singleDayTotal}</strong> across{" "}
                  {members.length} members
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPreviousDay}
                disabled={isMonthClosed || copyingPrev || saving}
              >
                <Copy className="h-3.5 w-3.5" />
                {copyingPrev ? "Copying..." : "Copy Previous Day"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleMarkAllSingleDay(1)}
                disabled={isMonthClosed || saving}
              >
                <Users className="h-3.5 w-3.5 text-emerald-600" />
                All Present (1)
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleMarkAllSingleDay(0)}
                disabled={isMonthClosed || saving}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                All Absent (0)
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSaveSingleDay}
                disabled={!dailyDirty || isMonthClosed || saving}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((member) => {
                const status = dailyDraft[member.uid] ?? 0;
                const editable = canEditMember(member.uid);

                return (
                  <div
                    key={member.uid}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Monthly Total:{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {khataMemberTotals[member.uid] ?? 0}
                        </strong>{" "}
                        meals this month
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {/* Absent 0 */}
                      <button
                        type="button"
                        disabled={!editable}
                        onClick={() => setSingleDayMemberVal(member.uid, 0)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                          status === 0
                            ? "bg-rose-600 text-white shadow-xs"
                            : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <X className="h-3.5 w-3.5" /> 0 Off
                      </button>

                      {/* Half 0.5 */}
                      <button
                        type="button"
                        disabled={!editable}
                        onClick={() => setSingleDayMemberVal(member.uid, 0.5)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                          status === 0.5
                            ? "bg-sky-600 text-white shadow-xs"
                            : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        ½ Half
                      </button>

                      {/* Present 1 */}
                      <button
                        type="button"
                        disabled={!editable}
                        onClick={() => setSingleDayMemberVal(member.uid, 1)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                          status === 1
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" /> 1 Normal
                      </button>

                      {/* Guest +1 (2) */}
                      <button
                        type="button"
                        disabled={!editable}
                        onClick={() => setSingleDayMemberVal(member.uid, 2)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                          status === 2
                            ? "bg-purple-600 text-white shadow-xs"
                            : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        2 (Guest +1)
                      </button>

                      {/* Guest +2 (3) */}
                      <button
                        type="button"
                        disabled={!editable}
                        onClick={() => setSingleDayMemberVal(member.uid, 3)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                          status === 3
                            ? "bg-amber-600 text-white shadow-xs"
                            : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        3 (Guest +2)
                      </button>

                      {/* Fallback if value is greater than 3 */}
                      {status > 3 && (
                        <span className="rounded-lg bg-indigo-600 text-white px-2.5 py-1.5 text-xs font-extrabold shadow-xs">
                          {status} Meals
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {dailyDirty && (
              <div className="mt-5 flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3.5">
                <span className="text-xs sm:text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Unsaved changes for{" "}
                  <strong>{formatReadableDate(selectedDate)}</strong>.
                </span>
                <Button
                  size="sm"
                  onClick={handleSaveSingleDay}
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Confirm & Save"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Member Monthly Day Totals Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Utensils className="h-4 w-4 text-emerald-600" />
            Monthly Meal Counts Summary ({formatMonthTitle(selectedMonthId)})
          </CardTitle>
          <CardDescription>
            Total accumulated meals for each member this month (including fractional and guest meals).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map((member) => {
              const totalMeals = khataMemberTotals[member.uid] ?? 0;
              return (
                <div
                  key={member.uid}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                      {member.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Accumulated: {totalMeals} meals
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {totalMeals}
                    </span>
                    <span className="block text-[10px] uppercase text-slate-400">
                      Meals
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Vacation / Date-Range Meal Off Modal */}
      <MealOffModal
        open={mealOffOpen}
        onClose={() => setMealOffOpen(false)}
        members={members}
        canManage={canManage}
        currentUserId={user?.uid || ""}
        selectedMonthId={selectedMonthId}
        onApplyRange={handleApplyRange}
      />
    </div>
  );
}
