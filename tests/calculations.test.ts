import { describe, it, expect } from "vitest";
import {
  calculateMealRate,
  calculateMemberMealCost,
  calculateTotalMeals,
  roundCurrency,
} from "@/lib/calculations/meal-rate";
import {
  calculateSharedExpense,
  calculateMemberBalance,
  calculateMonthlyAccounting,
} from "@/lib/calculations/member-balance";
import { calculateSettlement } from "@/lib/calculations/settlement";

describe("Financial Calculations — Section 45 Test Suite", () => {
  describe("1. Meal Rate Calculation", () => {
    it("calculates exact meal rate: Expense = 10000, Meals = 100 -> Expected = 100", () => {
      expect(calculateMealRate(10000, 100)).toBe(100);
    });

    it("calculates fractional meal rate rounded to 2 decimal places (24500 / 223 = 109.87)", () => {
      expect(calculateMealRate(24500, 223)).toBe(109.87);
    });

    it("returns 0 safely when totalMeals is 0 or negative", () => {
      expect(calculateMealRate(10000, 0)).toBe(0);
      expect(calculateMealRate(10000, -5)).toBe(0);
      expect(calculateMealRate(0, 100)).toBe(0);
    });

    it("sums total meals including fractional breakfast weights (0.5)", () => {
      const total = calculateTotalMeals([
        { breakfast: 0.5, lunch: 1, dinner: 1 }, // 2.5
        { breakfast: 0.5, lunch: 0, dinner: 1 }, // 1.5
      ]);
      expect(total).toBe(4);
    });
  });

  describe("2. Member Meal Cost Calculation", () => {
    it("calculates member meal cost: Meals = 30, Rate = 100 -> Expected = 3000", () => {
      expect(calculateMemberMealCost(30, 100)).toBe(3000);
    });

    it("handles zero meals or zero rate safely", () => {
      expect(calculateMemberMealCost(0, 145.52)).toBe(0);
      expect(calculateMemberMealCost(45, 0)).toBe(0);
    });
  });

  describe("3. Shared Expense Calculation (Equal & Custom Split)", () => {
    it("splits electricity = 2500 equally across 5 members -> 500 each", () => {
      const share = calculateSharedExpense({
        totalOtherExpense: 2500,
        activeMemberCount: 5,
        splitMode: "equal",
      });
      expect(share).toBe(500);
    });

    it("returns custom share when splitMode is custom", () => {
      const share = calculateSharedExpense({
        totalOtherExpense: 2500,
        activeMemberCount: 5,
        splitMode: "custom",
        memberId: "user_bilash",
        customShares: { user_bilash: 750, user_rahim: 450 },
      });
      expect(share).toBe(750);
    });
  });

  describe("4. Member Balance — Due, Receivable & Settled", () => {
    it("calculates Due: Total = 5000, Paid = 3000 -> Expected = 2000 due", () => {
      const result = calculateMemberBalance({
        userId: "u1",
        memberName: "Bilash",
        memberMeals: 30,
        mealRate: 100, // Meal cost = 3000
        sharedExpenseShare: 2000, // Total cost = 5000
        totalPayments: 3000,
      });

      expect(result.totalCost).toBe(5000);
      expect(result.totalPaid).toBe(3000);
      expect(result.balance).toBe(2000);
      expect(result.absoluteBalance).toBe(2000);
      expect(result.status).toBe("due");
    });

    it("calculates Receivable: Total = 5000, Paid = 6000 -> Expected = 1000 receivable", () => {
      const result = calculateMemberBalance({
        userId: "u2",
        memberName: "Rahim",
        memberMeals: 30,
        mealRate: 100, // Meal cost = 3000
        sharedExpenseShare: 2000, // Total cost = 5000
        totalPayments: 6000,
      });

      expect(result.totalCost).toBe(5000);
      expect(result.totalPaid).toBe(6000);
      expect(result.balance).toBe(-1000);
      expect(result.absoluteBalance).toBe(1000);
      expect(result.status).toBe("receivable");
    });

    it("calculates Settled when Total Cost equals Paid Amount", () => {
      const result = calculateMemberBalance({
        userId: "u3",
        memberName: "Karim",
        memberMeals: 48,
        mealRate: 100,
        sharedExpenseShare: 600,
        totalPayments: 5400,
      });

      expect(result.totalCost).toBe(5400);
      expect(result.balance).toBe(0);
      expect(result.status).toBe("settled");
    });
  });

  describe("5. Multi-Member Settlement Calculation", () => {
    it("matches debtors to creditors with minimum transfers", () => {
      // Bilash owes 600, Karim owes 400, Rahim should receive 1000, Hasan is settled (0)
      const transfers = calculateSettlement([
        { userId: "u_bilash", memberName: "Bilash", balance: 600 },
        { userId: "u_karim", memberName: "Karim", balance: 400 },
        { userId: "u_rahim", memberName: "Rahim", balance: -1000 },
        { userId: "u_hasan", memberName: "Hasan", balance: 0 },
      ]);

      expect(transfers).toHaveLength(2);
      expect(transfers[0]).toEqual({
        fromUserId: "u_bilash",
        fromName: "Bilash",
        toUserId: "u_rahim",
        toName: "Rahim",
        amount: 600,
      });
      expect(transfers[1]).toEqual({
        fromUserId: "u_karim",
        fromName: "Karim",
        toUserId: "u_rahim",
        toName: "Rahim",
        amount: 400,
      });
    });

    it("handles complex multi-creditor and multi-debtor settlement accurately", () => {
      const members = [
        { userId: "1", memberName: "Bilash", balance: 500 },
        { userId: "2", memberName: "Karim", balance: 300 },
        { userId: "3", memberName: "Sakib", balance: 200 },
        { userId: "4", memberName: "Rahim", balance: -650 },
        { userId: "5", memberName: "Hasan", balance: -350 },
      ];

      const transfers = calculateSettlement(members);
      const totalTransferred = roundCurrency(
        transfers.reduce((sum, t) => sum + t.amount, 0)
      );
      expect(totalTransferred).toBe(1000);
      expect(transfers.length).toBeLessThanOrEqual(4);
    });
  });

  describe("6. Full Monthly Accounting Aggregator", () => {
    it("separates Meal Expenses from Other Shared Expenses when computing Meal Rate", () => {
      const summary = calculateMonthlyAccounting({
        members: [
          { uid: "u1", name: "Bilash", isActive: true },
          { uid: "u2", name: "Rahim", isActive: true },
        ],
        meals: [
          { userId: "u1", breakfast: 10, lunch: 20, dinner: 20 }, // 50
          { userId: "u2", breakfast: 10, lunch: 20, dinner: 20 }, // 50
        ],
        expenses: [
          { amount: 10000, expenseType: "meal" },
          { amount: 2000, expenseType: "other" },
        ],
        payments: [
          { userId: "u1", amount: 5000 },
          { userId: "u2", amount: 7000 },
        ],
      });

      expect(summary.totalMealExpense).toBe(10000);
      expect(summary.totalOtherExpense).toBe(2000);
      expect(summary.totalExpense).toBe(12000);
      expect(summary.totalMeals).toBe(100);
      expect(summary.mealRate).toBe(100); // Only mealExpense (10000) / 100 meals

      const u1 = summary.memberBalances.find((m) => m.userId === "u1")!;
      const u2 = summary.memberBalances.find((m) => m.userId === "u2")!;
      expect(u1.totalCost).toBe(6000); // 5000 meal + 1000 shared
      expect(u1.balance).toBe(1000); // 1000 due
      expect(u1.status).toBe("due");

      expect(u2.totalCost).toBe(6000);
      expect(u2.balance).toBe(-1000); // 1000 receivable
      expect(u2.status).toBe("receivable");
    });

    it("credits whoever added/paid for an expense (paidBy) directly into their Paid balance", () => {
      const summary = calculateMonthlyAccounting({
        members: [
          { uid: "u1", name: "Bilash", isActive: true },
          { uid: "u2", name: "Rahim", isActive: true },
        ],
        meals: [
          { userId: "u1", breakfast: 1, lunch: 0, dinner: 0 }, // 1 day present
          { userId: "u2", breakfast: 1, lunch: 0, dinner: 0 }, // 1 day present
        ],
        expenses: [
          // Bilash adds/pays for 1000 BDT of bazar
          { amount: 1000, expenseType: "meal", paidBy: "u1" },
        ],
        payments: [],
      });

      expect(summary.totalMealExpense).toBe(1000);
      expect(summary.mealRate).toBe(500);
      expect(summary.totalExpensePaid).toBe(1000);
      expect(summary.totalPayments).toBe(1000);

      const bilash = summary.memberBalances.find((m) => m.userId === "u1")!;
      const rahim = summary.memberBalances.find((m) => m.userId === "u2")!;

      // Bilash's cost is 500, and since he added the 1000 expense, his Paid is 1000 -> 500 Receivable
      expect(bilash.totalCost).toBe(500);
      expect(bilash.expensePaid).toBe(1000);
      expect(bilash.totalPaid).toBe(1000);
      expect(bilash.balance).toBe(-500);
      expect(bilash.status).toBe("receivable");

      // Rahim's cost is 500, Paid is 0 -> 500 Due
      expect(rahim.totalCost).toBe(500);
      expect(rahim.totalPaid).toBe(0);
      expect(rahim.balance).toBe(500);
      expect(rahim.status).toBe("due");
    });
  });
});
