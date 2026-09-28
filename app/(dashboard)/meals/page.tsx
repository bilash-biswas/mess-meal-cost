"use client";

import React from "react";
import { Utensils } from "lucide-react";
import { DailyMealSheet } from "@/components/meals/daily-meal-sheet";

export default function MealsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Utensils className="h-6 w-6 text-emerald-600" /> Day-Wise Meal
          Management (দিন ভিত্তিক মিলের হিসাব)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Track daily member attendance where <strong>Present = 1</strong> and{" "}
          <strong>Absent = 0</strong> across the monthly mess khata.
        </p>
      </div>

      <DailyMealSheet />
    </div>
  );
}
