"use client";

import React, { useMemo } from "react";
import { BarChart3, Printer, ShoppingBag, PieChart } from "lucide-react";
import { useMess } from "@/hooks/use-mess";
import { useExpenses } from "@/hooks/use-expenses";
import { formatBDT, formatMonthTitle } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ReportsPage() {
  const { mess, selectedMonthId, accounting } = useMess();
  const { expenses, buyerTotals } = useExpenses();

  const groupedBreakdown = useMemo(() => {
    const groups = {
      Food: 0,
      Electricity: 0,
      Gas: 0,
      "Wi-Fi": 0,
      Other: 0,
    };

    for (const exp of expenses) {
      const meta = EXPENSE_CATEGORIES.find((c) => c.value === exp.category);
      if (meta?.group === "food") {
        groups.Food += exp.amount;
      } else if (exp.category === "electricity") {
        groups.Electricity += exp.amount;
      } else if (exp.category === "gas") {
        groups.Gas += exp.amount;
      } else if (exp.category === "internet") {
        groups["Wi-Fi"] += exp.amount;
      } else {
        groups.Other += exp.amount;
      }
    }

    return Object.entries(groups).map(([label, amount]) => ({
      label,
      amount,
      percent:
        accounting.totalExpense > 0
          ? Math.round((amount / accounting.totalExpense) * 100)
          : 0,
    }));
  }, [expenses, accounting.totalExpense]);

  if (!mess) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-600" /> Monthly Reports —{" "}
            {formatMonthTitle(selectedMonthId)}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Expense summary, category breakdown, bazar buyers, and member
            financial report.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => window.print()}
          className="print:hidden"
        >
          <Printer className="h-4 w-4" /> Print Report
        </Button>
      </div>

      {/* 1. Expense Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">
            Total Expenses (মোট খরচ)
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatBDT(accounting.totalExpense)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">
            Meal Expenses (বাজার খরচ)
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBDT(accounting.totalMealExpense)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium text-slate-500">
            Other Shared Expenses (অন্যান্য বিল)
          </p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {formatBDT(accounting.totalOtherExpense)}
          </p>
        </Card>
      </div>

      {/* 2. Category Breakdown & Who Purchased Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-emerald-600" /> Category
              Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of monthly mess spending by major category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedBreakdown.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatBDT(item.amount)}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      ({item.percent}%)
                    </span>
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{
                      width: `${item.amount > 0 ? Math.max(4, item.percent) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-600" /> Who Purchased
              Items (কে কত টাকার বাজার করেছেন)
            </CardTitle>
            <CardDescription>
              Total bazar and bill purchases made by each member
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(buyerTotals).length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                No purchases recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.entries(buyerTotals)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([uid, info]) => (
                    <div
                      key={uid}
                      className="py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                          {info.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {info.count} purchase{info.count === 1 ? "" : "s"}{" "}
                          this month
                        </p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatBDT(info.total)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Member Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Member Summary (সদস্যদের পূর্ণাঙ্গ হিসাব)</CardTitle>
          <CardDescription>
            Meal Rate: {formatBDT(accounting.mealRate, { minimumFractionDigits: 2 })}{" "}
            • Total Meals: {accounting.totalMeals}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                  <th className="py-3 px-3">Member</th>
                  <th className="py-3 px-3 text-right">Meals</th>
                  <th className="py-3 px-3 text-right">Meal Cost</th>
                  <th className="py-3 px-3 text-right">Shared Cost</th>
                  <th className="py-3 px-3 text-right">Payments (জমা)</th>
                  <th className="py-3 px-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {accounting.memberBalances.map((m) => (
                  <tr key={m.userId}>
                    <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {m.memberName}
                    </td>
                    <td className="py-3.5 px-3 text-right">{m.meals}</td>
                    <td className="py-3.5 px-3 text-right">
                      {formatBDT(m.mealCost)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {formatBDT(m.sharedExpenseShare + m.customExpenseShare)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatBDT(m.totalPaid)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {m.status === "due" ? (
                        <Badge variant="due">
                          {formatBDT(m.absoluteBalance)} Due
                        </Badge>
                      ) : m.status === "receivable" ? (
                        <Badge variant="positive">
                          {formatBDT(m.absoluteBalance)} Receive
                        </Badge>
                      ) : (
                        <Badge variant="outline">Settled</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
