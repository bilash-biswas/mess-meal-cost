"use client";

import React, { useState } from "react";
import {
  Receipt,
  Utensils,
  Wallet,
  Scale,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMess } from "@/hooks/use-mess";
import { useMeals } from "@/hooks/use-meals";
import { formatBDT } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { MealRateCard } from "@/components/dashboard/meal-rate-card";
import { ExpenseSummaryCard } from "@/components/dashboard/expense-summary-card";
import { MemberBalanceCard } from "@/components/dashboard/member-balance-card";
import { RecentExpenseList } from "@/components/dashboard/recent-expense-list";
import { RecentPaymentList } from "@/components/dashboard/recent-payment-list";
import { MonthlyProgress } from "@/components/dashboard/monthly-progress";
import { ExpenseFormModal } from "@/components/expenses/expense-form-modal";
import { PaymentFormModal } from "@/components/payments/payment-form-modal";

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    mess,
    members,
    selectedMonthId,
    canManage,
    isMonthClosed,
    expenses,
    payments,
    accounting,
  } = useMess();
  const { dateTotalMeals } = useMeals();

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  if (!mess) return null;

  // Find current logged-in member's personal account summary (fallback to first member in demo)
  const myBalance =
    accounting.memberBalances.find((b) => b.userId === user?.uid) ||
    accounting.memberBalances[0] || {
      meals: 0,
      totalCost: 0,
      expensePaid: 0,
      depositPaid: 0,
      totalPaid: 0,
      balance: 0,
      absoluteBalance: 0,
      status: "settled" as const,
    };

  return (
    <div className="space-y-6">
      <DashboardHeader
        messName={mess.name}
        address={mess.address}
        monthId={selectedMonthId}
        memberCount={members.length}
        todayTotalMeals={dateTotalMeals}
        canManage={canManage}
        isMonthClosed={isMonthClosed}
        onAddExpense={() => setExpenseModalOpen(true)}
        onAddPayment={() => setPaymentModalOpen(true)}
      />

      {/* Row 1: Mess-Wide KPIs (Total Expense, Total Meals, Current Meal Rate) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Expense"
          bengaliSubLabel="মোট খরচ"
          value={formatBDT(accounting.totalExpense)}
          subtitle={`Meal: ${formatBDT(
            accounting.totalMealExpense
          )} • Shared: ${formatBDT(accounting.totalOtherExpense)}`}
          icon={Receipt}
          tone="due"
        />

        <SummaryCard
          title="Total Meals"
          bengaliSubLabel="মোট মিল"
          value={String(accounting.totalMeals)}
          subtitle={`Across ${members.length} active members`}
          icon={Utensils}
          tone="info"
        />

        <MealRateCard
          mealRate={accounting.mealRate}
          totalMeals={accounting.totalMeals}
          totalMealExpense={accounting.totalMealExpense}
        />
      </div>

      {/* Row 2: Personal Account KPIs (My Meals, My Estimated Cost, My Paid Amount, My Due/Receivable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="My Meals"
          bengaliSubLabel="আমার মিল"
          value={String(myBalance.meals)}
          subtitle="Meals taken this month"
          icon={Utensils}
          tone="default"
        />

        <SummaryCard
          title="My Estimated Cost"
          bengaliSubLabel="আমার খরচ"
          value={formatBDT(myBalance.totalCost)}
          subtitle="Meal cost + shared bills"
          icon={Scale}
          tone="info"
        />

        <SummaryCard
          title="My Paid Amount"
          bengaliSubLabel="আমার জমা ও বাজার"
          value={formatBDT(myBalance.totalPaid)}
          subtitle={`Products: ${formatBDT(
            myBalance.expensePaid ?? 0
          )} • Deposit: ${formatBDT(myBalance.depositPaid ?? 0)}`}
          icon={Wallet}
          tone="positive"
        />

        <SummaryCard
          title={
            myBalance.status === "receivable"
              ? "My Receivable"
              : myBalance.status === "due"
              ? "My Due Amount"
              : "My Account Status"
          }
          bengaliSubLabel={
            myBalance.status === "receivable" ? "পাওনা" : "বকেয়া"
          }
          value={
            myBalance.status === "settled"
              ? "৳0 (Settled)"
              : formatBDT(myBalance.absoluteBalance)
          }
          subtitle={
            myBalance.status === "due"
              ? "Amount you need to pay"
              : myBalance.status === "receivable"
              ? "Amount you should receive"
              : "Your account is fully settled"
          }
          icon={myBalance.status === "due" ? AlertCircle : CheckCircle2}
          tone={myBalance.status === "due" ? "due" : "positive"}
        />
      </div>

      <MonthlyProgress
        totalExpense={accounting.totalExpense}
        totalPayments={accounting.totalPayments}
        totalDue={accounting.totalDue}
      />

      {/* Row 3: Member Balances & Monthly Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <MemberBalanceCard
            memberBalances={accounting.memberBalances}
            currentUserId={user?.uid}
          />
        </div>
        <div className="lg:col-span-5">
          <ExpenseSummaryCard
            expenses={expenses}
            totalMealExpense={accounting.totalMealExpense}
            totalOtherExpense={accounting.totalOtherExpense}
            totalExpense={accounting.totalExpense}
          />
        </div>
      </div>

      {/* Row 4: Recent Expenses & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentExpenseList expenses={expenses} />
        <RecentPaymentList payments={payments} />
      </div>

      <ExpenseFormModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
      />

      <PaymentFormModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />
    </div>
  );
}
