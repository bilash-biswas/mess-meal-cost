import type { SharedSplitMode } from "./mess";

export type ExpenseType = "meal" | "other";

export type ExpenseCategoryGroup = "food" | "utilities" | "household" | "other";

export type ExpenseCategory =
  // Food
  | "rice"
  | "dal"
  | "oil"
  | "fish"
  | "meat"
  | "chicken"
  | "egg"
  | "vegetables"
  | "potato"
  | "spices"
  | "fruits"
  | "other_food"
  // Utilities
  | "electricity"
  | "gas"
  | "water"
  | "internet"
  // Household
  | "cleaning"
  | "maid"
  | "household_supplies"
  // Other
  | "other";

export interface ExpenseCategoryMeta {
  value: ExpenseCategory;
  label: string;
  bengaliHint: string;
  group: ExpenseCategoryGroup;
  defaultExpenseType: ExpenseType;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryMeta[] = [
  // Food (বাজার / খাবার)
  { value: "rice", label: "Rice", bengaliHint: "চাল", group: "food", defaultExpenseType: "meal" },
  { value: "dal", label: "Dal / Lentils", bengaliHint: "ডাল", group: "food", defaultExpenseType: "meal" },
  { value: "oil", label: "Cooking Oil", bengaliHint: "তেল", group: "food", defaultExpenseType: "meal" },
  { value: "fish", label: "Fish", bengaliHint: "মাছ", group: "food", defaultExpenseType: "meal" },
  { value: "meat", label: "Meat (Beef/Mutton)", bengaliHint: "মাংস", group: "food", defaultExpenseType: "meal" },
  { value: "chicken", label: "Chicken", bengaliHint: "মুরগি", group: "food", defaultExpenseType: "meal" },
  { value: "egg", label: "Egg", bengaliHint: "ডিম", group: "food", defaultExpenseType: "meal" },
  { value: "vegetables", label: "Vegetables", bengaliHint: "সবজি", group: "food", defaultExpenseType: "meal" },
  { value: "potato", label: "Potato", bengaliHint: "আলু", group: "food", defaultExpenseType: "meal" },
  { value: "spices", label: "Spices & Onion/Garlic", bengaliHint: "মসলা ও পেঁয়াজ", group: "food", defaultExpenseType: "meal" },
  { value: "fruits", label: "Fruits", bengaliHint: "ফল", group: "food", defaultExpenseType: "meal" },
  { value: "other_food", label: "Other Food", bengaliHint: "অন্যান্য বাজার", group: "food", defaultExpenseType: "meal" },

  // Utilities (বিল)
  { value: "electricity", label: "Electricity", bengaliHint: "বিদ্যুৎ বিল", group: "utilities", defaultExpenseType: "other" },
  { value: "gas", label: "Gas", bengaliHint: "গ্যাস বিল", group: "utilities", defaultExpenseType: "other" },
  { value: "water", label: "Water", bengaliHint: "পানি বিল", group: "utilities", defaultExpenseType: "other" },
  { value: "internet", label: "Internet / Wi-Fi", bengaliHint: "ওয়াইফাই বিল", group: "utilities", defaultExpenseType: "other" },

  // Household (বাসা ও খালা)
  { value: "cleaning", label: "Cleaning", bengaliHint: "পরিষ্কার-পরিচ্ছন্নতা", group: "household", defaultExpenseType: "other" },
  { value: "maid", label: "Maid / Cook (Khala)", bengaliHint: "বুয়া / খালা বিল", group: "household", defaultExpenseType: "other" },
  { value: "household_supplies", label: "Household Supplies", bengaliHint: "মেসের জিনিসপত্র", group: "household", defaultExpenseType: "other" },

  // Other
  { value: "other", label: "Other", bengaliHint: "অন্যান্য খরচ", group: "other", defaultExpenseType: "other" },
];

export interface MessExpense {
  id: string;
  messId: string;
  monthId: string; // "YYYY-MM"
  date: string; // "YYYY-MM-DD"
  category: ExpenseCategory;
  amount: number;
  paidBy: string; // userId
  paidByName: string;
  expenseType: ExpenseType; // "meal" | "other"
  /**
   * For "other" shared expenses, allows either equal split across active members
   * or custom per-member exact share overrides for this specific expense.
   */
  splitMode?: SharedSplitMode;
  customShares?: Record<string, number>;
  description: string;
  receiptUrl?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
