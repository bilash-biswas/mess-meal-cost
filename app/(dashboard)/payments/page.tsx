"use client";

import React, { useState, useMemo } from "react";
import { Wallet, Plus, Pencil, Trash2, Lock } from "lucide-react";
import { useMess } from "@/hooks/use-mess";
import { usePayments } from "@/hooks/use-payments";
import { formatBDT, formatReadableDate } from "@/lib/utils";
import { getFriendlyErrorMessage } from "@/lib/utils/error-messages";
import { PAYMENT_METHODS, type MessPayment } from "@/types/payment";
import { PaymentFormModal } from "@/components/payments/payment-form-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";

export default function PaymentsPage() {
  const { members, accounting, canManage, isMonthClosed } = useMess();
  const { payments, memberPaymentTotals, removePayment } = usePayments();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<MessPayment | null>(
    null
  );
  const [deletingPayment, setDeletingPayment] = useState<MessPayment | null>(
    null
  );
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const methodLabelMap = useMemo(
    () => new Map(PAYMENT_METHODS.map((m) => [m.value, m.label])),
    []
  );

  const filteredPayments = useMemo(() => {
    if (memberFilter === "all") return payments;
    return payments.filter((p) => p.userId === memberFilter);
  }, [payments, memberFilter]);

  const handleConfirmDelete = async () => {
    if (!deletingPayment) return;
    setErrorMsg(null);
    setDeletingLoading(true);
    try {
      await removePayment(deletingPayment);
      setDeletingPayment(null);
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setDeletingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-emerald-600" /> Member Payments
            (জমার হিসাব)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Record and verify member deposits into the monthly mess fund.
          </p>
        </div>

        {canManage && !isMonthClosed && (
          <Button
            onClick={() => {
              setEditingPayment(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Payment
          </Button>
        )}
      </div>

      {isMonthClosed && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            This month is closed. Payment records cannot be modified unless an
            Owner or Admin reopens the month.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Member Payment Totals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {members.map((member) => {
          const bal = accounting.memberBalances.find(
            (b) => b.userId === member.uid
          );
          const totalPaid =
            bal?.totalPaid ?? memberPaymentTotals[member.uid] ?? 0;
          const expensePaid = bal?.expensePaid ?? 0;
          const depositPaid =
            bal?.depositPaid ?? memberPaymentTotals[member.uid] ?? 0;
          return (
            <Card key={member.uid} className="p-4">
              <p className="text-xs font-medium text-slate-500 truncate">
                {member.name}
              </p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatBDT(totalPaid)}
              </p>
              <p className="text-[11px] text-slate-400">
                Products: {formatBDT(expensePaid)} • Deposit:{" "}
                {formatBDT(depositPaid)}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Payment History List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>
              Direct Deposit History (Cash Deposits:{" "}
              {formatBDT(accounting.totalDirectPayments)} • Total Paid with
              Products: {formatBDT(accounting.totalPayments)})
            </CardTitle>
          </div>
          <select
            aria-label="Filter payments by member"
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs sm:text-sm"
          >
            <option value="all">All Members</option>
            {members.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.name}
              </option>
            ))}
          </select>
        </CardHeader>

        <CardContent>
          {filteredPayments.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No payments recorded yet."
              description="Record member deposits to track paid and due balances."
              actionLabel={
                canManage && !isMonthClosed ? "Add Payment" : undefined
              }
              onAction={
                canManage && !isMonthClosed
                  ? () => {
                      setEditingPayment(null);
                      setModalOpen(true);
                    }
                  : undefined
              }
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {pay.memberName}
                      </span>
                      <Badge variant="positive">
                        {methodLabelMap.get(pay.method) || pay.method}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatReadableDate(pay.date)}
                      {pay.note ? ` • ${pay.note}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatBDT(pay.amount)}
                    </span>

                    {canManage && !isMonthClosed && (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPayment(pay);
                            setModalOpen(true);
                          }}
                          aria-label={`Edit payment by ${pay.memberName}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingPayment(pay)}
                          aria-label={`Delete payment by ${pay.memberName}`}
                          className="text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPayment(null);
        }}
        editingPayment={editingPayment}
      />

      <ConfirmDialog
        open={Boolean(deletingPayment)}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleConfirmDelete}
        loading={deletingLoading}
        title="Delete Payment Record?"
        description={`Are you sure you want to delete ${deletingPayment?.memberName}'s payment of ${formatBDT(
          deletingPayment?.amount ?? 0
        )}? This will immediately update their due/receivable balance.`}
        confirmLabel="Delete Payment"
      />
    </div>
  );
}
