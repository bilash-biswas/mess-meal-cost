import type { SharedSplitMode } from "./mess";

export type MonthStatus = "open" | "closed";

export interface MemberMonthlySnapshot {
  userId: string;
  memberName: string;
  meals: number;
  mealCost: number;
  sharedExpenseShare: number;
  customExpenseShare: number;
  totalCost: number;
  totalPaid: number;
  balance: number;
  balanceStatus: "due" | "receivable" | "settled";
}

export interface MonthClosedSnapshot {
  totalMealExpense: number;
  totalOtherExpense: number;
  totalExpense: number;
  totalMeals: number;
  mealRate: number;
  totalPayments: number;
  memberSummaries: MemberMonthlySnapshot[];
}

export interface MessMonth {
  id: string; // Format: "YYYY-MM", e.g., "2026-09"
  messId: string;
  title: string; // e.g., "September 2026"
  status: MonthStatus;
  sharedSplitMode: SharedSplitMode;
  /**
   * Optional map of userId -> fixed custom amount for shared ("other") expenses
   * in this specific month when sharedSplitMode === "custom".
   */
  customSharedShares?: Record<string, number>;
  /**
   * Frozen financial snapshot recorded when the month is closed so historical
   * calculations are never silently altered.
   */
  snapshot?: MonthClosedSnapshot | null;
  closedAt?: string | null;
  closedBy?: string | null;
  closedByName?: string | null;
  reopenedAt?: string | null;
  reopenedBy?: string | null;
  reopenedByName?: string | null;
  createdAt: string;
  updatedAt: string;
}
