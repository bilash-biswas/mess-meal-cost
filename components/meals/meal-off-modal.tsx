"use client";

import React, { useState } from "react";
import { Calendar, User, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { MessMember } from "@/types/mess";

interface MealOffModalProps {
  open: boolean;
  onClose: () => void;
  members: MessMember[];
  canManage: boolean;
  currentUserId: string;
  selectedMonthId: string;
  onApplyRange: (
    targetUserId: string,
    dates: string[],
    targetValue: number
  ) => Promise<void>;
}

export function MealOffModal({
  open,
  onClose,
  members,
  canManage,
  currentUserId,
  selectedMonthId,
  onApplyRange,
}: MealOffModalProps) {
  const [selectedUid, setSelectedUid] = useState(currentUserId);
  const [startDate, setStartDate] = useState(`${selectedMonthId}-01`);
  const [endDate, setEndDate] = useState(`${selectedMonthId}-05`);
  const [mealValue, setMealValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const calculateDatesInRange = (): string[] => {
    if (!startDate || !endDate || startDate > endDate) return [];
    const dates: string[] = [];
    const curr = new Date(startDate);
    const end = new Date(endDate);

    while (curr <= end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, "0");
      const d = String(curr.getDate()).padStart(2, "0");
      const str = `${y}-${m}-${d}`;
      if (str.startsWith(selectedMonthId)) {
        dates.push(str);
      }
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const datesToChange = calculateDatesInRange();

  const handleApply = async () => {
    setErrorMsg(null);
    if (datesToChange.length === 0) {
      setErrorMsg("Please select a valid date range within the selected month.");
      return;
    }
    setLoading(true);
    try {
      await onApplyRange(selectedUid, datesToChange, mealValue);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to update meals for date range."
      );
    } finally {
      setLoading(false);
    }
  };

  const targetMemberName =
    members.find((m) => m.uid === selectedUid)?.name || "Member";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vacation / Date-Range Meal Off (ছুটিতে মিল বন্ধ)"
      description="Turn off meals or apply meal attendance across multiple dates in one click (e.g. going home for holidays)."
    >
      <div className="space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-700 dark:text-rose-300"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Member Selector */}
        <div className="space-y-1.5">
          <Label htmlFor="range-member">Select Member (মেম্বার)</Label>
          {canManage ? (
            <select
              id="range-member"
              value={selectedUid}
              onChange={(e) => setSelectedUid(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            >
              {members.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.name} {m.uid === currentUserId ? "(You)" : ""}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-semibold">
              <User className="h-4 w-4 text-emerald-600" />
              <span>{targetMemberName} (You)</span>
            </div>
          )}
        </div>

        {/* Date Range Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="range-start">From Date (শুরুর তারিখ)</Label>
            <Input
              id="range-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="range-end">To Date (শেষের তারিখ)</Label>
            <Input
              id="range-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Action Type */}
        <div className="space-y-1.5">
          <Label>Action for Selected Dates</Label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMealValue(0)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer text-center ${
                mealValue === 0
                  ? "border-rose-600 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <span className="block">Absent (0)</span>
              <span className="text-[10px] font-normal opacity-80">
                ছুটি / মিল বন্ধ
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMealValue(1)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer text-center ${
                mealValue === 1
                  ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <span className="block">Present (1)</span>
              <span className="text-[10px] font-normal opacity-80">
                নিয়মিত মিল চালু
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMealValue(0.5)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer text-center ${
                mealValue === 0.5
                  ? "border-sky-600 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <span className="block">Half (0.5)</span>
              <span className="text-[10px] font-normal opacity-80">
                শুধু ১ বেলা
              </span>
            </button>
          </div>
        </div>

        {/* Range Preview Badge */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <span className="text-slate-600 dark:text-slate-300">
              Total Days Affected:
            </span>
          </div>
          <Badge variant="info">
            {datesToChange.length} Day(s) in {selectedMonthId}
          </Badge>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={datesToChange.length === 0 || loading}
          >
            {loading ? "Applying..." : `Apply to ${datesToChange.length} Days`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
