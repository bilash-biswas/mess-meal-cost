import React from "react";
import { Calculator, Utensils } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface MealRateCardProps {
  mealRate: number;
  totalMeals: number;
  totalMealExpense: number;
}

export function MealRateCard({
  mealRate,
  totalMeals,
  totalMealExpense,
}: MealRateCardProps) {
  return (
    <Card className="p-4 sm:p-5 border-emerald-500/30 bg-emerald-500/5 flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          Current Meal Rate (মিল রেট)
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 tracking-tight">
          {formatBDT(mealRate, { minimumFractionDigits: 2 })}
        </p>
        <p className="text-[11px] text-emerald-800/70 dark:text-emerald-200/70 flex items-center gap-1">
          <Utensils className="h-3 w-3" />
          {formatBDT(totalMealExpense)} ÷ {totalMeals} meals
        </p>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
        <Calculator className="h-5 w-5" />
      </div>
    </Card>
  );
}
