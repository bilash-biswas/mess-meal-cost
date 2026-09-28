import React from "react";
import Link from "next/link";
import { ArrowRight, Receipt } from "lucide-react";
import { formatBDT, formatReadableDate } from "@/lib/utils";
import type { MessExpense } from "@/types/expense";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RecentExpenseListProps {
  expenses: MessExpense[];
}

export function RecentExpenseList({ expenses }: RecentExpenseListProps) {
  const recent = expenses.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-rose-500" /> Recent Expenses
          </CardTitle>
          <CardDescription>Latest bazar and utility entries</CardDescription>
        </div>
        <Link
          href="/expenses"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            No expenses recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((exp) => (
              <div
                key={exp.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {exp.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatReadableDate(exp.date)} • By{" "}
                    <strong>{exp.paidByName}</strong>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-sm font-bold text-rose-600 dark:text-rose-400">
                    {formatBDT(exp.amount)}
                  </span>
                  <Badge
                    variant={exp.expenseType === "meal" ? "positive" : "info"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {exp.expenseType === "meal" ? "Meal" : "Shared"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
