export interface DailyMealEntry {
  id: string; // Format: "${date}_${userId}" e.g. "2026-09-26_user123"
  messId: string;
  monthId: string; // Format: "YYYY-MM"
  date: string; // Format: "YYYY-MM-DD"
  userId: string;
  memberName: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
  updatedBy: string;
  updatedAt: string;
}

export interface MemberDailyMealInput {
  userId: string;
  memberName: string;
  breakfast: number;
  lunch: number;
  dinner: number;
}
