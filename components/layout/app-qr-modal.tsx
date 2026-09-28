"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode as QrCodeIcon,
  Smartphone,
  Github,
  Copy,
  Check,
  Download,
  ExternalLink,
  Share2,
  Sparkles,
} from "lucide-react";
import { QrCode } from "@/components/ui/qr-code";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface AppQrModalProps {
  open: boolean;
  onClose: () => void;
  messName?: string;
  inviteCode?: string;
  initialTab?: "invite" | "github_apk" | "pwa";
}

const GITHUB_REPO_STORAGE_KEY = "messcost_github_repo";

export function AppQrModal({
  open,
  onClose,
  messName = "MessCost",
  inviteCode = "GV-82X4K",
  initialTab = "invite",
}: AppQrModalProps) {
  const [activeTab, setActiveTab] = useState<"invite" | "github_apk" | "pwa">(
    initialTab
  );
  const [origin, setOrigin] = useState("https://mess-meal-cost.vercel.app");
  const [githubRepo, setGithubRepo] = useState(
    process.env.NEXT_PUBLIC_GITHUB_REPO || "bilash-biswas/mess-meal-cost"
  );
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOrigin(window.location.origin);

    const savedRepo = window.localStorage.getItem(GITHUB_REPO_STORAGE_KEY);
    if (savedRepo && savedRepo !== "your-username/messcost") {
      setGithubRepo(savedRepo);
    }

    // Register service worker for PWA installation
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-blocking in dev mode
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleSaveGithubRepo = (val: string) => {
    const cleaned = val
      .trim()
      .replace(/^https?:\/\/github\.com\//i, "")
      .replace(/\/+$/, "");
    setGithubRepo(cleaned);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GITHUB_REPO_STORAGE_KEY, cleaned);
    }
  };

  const joinUrl = `${origin}/join?code=${encodeURIComponent(inviteCode)}`;
  const apkDownloadUrl = githubRepo.startsWith("http")
    ? githubRepo
    : `https://github.com/${githubRepo || "bilash-biswas/mess-meal-cost"}/releases/latest/download/MessCost.apk`;
  const githubReleasesPageUrl = githubRepo.startsWith("http")
    ? githubRepo
    : `https://github.com/${githubRepo || "bilash-biswas/mess-meal-cost"}/releases`;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleNativeShare = async (title: string, text: string, url: string) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // Fallback to copy
      }
    }
    await handleCopy(url);
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mobile App & QR Code Share (মোবাইল অ্যাপ ও QR)"
      description="Share your mess invite, download the Android APK from GitHub Releases, or install the mobile web app."
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("invite")}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "invite"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <QrCodeIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Mess Join QR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("github_apk")}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "github_apk"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Github className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">GitHub APK</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pwa")}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "pwa"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Install App</span>
          </button>
        </div>

        {/* TAB 1: Mess Invite QR Code */}
        {activeTab === "invite" && (
          <div className="space-y-4 text-center">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="positive">Scan to Join Mess</Badge>
                <span className="font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                  {inviteCode}
                </span>
              </div>

              <QrCode
                value={joinUrl}
                size={190}
                title={`Join ${messName}`}
                subtitle={`Code: ${inviteCode}`}
                downloadFileName={`${messName
                  .toLowerCase()
                  .replace(/\s+/g, "-")}-invite-qr.png`}
              />

              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                Roommates can scan this QR code with their phone camera to open{" "}
                <strong>{messName}</strong> and join automatically with code{" "}
                <code className="font-mono font-bold">{inviteCode}</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy(joinUrl)}
              >
                {copiedUrl ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                    Link!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy Join Link
                  </>
                )}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() =>
                  handleNativeShare(
                    `Join ${messName} on MessCost`,
                    `Join our mess "${messName}" on MessCost using code ${inviteCode}:`,
                    joinUrl
                  )
                }
              >
                <Share2 className="h-3.5 w-3.5" /> Share Invite Link
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: GitHub Releases Android APK + QR Code */}
        {activeTab === "github_apk" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="github-repo-input" className="text-xs">
                Your GitHub Repository (e.g.{" "}
                <code className="font-mono">username/messcost</code>)
              </Label>
              <Input
                id="github-repo-input"
                value={githubRepo}
                onChange={(e) => handleSaveGithubRepo(e.target.value)}
                placeholder="username/messcost"
                className="font-mono text-xs h-9"
              />
              <p className="text-[11px] text-slate-500">
                Pushing this project to GitHub automatically triggers{" "}
                <code className="font-mono">
                  .github/workflows/build-android-apk.yml
                </code>{" "}
                to build & publish <strong>MessCost.apk</strong> to GitHub
                Releases.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="info">Android .APK Download QR</Badge>
              </div>

              <QrCode
                value={apkDownloadUrl}
                size={180}
                title="MessCost Android App (.APK)"
                subtitle={githubRepo}
                downloadFileName="messcost-android-apk-qr.png"
              />

              <p className="text-[11px] font-mono text-slate-500 break-all px-2">
                {apkDownloadUrl}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <a
                  href={apkDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button type="button" size="sm">
                    <Download className="h-3.5 w-3.5" /> Download .APK
                  </Button>
                </a>

                <a
                  href={githubReleasesPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button type="button" variant="outline" size="sm">
                    <ExternalLink className="h-3.5 w-3.5" /> Open GitHub
                    Releases
                  </Button>
                </a>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(apkDownloadUrl)}
                >
                  {copiedUrl ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy APK URL
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Installable PWA (Android & iOS Home Screen App) */}
        {activeTab === "pwa" && (
          <div className="space-y-4 text-center">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="positive">
                  <Sparkles className="h-3 w-3 mr-1" /> Works on Android &
                  iPhone
                </Badge>
              </div>

              <QrCode
                value={origin}
                size={180}
                title="MessCost Mobile Web App"
                subtitle={origin.replace(/^https?:\/\//, "")}
                downloadFileName="messcost-web-app-qr.png"
              />

              {installed ? (
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  ✓ MessCost is installed on your device!
                </p>
              ) : deferredPrompt ? (
                <div className="pt-1">
                  <Button type="button" onClick={handleInstallPwa}>
                    <Smartphone className="h-4 w-4" /> Install MessCost App Now
                  </Button>
                </div>
              ) : (
                <div className="text-left rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    How to install after scanning QR Code:
                  </p>
                  <p>
                    • <strong>Android (Chrome):</strong> Tap the browser menu{" "}
                    <strong>⋮</strong> → <strong>Install app</strong> /{" "}
                    <strong>Add to Home screen</strong>.
                  </p>
                  <p>
                    • <strong>iPhone (Safari):</strong> Tap{" "}
                    <strong>Share</strong> →{" "}
                    <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
