"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMess } from "@/hooks/use-mess";
import { usePayments } from "@/hooks/use-payments";
import { getTodayDateString } from "@/lib/utils";
import { getFriendlyErrorMessage } from "@/lib/utils/error-messages";
import {
  PAYMENT_METHODS,
  type MessPayment,
  type PaymentMethod,
} from "@/types/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/dialog";

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  editingPayment?: MessPayment | null;
}

export function PaymentFormModal({
  open,
  onClose,
  editingPayment,
}: PaymentFormModalProps) {
  const { user } = useAuth();
  const { members, selectedMonthId } = useMess();
  const { createPayment, editPayment } = usePayments();

  const defaultDate = getTodayDateString().startsWith(selectedMonthId)
    ? getTodayDateString()
    : `${selectedMonthId}-26`;

  const [date, setDate] = useState(defaultDate);
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    if (editingPayment) {
      setDate(editingPayment.date);
      setUserId(editingPayment.userId);
      setAmount(String(editingPayment.amount));
      setMethod(editingPayment.method);
      setNote(editingPayment.note);
    } else {
      setDate(defaultDate);
      setUserId(user?.uid || members[0]?.uid || "");
      setAmount("");
      setMethod("cash");
      setNote("");
    }
  }, [open, editingPayment, defaultDate, user?.uid, members]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setErrorMsg("Payment amount must be greater than 0.");
      return;
    }
    if (!userId) {
      setErrorMsg("Please select a mess member.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingPayment) {
        await editPayment(editingPayment.id, {
          date,
          userId,
          amount: numAmount,
          method,
          note: note.trim(),
        });
      } else {
        await createPayment({
          date,
          userId,
          amount: numAmount,
          method,
          note: note.trim() || "Monthly mess payment",
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingPayment ? "Edit Payment" : "+ Add Payment (জমা যোগ করুন)"}
      description="Record a member's deposit or payment into the mess account."
    >
      {errorMsg && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="pay-member">Member</Label>
            <select
              id="pay-member"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            >
              {members.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">৳ Amount</Label>
            <Input
              id="pay-amount"
              type="number"
              step="0.01"
              min="1"
              placeholder="5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-base font-bold"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="pay-method">Payment Method</Label>
            <select
              id="pay-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label} ({pm.bengaliHint})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-date">Date</Label>
            <Input
              id="pay-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pay-note">Note</Label>
          <Input
            id="pay-note"
            placeholder="e.g. September payment"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Saving..."
              : editingPayment
              ? "Update Payment"
              : "Save Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
