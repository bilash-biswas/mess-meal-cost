import {
  calculateDailyMealTotal,
  calculateExactMealRate,
  calculateMealRate,
  calculateMemberMealCost,
  roundCurrency,
} from "./meal-rate";
import type { SharedSplitMode } from "@/types/mess";

export type BalanceStatus = "due" | "receivable" | "settled";

export interface SharedExpenseInput {
  totalOtherExpense: number;
  activeMemberCount: number;
  splitMode?: SharedSplitMode;
  memberId?: string;
  customShares?: Record<string, number>;
}

export interface MemberBalanceInput {
  userId?: string;
  memberName?: string;
  memberMeals: number;
  mealRate: number;
  sharedExpenseShare: number;
  customExpenses?: number;
  totalPayments: number;
  expensePaid?: number;
  depositPaid?: number;
}

export interface MemberBalanceResult {
  userId: string;
  memberName: string;
  meals: number;
  mealCost: number;
  sharedExpenseShare: number;
  customExpenseShare: number;
  totalCost: number;
  /** Amount paid by purchasing bazar/shared products (who added the expense) */
  expensePaid: number;
  /** Amount paid via direct cash/mobile banking deposits */
  depositPaid: number;
  /** Total Paid = expensePaid + depositPaid */
  totalPaid: number;
  /**
   * Balance = Total Member Cost - Total Payments
   * - Positive (> 0) => Due (member owes money to the mess)
   * - Negative (< 0) => Receivable (member should receive money back)
   * - Zero (0)       => Settled
   */
  balance: number;
  /**
   * Absolute amount of balance for convenient display alongside status badge.
   */
  absoluteBalance: number;
  status: BalanceStatus;
}

/**
 * Calculates a member's share of non-meal Shared Expenses ("other" expenses).
 * Supports:
 * 1. Equal Split: totalOtherExpense / activeMemberCount
 * 2. Custom Split: explicit share from `customShares[memberId]`
 */
export function calculateSharedExpense(input: SharedExpenseInput): number {
  const {
    totalOtherExpense,
    activeMemberCount,
    splitMode = "equal",
    memberId,
    customShares,
  } = input;

  if (!Number.isFinite(totalOtherExpense) || totalOtherExpense <= 0) {
    return 0;
  }

  if (splitMode === "custom" && memberId && customShares && memberId in customShares) {
    const customVal = customShares[memberId];
    return Number.isFinite(customVal) && customVal >= 0 ? roundCurrency(customVal) : 0;
  }

  if (!Number.isFinite(activeMemberCount) || activeMemberCount <= 0) {
    return 0;
  }

  return roundCurrency(totalOtherExpense / activeMemberCount);
}

/**
 * Calculates a single member's total cost, balance, and due/receivable/settled status.
 *
 * Formula:
 *   Total Member Cost = Meal Cost + Shared Expense Share + Custom Expenses
 *   Balance = Total Member Cost - Total Payments
 *   If Balance > 0  -> "due"
 *   If Balance < 0  -> "receivable"
 *   If Balance == 0 -> "settled"
 */
export function calculateMemberBalance(input: MemberBalanceInput): MemberBalanceResult {
  const meals = roundCurrency(Math.max(0, input.memberMeals || 0));
  const mealCost = calculateMemberMealCost(meals, input.mealRate);
  const sharedExpenseShare = roundCurrency(Math.max(0, input.sharedExpenseShare || 0));
  const customExpenseShare = roundCurrency(Math.max(0, input.customExpenses || 0));

  const totalCost = roundCurrency(mealCost + sharedExpenseShare + customExpenseShare);
  const totalPaid = roundCurrency(Math.max(0, input.totalPayments || 0));
  const expensePaid = roundCurrency(Math.max(0, input.expensePaid || 0));
  const depositPaid = roundCurrency(
    input.depositPaid !== undefined ? Math.max(0, input.depositPaid) : Math.max(0, totalPaid - expensePaid)
  );

  const rawBalance = roundCurrency(totalCost - totalPaid);

  let status: BalanceStatus = "settled";
  let normalizedBalance = 0;

  if (rawBalance > 0.009) {
    status = "due";
    normalizedBalance = rawBalance;
  } else if (rawBalance < -0.009) {
    status = "receivable";
    normalizedBalance = rawBalance;
  }

  return {
    userId: input.userId ?? "",
    memberName: input.memberName ?? "",
    meals,
    mealCost,
    sharedExpenseShare,
    customExpenseShare,
    totalCost,
    expensePaid,
    depositPaid,
    totalPaid,
    balance: normalizedBalance,
    absoluteBalance: Math.abs(normalizedBalance),
    status,
  };
}

export interface MonthlyAccountingInput {
  members: Array<{
    uid: string;
    name: string;
    isActive?: boolean;
  }>;
  meals: Array<{
    userId: string;
    breakfast: number;
    lunch: number;
    dinner: number;
  }>;
  expenses: Array<{
    amount: number;
    expenseType: "meal" | "other";
    paidBy?: string;
    createdBy?: string;
    splitMode?: SharedSplitMode;
    customShares?: Record<string, number>;
  }>;
  payments: Array<{
    userId: string;
    amount: number;
  }>;
  monthSplitMode?: SharedSplitMode;
  monthCustomShares?: Record<string, number>;
}

