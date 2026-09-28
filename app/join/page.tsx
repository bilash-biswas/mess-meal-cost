"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  MapPin,
  Building2,
  ArrowRight,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  lookupMessByInviteCode,
  joinMessByCode,
} from "@/lib/firebase/firestore";
import { inviteCodeSchema } from "@/lib/validations";
import { getFriendlyErrorMessage } from "@/lib/utils/error-messages";
import type { MessInvitationPreview } from "@/types/mess";
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

export default function JoinMessPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const [code, setCode] = useState("GV-82X4K");
  const [preview, setPreview] = useState<MessInvitationPreview | null>(null);
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Automatically read ?code= from scanned QR code URL and preview the mess
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("code")?.trim().toUpperCase();
    if (urlCode) {
      setCode(urlCode);
      const parsed = inviteCodeSchema.safeParse(urlCode);
      if (parsed.success) {
        setSearching(true);
        lookupMessByInviteCode(parsed.data)
          .then((found) => {
            if (found) setPreview(found);
          })
          .catch(() => {
            // Ignore auto-lookup error
          })
          .finally(() => setSearching(false));
      }
    }
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPreview(null);

    const parsed = inviteCodeSchema.safeParse(code);
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || "Invalid invitation code.");
      return;
    }

    setSearching(true);
    try {
      const found = await lookupMessByInviteCode(parsed.data);
      if (!found) {
        setErrorMsg("The invitation code is invalid or expired.");
      } else {
        setPreview(found);
      }
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!user || !preview) return;
    setErrorMsg(null);
    setJoining(true);
    try {
      await joinMessByCode({
        inviteCode: preview.inviteCode,
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        userPhotoURL: user.photoURL,
      });
      await refreshProfile();
      router.replace("/dashboard");
    } catch (err) {
      const friendly = getFriendlyErrorMessage(err);
      if (friendly.includes("already a member")) {
        await refreshProfile();
        router.replace("/dashboard");
        return;
      }
      setErrorMsg(friendly);
    } finally {
      setJoining(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg">
              ৳
            </div>
            <span className="font-bold text-lg">MessCost</span>
          </Link>
          <Link href="/create-mess">
            <Button variant="outline" size="sm">
              <PlusCircle className="h-4 w-4" /> Create New Mess
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" /> Join a Mess
            </CardTitle>
            <CardDescription>
              Enter the invitation code shared by your mess manager (e.g.{" "}
              <code className="font-mono font-semibold">GV-82X4K</code>).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {errorMsg && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-700 dark:text-rose-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLookup} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="inviteCode">Enter Mess Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="inviteCode"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="GV-82X4K"
                    className="font-mono uppercase tracking-wider text-base"
                  />
                  <Button type="submit" variant="secondary" disabled={searching}>
                    <Search className="h-4 w-4" />
                    {searching ? "Checking..." : "Find"}
                  </Button>
                </div>
              </div>
            </form>

            {preview && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                      Mess Preview
                    </p>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                      {preview.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {preview.address}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-center">
                    <span className="block text-base font-bold text-slate-900 dark:text-white">
                      {preview.memberCount}
                    </span>
                    <span className="text-[11px] text-slate-500">Members</span>
                  </div>
                </div>

                {preview.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {preview.description}
                  </p>
                )}

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleConfirmJoin}
                  disabled={joining}
                >
                  {joining ? "Joining Mess..." : "Join Mess"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
