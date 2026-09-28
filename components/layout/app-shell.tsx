"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Utensils,
  Receipt,
  Wallet,
  Users,
  BarChart3,
  History,
  Settings,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  Calendar,
  Lock,
  ArrowRightLeft,
  CalendarCheck2,
  Copy,
  Check,
  QrCode as QrCodeIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMess } from "@/hooks/use-mess";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { cn, formatMonthTitle } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppQrModal } from "@/components/layout/app-qr-modal";

const DESKTOP_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meals", label: "Meals", icon: Utensils },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/members", label: "Members", icon: Users },
  { href: "/months", label: "Monthly Account", icon: CalendarCheck2 },
  { href: "/settlement", label: "Settlement", icon: ArrowRightLeft },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_PRIMARY_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/meals", label: "Meals", icon: Utensils },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    mess,
    role,
    selectedMonthId,
    setSelectedMonthId,
    isMonthClosed,
  } = useMess();

  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    const savedTheme =
      typeof window !== "undefined"
        ? window.localStorage.getItem("messcost_theme")
        : null;
    const isDark =
      savedTheme === "dark" ||
      (!savedTheme &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("messcost_theme", next ? "dark" : "light");
    }
  };

  const handleCopyInvite = async () => {
    if (!mess?.inviteCode) return;
    await navigator.clipboard.writeText(mess.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const monthOptions = [
    "2026-10",
    "2026-09",
    "2026-08",
    "2026-07",
    "2026-06",
  ];
  if (!monthOptions.includes(selectedMonthId)) {
    monthOptions.unshift(selectedMonthId);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-30">
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-xs">
              ৳
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                MessCost
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                মেসের হিসাব
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Active Mess Summary Box */}
        {mess && (
          <div className="mx-3 mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {mess.name}
              </p>
              <Badge
                variant={
                  role === "owner"
                    ? "positive"
                    : role === "admin"
                    ? "info"
                    : "outline"
                }
                className="uppercase text-[10px] px-1.5 py-0"
              >
                {role || "member"}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {mess.address}
            </p>
            <div className="mt-2 flex items-center justify-between gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300">
                Code: {mess.inviteCode}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQrModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <QrCodeIcon className="h-3 w-3" /> QR
                </button>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-3 w-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || "Member"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4 text-rose-500" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/dashboard"
              className="flex lg:hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-base"
            >
              ৳
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {mess?.name || "MessCost"}
                </h1>
                {isMonthClosed ? (
                  <Badge variant="warning" className="gap-1">
                    <Lock className="h-3 w-3" /> Closed
                  </Badge>
                ) : (
                  <Badge variant="positive">OPEN</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                Simple Mess হিসাব, Shared by Everyone.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile App & QR Share Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQrModalOpen(true)}
              className="h-9 px-2.5 sm:px-3"
            >
              <QrCodeIcon className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">QR & App</span>
            </Button>

            {/* Month Selector */}
            <div className="relative flex items-center">
              <Calendar className="h-4 w-4 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                aria-label="Select accounting month"
                value={selectedMonthId}
                onChange={(e) => setSelectedMonthId(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-8 pr-3 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              >
                {monthOptions.map((mId) => (
                  <option key={mId} value={mId}>
                    {formatMonthTitle(mId)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {darkMode ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </header>

        <AppQrModal
          open={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          messName={mess?.name || "MessCost"}
          inviteCode={mess?.inviteCode || "GV-82X4K"}
        />

        {/* Optional Local Preview Banner when `.env.local` is not set */}
        {!isFirebaseConfigured && (
          <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2 text-xs text-blue-800 dark:text-blue-200 flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Local Preview Mode:</strong> Running with pre-loaded{" "}
              <em>Green View Mess (September 2026)</em> data. Add Firebase keys
              in <code className="font-mono">.env.local</code> to connect live
              Cloud Firestore & Auth.
            </span>
            <span className="font-mono text-[11px]">
              Invite Code: <strong>GV-82X4K</strong>
            </span>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Home, Meals, Expenses, Reports, More) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md grid grid-cols-5 h-16"
      >
        {MOBILE_PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreDrawerOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreDrawerOpen((prev) => !prev)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors cursor-pointer",
            moreDrawerOpen
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          {moreDrawerOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer */}
      {moreDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs flex flex-col justify-end pb-16">
          <div className="rounded-t-2xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  More Mess Menu
                </p>
                <p className="text-xs text-slate-500">
                  Invite Code:{" "}
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {mess?.inviteCode || "GV-82X4K"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/payments", label: "Payments (জমা)", icon: Wallet },
                { href: "/members", label: "Members", icon: Users },
                {
                  href: "/months",
                  label: "Monthly Account",
                  icon: CalendarCheck2,
                },
                {
                  href: "/settlement",
                  label: "Settlement",
                  icon: ArrowRightLeft,
                },
                { href: "/history", label: "History", icon: History },
                { href: "/settings", label: "Settings", icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreDrawerOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 truncate">
                Signed in as <strong>{user?.name}</strong>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