export interface MonthlyAccountingSummary {
  totalMealExpense: number;
  totalOtherExpense: number;
  totalExpense: number;
  totalMeals: number;
  mealRate: number;
  exactMealRate: number;
  totalExpensePaid: number;
  totalDirectPayments: number;
  totalPayments: number;
  totalDue: number;
  totalReceivable: number;
  memberBalances: MemberBalanceResult[];
}

/**
 * Pure aggregator that computes the entire monthly accounting summary for a mess:
 * - Total Meal Expense, Total Other Shared Expense, Total Expense
 * - Total Meals & Current Meal Rate
 * - Per-member Meals, Meal Cost, Shared Expense Share, Custom Share, Paid (Expense Paid + Direct Deposits), and Balance
 */
export function calculateMonthlyAccounting(
  input: MonthlyAccountingInput
): MonthlyAccountingSummary {
  const activeMembers = input.members.filter((m) => m.isActive !== false);
  const memberCount = activeMembers.length || 1;

  // 1. Sum meal expenses vs other shared expenses, and credit whoever paid for each expense
  let totalMealExpense = 0;
  let totalEqualOtherExpense = 0;
  let totalCustomOtherExpense = 0;
  let totalExpensePaid = 0;
  const perExpenseCustomMap: Record<string, number> = {};
  const memberExpensePaidMap: Record<string, number> = {};

  for (const exp of input.expenses) {
    const amt = Number.isFinite(exp.amount) && exp.amount > 0 ? exp.amount : 0;
    if (exp.expenseType === "meal") {
      totalMealExpense += amt;
    } else {
      if (exp.splitMode === "custom" && exp.customShares) {
        totalCustomOtherExpense += amt;
        for (const [uid, share] of Object.entries(exp.customShares)) {
          if (Number.isFinite(share) && share > 0) {
            perExpenseCustomMap[uid] = (perExpenseCustomMap[uid] ?? 0) + share;
          }
        }
      } else {
        totalEqualOtherExpense += amt;
      }
    }

    // Whoever added/paid for this expense gets credited with paying for this product
    const payerId = exp.paidBy || exp.createdBy;
    if (payerId && amt > 0) {
      memberExpensePaidMap[payerId] = roundCurrency(
        (memberExpensePaidMap[payerId] ?? 0) + amt
      );
      totalExpensePaid = roundCurrency(totalExpensePaid + amt);
    }
  }

  totalMealExpense = roundCurrency(totalMealExpense);
  const totalOtherExpense = roundCurrency(totalEqualOtherExpense + totalCustomOtherExpense);
  const totalExpense = roundCurrency(totalMealExpense + totalOtherExpense);

  // 2. Aggregate meals per member and overall
  const memberMealMap: Record<string, number> = {};
  let totalMeals = 0;
  for (const meal of input.meals) {
    const daily = calculateDailyMealTotal(meal);
    memberMealMap[meal.userId] = roundCurrency((memberMealMap[meal.userId] ?? 0) + daily);
    totalMeals = roundCurrency(totalMeals + daily);
  }

  // 3. Calculate Meal Rate
  const exactMealRate = calculateExactMealRate(totalMealExpense, totalMeals);
  const mealRate = calculateMealRate(totalMealExpense, totalMeals);

  // 4. Aggregate direct cash/mobile payments per member
  const memberDepositMap: Record<string, number> = {};
  let totalDirectPayments = 0;
  for (const pay of input.payments) {
    const amt = Number.isFinite(pay.amount) && pay.amount > 0 ? pay.amount : 0;
    memberDepositMap[pay.userId] = roundCurrency((memberDepositMap[pay.userId] ?? 0) + amt);
    totalDirectPayments = roundCurrency(totalDirectPayments + amt);
  }

  const totalPayments = roundCurrency(totalExpensePaid + totalDirectPayments);

  // 5. Compute per-member balance (Total Paid = Expense Paid by Member + Direct Payments)
  const memberBalances: MemberBalanceResult[] = activeMembers.map((member) => {
    const meals = memberMealMap[member.uid] ?? 0;
    const expensePaid = memberExpensePaidMap[member.uid] ?? 0;
    const depositPaid = memberDepositMap[member.uid] ?? 0;
    const paid = roundCurrency(expensePaid + depositPaid);

    const sharedShare = calculateSharedExpense({
      totalOtherExpense: totalEqualOtherExpense,
      activeMemberCount: memberCount,
      splitMode: input.monthSplitMode ?? "equal",
      memberId: member.uid,
      customShares: input.monthCustomShares,
    });

    const customExpShare = roundCurrency(perExpenseCustomMap[member.uid] ?? 0);

    // Use exactMealRate so sum of member meal costs matches totalMealExpense accurately
    return calculateMemberBalance({
      userId: member.uid,
      memberName: member.name,
      memberMeals: meals,
      mealRate: exactMealRate,
      sharedExpenseShare: sharedShare,
      customExpenses: customExpShare,
      totalPayments: paid,
      expensePaid,
      depositPaid,
    });
  });

  const totalDue = roundCurrency(
    memberBalances
      .filter((m) => m.status === "due")
      .reduce((acc, m) => acc + m.balance, 0)
  );

  const totalReceivable = roundCurrency(
    memberBalances
      .filter((m) => m.status === "receivable")
      .reduce((acc, m) => acc + m.absoluteBalance, 0)
  );

  return {
    totalMealExpense,
    totalOtherExpense,
    totalExpense,
    totalMeals,
    mealRate,
    exactMealRate,
    totalExpensePaid,
    totalDirectPayments,
    totalPayments,
    totalDue,
    totalReceivable,
    memberBalances,
  };
}
