export type MessRole = "owner" | "admin" | "member";

export type SharedSplitMode = "equal" | "custom";

export interface MealConfig {
  breakfast: number;
  lunch: number;
  dinner: number;
}

export interface Mess {
  id: string;
  name: string;
  address: string;
  description: string;
  ownerId: string;
  inviteCode: string;
  monthStartDay: number;
  activeMonthId: string; // YYYY-MM e.g. "2026-09"
  defaultMealConfig: MealConfig;
  sharedExpenseSplitMode: SharedSplitMode;
  allowMemberMealEntry: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessMember {
  uid: string;
  messId: string;
  name: string;
  email: string;
  photoURL?: string;
  role: MessRole;
  isActive: boolean;
  /**
   * Optional custom fixed share or percentage weight for shared expenses
   * when the mess or month uses "custom" split mode.
   */
  customSharedAmount?: number;
  joinedAt: string;
  updatedAt?: string;
}

export interface MessInvitationPreview {
  messId: string;
  name: string;
  address: string;
  description: string;
  inviteCode: string;
  memberCount: number;
  ownerId: string;
}
