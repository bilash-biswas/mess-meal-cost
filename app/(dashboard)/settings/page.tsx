"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings as SettingsIcon,
  Save,
  Trash2,
  PlusCircle,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMess } from "@/hooks/use-mess";
import {
  updateMessSettings,
  deleteEntireMess,
} from "@/lib/firebase/firestore";
import { getFriendlyErrorMessage } from "@/lib/utils/error-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { mess, isOwner } = useMess();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [monthStartDay, setMonthStartDay] = useState("1");
  const [allowMemberMealEntry, setAllowMemberMealEntry] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!mess) return;
    setName(mess.name);
    setAddress(mess.address);
    setDescription(mess.description);
    setMonthStartDay(String(mess.monthStartDay || 1));
    setAllowMemberMealEntry(mess.allowMemberMealEntry !== false);
  }, [mess]);

  if (!mess) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      setErrorMsg("Only the mess owner can modify mess settings.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      await updateMessSettings(mess.id, {
        name: name.trim(),
        address: address.trim(),
        description: description.trim(),
        monthStartDay: Math.max(1, Math.min(28, Number(monthStartDay) || 1)),
        defaultMealConfig: {
          breakfast: 1,
          lunch: 0,
          dinner: 0,
        },
        allowMemberMealEntry,
      });
      setSuccessMsg("Mess settings updated successfully.");
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteMess = async () => {
    if (!user || !isOwner) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      await deleteEntireMess(mess.id, user.uid);
      await refreshProfile();
      setDeleteDialogOpen(false);
      router.replace("/create-mess");
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-emerald-600" /> Mess Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure mess information, day-wise meal system, and permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/join">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4" /> Join Another Mess
            </Button>
          </Link>
          <Link href="/create-mess">
            <Button variant="outline" size="sm">
              <PlusCircle className="h-4 w-4" /> New Mess
            </Button>
          </Link>
        </div>
      </div>

      {successMsg && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-800 dark:text-emerald-200"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>General & Meal Configuration</CardTitle>
          <CardDescription>
            {isOwner
              ? "As the Mess Owner, you can update these settings anytime."
              : "View-only: Only the Mess Owner can edit mess configuration."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="set-name">Mess Name</Label>
                <Input
                  id="set-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isOwner}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="set-address">Address</Label>
                <Input
                  id="set-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!isOwner}
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="set-desc">Description</Label>
                <Input
                  id="set-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isOwner}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="set-startday">Monthly Start Date (1-28)</Label>
                <Input
                  id="set-startday"
                  type="number"
                  min={1}
                  max={28}
                  value={monthStartDay}
                  onChange={(e) => setMonthStartDay(e.target.value)}
                  disabled={!isOwner}
                />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Day-Wise Meal System (দৈনিক মিল হিসাব)
                </p>
                <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                  Present = 1 • Absent = 0
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Your mess uses a day-wise meal system where each member&apos;s
                daily attendance is counted as <strong>1</strong> (Present) or{" "}
                <strong>0</strong> (Absent) on the Monthly Meal Khata Grid and
                Single-Day Quick View.
              </p>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={allowMemberMealEntry}
                onChange={(e) => setAllowMemberMealEntry(e.target.checked)}
                disabled={!isOwner}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="block text-sm font-medium">
                  Allow members to enter their own daily meals
                </span>
                <span className="block text-xs text-slate-500">
                  When enabled, regular members can toggle their own Present (1)
                  / Absent (0) status on the Day-Wise Meal Khata while the month
                  is open.
                </span>
              </div>
            </label>

            {isOwner && (
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving Settings..." : "Save Settings"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone (Owner Only) */}
      {isOwner && (
        <Card className="border-rose-500/30">
          <CardHeader>
            <CardTitle className="text-rose-600 dark:text-rose-400">
              Danger Zone
            </CardTitle>
            <CardDescription>
              Deleting the mess permanently removes its configuration and
              unlinks all members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete Mess
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDeleteMess}
        loading={deleting}
        title="Delete Entire Mess?"
        description={`Are you sure you want to permanently delete "${mess.name}"? This action is destructive and cannot be undone.`}
        confirmLabel="Delete Mess Permanently"
      />
    </div>
  );
}
