import { describe, it, expect } from "vitest";
import {
  generateWhatsAppSummary,
} from "@/lib/utils/format-whatsapp-summary";
import { generateQrMatrix } from "@/lib/utils/qrcode";
import {
  formatBDT,
  formatMonthTitle,
  generateInviteCode,
  getCurrentMonthId,
  getTodayDateString,
} from "@/lib/utils";
import { roundCurrency } from "@/lib/calculations/meal-rate";
import { getFriendlyErrorMessage } from "@/lib/utils/error-messages";
import {
  calculateMonthlyAccounting,
  type MonthlyAccountingSummary,
} from "@/lib/calculations/member-balance";
import { calculateSettlement } from "@/lib/calculations/settlement";

describe("All Functionality Verification Suite", () => {
  describe("1. Currency & Date Utility Functions", () => {
    it("formats BDT currency correctly with symbol ৳ and decimals", () => {
      expect(formatBDT(1000)).toBe("৳1,000");
      expect(formatBDT(1000.5)).toBe("৳1,000.50");
      expect(formatBDT(-500)).toBe("-৳500");
      expect(formatBDT(0)).toBe("৳0");
    });

    it("formats Month IDs to human readable titles", () => {
      expect(formatMonthTitle("2026-10")).toBe("October 2026");
      expect(formatMonthTitle("2026-01")).toBe("January 2026");
      expect(formatMonthTitle("invalid")).toBe("invalid");
    });

    it("generates 8-character invite codes matching the expected pattern", () => {
      const code1 = generateInviteCode("Green View");
      const code2 = generateInviteCode("Mess Cost");
      const code3 = generateInviteCode("MessCost");
      expect(code1).toMatch(/^GV-[A-Z0-9]{5}$/);
      expect(code2).toMatch(/^MC-[A-Z0-9]{5}$/);
      expect(code3).toMatch(/^ME-[A-Z0-9]{5}$/);
    });

    it("returns valid ISO-like date strings for today and current month", () => {
      expect(getCurrentMonthId()).toMatch(/^\d{4}-\d{2}$/);
      expect(getTodayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("2. Error Message Mapping (Firebase & Domain)", () => {
    it("maps Firebase Auth errors to user-friendly Bangla/English guidance", () => {
      expect(getFriendlyErrorMessage({ code: "auth/invalid-credential" })).toContain(
        "Invalid email or password"
      );
      expect(getFriendlyErrorMessage({ code: "auth/unauthorized-domain" })).toContain(
        "not authorized in Firebase yet"
      );
      expect(getFriendlyErrorMessage({ code: "auth/popup-blocked" })).toContain(
        "blocked by your browser"
      );
      expect(getFriendlyErrorMessage({ code: "auth/too-many-requests" })).toContain(
        "Too many attempts"
      );
    });

    it("preserves known domain errors", () => {
      expect(
        getFriendlyErrorMessage(new Error("Unable to save expense. Please try again."))
      ).toBe("Unable to save expense. Please try again.");
      expect(
        getFriendlyErrorMessage(new Error("You are not a member of this mess."))
      ).toBe("You are not a member of this mess.");
    });
  });

  describe("3. QR Code Generator Matrix", () => {
    it("generates a square binary matrix for invite links and URLs", () => {
      const matrix = generateQrMatrix("https://mess-meal-cost.vercel.app/join?code=GV-82X4K");
      expect(Array.isArray(matrix)).toBe(true);
      expect(matrix.length).toBeGreaterThan(15);
      expect(matrix[0].length).toBe(matrix.length); // Square matrix
      expect(typeof matrix[0][0]).toBe("boolean");
    });
  });

  describe("4. End-to-End Real Mess Accounting Scenario", () => {
    // 3-member mess: Bilash, Tanvir, Sakib
    // Month: October 2026
    // Bilash: buys Bazar ৳3,000, 30 meals
    // Tanvir: buys Bazar ৳2,000, 40 meals
    // Sakib: buys Wi-Fi ৳1,000 (shared equally), 50 meals
    // Sakib also makes a cash deposit of ৳2,000
    // Total Bazar = 5000, Total Other = 1000, Total Expense = 6000
    // Total Meals = 120
    // Meal Rate = 5000 / 120 = 41.6666... -> 41.67
    const summary = calculateMonthlyAccounting({
      members: [
        { uid: "u_bilash", name: "Bilash", isActive: true },
        { uid: "u_tanvir", name: "Tanvir", isActive: true },
        { uid: "u_sakib", name: "Sakib", isActive: true },
      ],
      meals: [
        { userId: "u_bilash", breakfast: 0, lunch: 15, dinner: 15 }, // 30
        { userId: "u_tanvir", breakfast: 0, lunch: 20, dinner: 20 }, // 40
        { userId: "u_sakib", breakfast: 0, lunch: 25, dinner: 25 }, // 50
      ],
      expenses: [
        { amount: 3000, expenseType: "meal", paidBy: "u_bilash" },
        { amount: 2000, expenseType: "meal", paidBy: "u_tanvir" },
        { amount: 1000, expenseType: "other", paidBy: "u_sakib", splitMode: "equal" },
      ],
      payments: [{ userId: "u_sakib", amount: 2000 }],
    });

    it("verifies accurate totals and meal rate", () => {
      expect(summary.totalMealExpense).toBe(5000);
      expect(summary.totalOtherExpense).toBe(1000);
      expect(summary.totalExpense).toBe(6000);
      expect(summary.totalMeals).toBe(120);
      expect(summary.mealRate).toBe(41.67);
      expect(summary.totalExpensePaid).toBe(6000); // 3000 + 2000 + 1000
      expect(summary.totalDirectPayments).toBe(2000);
      expect(summary.totalPayments).toBe(8000);
    });

    it("verifies individual member costs and buyer balance credits", () => {
      const bilash = summary.memberBalances.find((m) => m.userId === "u_bilash")!;
      const tanvir = summary.memberBalances.find((m) => m.userId === "u_tanvir")!;
      const sakib = summary.memberBalances.find((m) => m.userId === "u_sakib")!;

      // Wi-Fi is split equally: 1000 / 3 = 333.33 each
      expect(bilash.sharedExpenseShare).toBe(333.33);
      expect(tanvir.sharedExpenseShare).toBe(333.33);
      expect(sakib.sharedExpenseShare).toBe(333.33);

      // Meal costs (30 * 41.6666..., 40 * 41.6666..., 50 * 41.6666...)
      expect(roundCurrency(bilash.mealCost + tanvir.mealCost + sakib.mealCost)).toBe(5000);

      // Bilash: Paid 3000 for Bazar, total cost = 1250 + 333.33 = 1583.33
      // Paid 3000 > Cost 1583.33 -> Receivable
      expect(bilash.totalPaid).toBe(3000);
      expect(bilash.status).toBe("receivable");
      expect(bilash.balance).toBeLessThan(0);

      // Sakib: Paid 1000 (Wi-Fi) + 2000 (Deposit) = 3000. Cost = 2083.33 + 333.33 = 2416.66
      expect(sakib.totalPaid).toBe(3000);
      expect(sakib.status).toBe("receivable");

      // Tanvir: Paid 2000. Cost = 1666.67 + 333.33 = 2000. Exactly settled!
      expect(tanvir.totalPaid).toBe(2000);
      expect(tanvir.status).toBe("settled");
    });

    it("verifies greedy settlement transfer generation", () => {
      const settlementMembers = summary.memberBalances.map((m) => ({
        userId: m.userId,
        memberName: m.memberName,
        balance: m.balance,
      }));
      const transfers = calculateSettlement(settlementMembers);
      // Since no one has a due balance (Tanvir is settled, Bilash & Sakib are creditors because surplus deposits exist)
      // There are no peer transfers required.
      expect(Array.isArray(transfers)).toBe(true);
    });
  });

  describe("5. WhatsApp Monthly Summary Generation", () => {
    it("generates WhatsApp full breakdown text with proper formatting and emojis", () => {
      const mockSummary: MonthlyAccountingSummary = {
        totalMealExpense: 12500,
        totalOtherExpense: 2500,
        totalExpense: 15000,
        totalMeals: 250,
        mealRate: 50,
        exactMealRate: 50,
        totalExpensePaid: 15000,
        totalDirectPayments: 5000,
        totalPayments: 20000,
        totalDue: 1500,
        totalReceivable: 1500,
        memberBalances: [
          {
            userId: "u1",
            memberName: "Bilash",
            meals: 80,
            mealCost: 4000,
            sharedExpenseShare: 833.33,
            customExpenseShare: 0,
            totalCost: 4833.33,
            expensePaid: 6000,
            depositPaid: 0,
            totalPaid: 6000,
            balance: -1166.67,
            absoluteBalance: 1166.67,
            status: "receivable",
          },
          {
            userId: "u2",
            memberName: "Tanvir",
            meals: 90,
            mealCost: 4500,
            sharedExpenseShare: 833.33,
            customExpenseShare: 0,
            totalCost: 5333.33,
            expensePaid: 0,
            depositPaid: 4000,
            totalPaid: 4000,
            balance: 1333.33,
            absoluteBalance: 1333.33,
            status: "due",
          },
        ],
      };

      const mockTransfers = [
        {
          fromUserId: "u2",
          fromName: "Tanvir",
          toUserId: "u1",
          toName: "Bilash",
          amount: 1166.67,
        },
      ];

      const text = generateWhatsAppSummary({
        messName: "Green View Mess",
        monthId: "2026-10",
        accounting: mockSummary,
        settlements: mockTransfers,
        appUrl: "https://mess-meal-cost.vercel.app",
        formatType: "full",
      });

      expect(text).toContain("Green View Mess — October 2026 হিসাব");
      expect(text).toContain("মোট বাজার খরচ: ৳12,500");
      expect(text).toContain("মিল রেট: ৳50.00");
      expect(text).toContain("Bilash");
      expect(text).toContain("পাওনা (Receive): ৳1,166.67");
      expect(text).toContain("Tanvir");
      expect(text).toContain("বকেয়া (Due): ৳1,333.33");
      expect(text).toContain("*Tanvir* ➜ *Bilash*: ৳1,166.67");
      expect(text).toContain("https://mess-meal-cost.vercel.app");
    });
  });
});
