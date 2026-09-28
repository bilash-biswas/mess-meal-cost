"use client";

import React, { useState } from "react";
import {
  Users,
  Shield,
  Crown,
  UserMinus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useMess } from "@/hooks/use-mess";
import { updateMemberRole, removeMessMember } from "@/lib/firebase/firestore";
import { formatBDT } from "@/lib/utils";
import { getFriendlyErrorMessage } from "@/lib/utils/error-messages";
import type { MessMember, MessRole } from "@/types/mess";
import { InviteCard } from "@/components/members/invite-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";

export default function MembersPage() {
  const { mess, members, isOwner, accounting } = useMess();
  const [memberToRemove, setMemberToRemove] = useState<MessMember | null>(null);
  const [removing, setRemoving] = useState(false);
  const [updatingRoleUid, setUpdatingRoleUid] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!mess) return null;

  const balanceMap = new Map(
    accounting.memberBalances.map((b) => [b.userId, b])
  );

  const handleRoleChange = async (member: MessMember, newRole: MessRole) => {
    if (!isOwner || member.role === "owner") return;
    setErrorMsg(null);
    setStatusMessage(null);
    setUpdatingRoleUid(member.uid);
    try {
      await updateMemberRole({
        messId: mess.id,
        targetUserId: member.uid,
        newRole,
      });
      setStatusMessage(`${member.name}'s role updated to ${newRole}.`);
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setUpdatingRoleUid(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setErrorMsg(null);
    setRemoving(true);
    try {
      await removeMessMember({
        messId: mess.id,
        targetUserId: memberToRemove.uid,
      });
      setStatusMessage(`${memberToRemove.name} was removed from the mess.`);
      setMemberToRemove(null);
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" /> Mess Members (সদস্য)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {members.length} active members in {mess.name}
          </p>
        </div>
      </div>

      <InviteCard messName={mess.name} inviteCode={mess.inviteCode} />

      {statusMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-800 dark:text-emerald-200"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
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
          <CardTitle>All Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map((member) => {
              const bal = balanceMap.get(member.uid);
              return (
                <div
                  key={member.uid}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {member.name}
                        </p>
                        <Badge
                          variant={
                            member.role === "owner"
                              ? "positive"
                              : member.role === "admin"
                              ? "info"
                              : "outline"
                          }
                          className="gap-1 uppercase text-[10px]"
                        >
                          {member.role === "owner" && (
                            <Crown className="h-3 w-3" />
                          )}
                          {member.role === "admin" && (
                            <Shield className="h-3 w-3" />
                          )}
                          {member.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>

                  {/* Current Month Quick Stats */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="text-xs sm:text-right">
                      <span className="text-slate-500 block">Meals</span>
                      <span className="font-semibold">{bal?.meals ?? 0}</span>
                    </div>
                    <div className="text-xs sm:text-right">
                      <span className="text-slate-500 block">Paid (জমা)</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatBDT(bal?.totalPaid ?? 0)}
                      </span>
                    </div>
                    <div className="text-xs sm:text-right min-w-[90px]">
                      <span className="text-slate-500 block">Balance</span>
                      {bal?.status === "due" ? (
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          {formatBDT(bal.absoluteBalance)} Due
                        </span>
                      ) : bal?.status === "receivable" ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatBDT(bal.absoluteBalance)} Receive
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-500">
                          Settled
                        </span>
                      )}
                    </div>

                    {/* Owner Actions */}
                    {isOwner && member.role !== "owner" && (
                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`Change role for ${member.name}`}
                          value={member.role}
                          disabled={updatingRoleUid === member.uid}
                          onChange={(e) =>
                            handleRoleChange(
                              member,
                              e.target.value as MessRole
                            )
                          }
                          className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setMemberToRemove(member)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          aria-label={`Remove ${member.name}`}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
        loading={removing}
        title="Remove Mess Member?"
        description={`Are you sure you want to remove ${memberToRemove?.name} from ${mess.name}? Their historical meals and payments for the month will remain in the mess records, but they will no longer have access to this mess.`}
        confirmLabel="Remove Member"
      />
    </div>
  );
}
