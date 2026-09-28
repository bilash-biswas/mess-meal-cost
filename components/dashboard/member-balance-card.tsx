import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { MemberBalanceResult } from "@/lib/calculations/member-balance";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MemberBalanceCardProps {
  memberBalances: MemberBalanceResult[];
  currentUserId?: string;
}

export function MemberBalanceCard({
  memberBalances,
  currentUserId,
}: MemberBalanceCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Member Balance Summary (সদস্যদের হিসাব)</CardTitle>
          <CardDescription>
            Live meals, total cost, paid deposits, and due/receivable status.
          </CardDescription>
        </div>
        <Link
          href="/months"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Full Sheet <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                <th className="py-2.5 px-2">Member</th>
                <th className="py-2.5 px-2 text-right">Meals</th>
                <th className="py-2.5 px-2 text-right">Cost</th>
                <th className="py-2.5 px-2 text-right">Paid</th>
                <th className="py-2.5 px-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {memberBalances.map((m) => {
                const isMe = m.userId === currentUserId;
                return (
                  <tr key={m.userId} className={isMe ? "bg-emerald-500/5" : ""}>
                    <td className="py-3 px-2 font-medium">
                      {m.memberName}{" "}
                      {isMe && (
                        <span className="text-[10px] font-bold uppercase text-emerald-600">
                          (You)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">{m.meals}</td>
                    <td className="py-3 px-2 text-right">
                      {formatBDT(m.totalCost)}
                    </td>
                    <td className="py-3 px-2 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatBDT(m.totalPaid)}
                    </td>
                    <td className="py-3 px-2 text-right">
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
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-2.5">
          {memberBalances.map((m) => (
            <div
              key={m.userId}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between gap-2"
            >
              <div>
                <p className="font-semibold text-sm">{m.memberName}</p>
                <p className="text-xs text-slate-500">
                  {m.meals} meals • Cost: {formatBDT(m.totalCost)} • Paid:{" "}
                  {formatBDT(m.totalPaid)}
                </p>
              </div>
              {m.status === "due" ? (
                <Badge variant="due">{formatBDT(m.absoluteBalance)} Due</Badge>
              ) : m.status === "receivable" ? (
                <Badge variant="positive">
                  {formatBDT(m.absoluteBalance)} Receive
                </Badge>
              ) : (
                <Badge variant="outline">Settled</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
