import React from "react";
import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { formatBDT, formatReadableDate } from "@/lib/utils";
import { PAYMENT_METHODS, type MessPayment } from "@/types/payment";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RecentPaymentListProps {
  payments: MessPayment[];
}

export function RecentPaymentList({ payments }: RecentPaymentListProps) {
  const recent = payments.slice(0, 5);
  const methodMap = new Map(PAYMENT_METHODS.map((m) => [m.value, m.label]));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-600" /> Recent Payments (জমা)
          </CardTitle>
          <CardDescription>Latest member deposits</CardDescription>
        </div>
        <Link
          href="/payments"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            No payments recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((pay) => (
              <div
                key={pay.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {pay.memberName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {formatReadableDate(pay.date)}
                    {pay.note ? ` • ${pay.note}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatBDT(pay.amount)}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {methodMap.get(pay.method) || pay.method}
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
