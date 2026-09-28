"use client";

import React from "react";
import Link from "next/link";
import {
  Utensils,
  Receipt,
  Wallet,
  UserPlus,
  MapPin,
  Users,
} from "lucide-react";
import { formatMonthTitle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  messName: string;
  address: string;
  monthId: string;
  memberCount: number;
  todayTotalMeals: number;
  canManage: boolean;
  isMonthClosed: boolean;
  onAddExpense: () => void;
  onAddPayment: () => void;
}

export function DashboardHeader({
  messName,
  address,
  monthId,
  memberCount,
  todayTotalMeals,
  canManage,
  isMonthClosed,
  onAddExpense,
  onAddPayment,
}: DashboardHeaderProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {messName}
            </h1>
            <Badge variant="info" className="text-xs">
              {formatMonthTitle(monthId)}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {address}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              Members: {memberCount}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <Utensils className="h-3.5 w-3.5" />
              Today&apos;s Meals: {todayTotalMeals}
            </span>
          </div>
        </div>

        {/* Mobile & Desktop Quick Actions (Section 53) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <Link href="/meals">
            <Button variant="outline" size="sm" className="w-full">
              <Utensils className="h-3.5 w-3.5 text-emerald-600" /> + Add Meal
            </Button>
          </Link>

          {!isMonthClosed && (
            <Button size="sm" onClick={onAddExpense}>
              <Receipt className="h-3.5 w-3.5" /> + Add Expense
            </Button>
          )}

          {canManage && !isMonthClosed && (
            <Button variant="secondary" size="sm" onClick={onAddPayment}>
              <Wallet className="h-3.5 w-3.5 text-emerald-600" /> + Add
              Payment
            </Button>
          )}

          <Link href="/members">
            <Button variant="outline" size="sm" className="w-full">
              <UserPlus className="h-3.5 w-3.5" /> + Invite Member
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
