"use client";

import React, { useState } from "react";
import {
  ArrowRightLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Wallet,
  MessageCircle,
} from "lucide-react";
import { useMess } from "@/hooks/use-mess";
import { formatBDT, formatMonthTitle } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareSummaryModal } from "@/components/reports/share-summary-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettlementPage() {
  const { mess, selectedMonthId, accounting, settlements } = useMess();
  const [shareOpen, setShareOpen] = useState(false);

  const membersWhoOwe = accounting.memberBalances.filter(
    (m) => m.status === "due"
  );
  const membersWhoReceive = accounting.memberBalances.filter(
    (m) => m.status === "receivable"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-emerald-600" /> Monthly
            Settlement (বকেয়া ও পাওনা সমন্বয়)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Suggested minimum transfers for {formatMonthTitle(selectedMonthId)} to
            settle all dues and receivables cleanly.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setShareOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
        >
          <MessageCircle className="h-4 w-4" /> Share on WhatsApp (হিসাব শেয়ার)
        </Button>
      </div>

      {/* Debtors & Creditors Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4" /> Who Needs to Pay (যাদের বকেয়া
              আছে)
            </CardTitle>
            <CardDescription>
              Members whose monthly cost exceeds their paid deposits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {membersWhoOwe.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">
                No member currently owes money.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {membersWhoOwe.map((m) => (
                  <div
                    key={m.userId}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {m.memberName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Cost: {formatBDT(m.totalCost)} • Paid:{" "}
                        {formatBDT(m.totalPaid)}
                      </p>
                    </div>
                    <Badge variant="due" className="text-xs px-2.5 py-1">
                      {formatBDT(m.absoluteBalance)} Due
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-4 w-4" /> Who Should Receive (যারা টাকা পাবেন)
            </CardTitle>
            <CardDescription>
              Members who paid more than their monthly cost
            </CardDescription>
          </CardHeader>
          <CardContent>
            {membersWhoReceive.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">
                No member has a receivable balance right now.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {membersWhoReceive.map((m) => (
                  <div
                    key={m.userId}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {m.memberName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Cost: {formatBDT(m.totalCost)} • Paid:{" "}
                        {formatBDT(m.totalPaid)}
                      </p>
                    </div>
                    <Badge variant="positive" className="text-xs px-2.5 py-1">
                      {formatBDT(m.absoluteBalance)} Receive
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suggested Settlement Transfers */}
      <Card>
        <CardHeader>
          <CardTitle>Suggested Settlement Transfers</CardTitle>
          <CardDescription>
            Optimized to reduce unnecessary peer-to-peer transfers. Any
            remaining due after peer transfers goes directly to the mess fund.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-2" />
              <p className="font-semibold text-slate-900 dark:text-white">
                No peer-to-peer transfers required!
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                {membersWhoOwe.length > 0
                  ? "Members with Due balances can deposit their remaining amount directly to the Mess Manager."
                  : "All member accounts are balanced for this month."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((t, idx) => (
                <div
                  key={`${t.fromUserId}-${t.toUserId}-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {t.fromName}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {t.toName}
                    </span>
                  </div>

                  <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    {formatBDT(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ShareSummaryModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        messName={mess?.name || "Our Mess"}
        monthId={selectedMonthId}
        accounting={accounting}
        settlements={settlements}
      />
    </div>
  );
}
