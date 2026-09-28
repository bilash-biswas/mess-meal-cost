import React from "react";
import { formatBDT } from "@/lib/utils";
import { EXPENSE_CATEGORIES, type MessExpense } from "@/types/expense";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ExpenseSummaryCardProps {
  expenses: MessExpense[];
  totalMealExpense: number;
  totalOtherExpense: number;
  totalExpense: number;
}

export function ExpenseSummaryCard({
  expenses,
  totalMealExpense,
  totalOtherExpense,
  totalExpense,
}: ExpenseSummaryCardProps) {
  const categoryMap = new Map<string, number>();
  for (const exp of expenses) {
    categoryMap.set(
      exp.category,
      (categoryMap.get(exp.category) ?? 0) + exp.amount
    );
  }

  const topCategories = Array.from(categoryMap.entries())
    .map(([cat, amount]) => {
      const meta = EXPENSE_CATEGORIES.find((c) => c.value === cat);
      return {
        category: cat,
        label: meta ? `${meta.label} (${meta.bengaliHint})` : cat,
        amount,
        percent:
          totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Expense Chart (খরচের খাত)</CardTitle>
        <CardDescription>
          Meal Expense: {formatBDT(totalMealExpense)} • Shared Bills:{" "}
          {formatBDT(totalOtherExpense)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topCategories.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            No expenses recorded for this month yet.
          </p>
        ) : (
          <div className="space-y-3">
            {topCategories.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatBDT(item.amount)}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      ({item.percent}%)
                    </span>
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all"
                    style={{ width: `${Math.max(4, item.percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
