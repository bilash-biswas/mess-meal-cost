"use client";

import React, { useState } from "react";
import { Copy, Check, Share2, QrCode as QrCodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppQrModal } from "@/components/layout/app-qr-modal";

interface InviteCardProps {
  messName: string;
  inviteCode: string;
}

export function InviteCard({ messName, inviteCode }: InviteCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const joinUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/join?code=${encodeURIComponent(inviteCode)}`
        : "";
    const shareText = `Join our mess "${messName}" on MessCost using invitation code: ${inviteCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${messName} on MessCost`,
          text: shareText,
          url: joinUrl || undefined,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }
    await handleCopy();
  };

  return (
    <>
      <Card className="border-emerald-500/25 bg-emerald-500/5">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Invite Roommates to {messName}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Share this code or scan the <strong>QR Code</strong> so members
              can join at <code className="font-mono text-xs">/join</code> or
              download the mobile app.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="rounded-xl border border-emerald-500/30 bg-white dark:bg-slate-900 px-4 py-2 font-mono text-lg font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400">
              {inviteCode}
            </div>
            <Button type="button" variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setQrOpen(true)}
            >
              <QrCodeIcon className="h-4 w-4 text-emerald-600" /> QR Code & App
            </Button>
            <Button type="button" onClick={handleShare}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
        </CardContent>
      </Card>

      <AppQrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        messName={messName}
        inviteCode={inviteCode}
        initialTab="invite"
      />
    </>
  );
}
