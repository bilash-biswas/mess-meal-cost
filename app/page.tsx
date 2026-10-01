"use client";

import React from "react";
import Link from "next/link";
import {
  Utensils,
  Receipt,
  Calculator,
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-xs">
              ৳
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">MessCost</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 dark:text-slate-400">
                মেসের হিসাব, সহজেই সবার জন্য।
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!loading && user ? (
              <Link href={user.activeMessId ? "/dashboard" : "/create-mess"}>
                <Button>
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <Badge variant="positive" className="px-3 py-1 text-xs">
                100% Free Forever • Built for Shared Messes in Bangladesh
              </Badge>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                Simple Mess{" "}
                <span className="text-emerald-600 dark:text-emerald-400">
                  হিসাব
                </span>
                , Shared by Everyone.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                <strong>মেসের হিসাব, সহজেই সবার জন্য।</strong> Track daily{" "}
                <span className="font-medium">মিল (Meals)</span>,{" "}
                <span className="font-medium">বাজার খরচ (Bazar Expenses)</span>,
                shared bills, member deposits (<span className="font-medium">জমা</span>
                ), live meal rates, and instant monthly{" "}
                <span className="font-medium">বকেয়া / পাওনা</span> settlements.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={
                    user
                      ? user.activeMessId
                        ? "/dashboard"
                        : "/create-mess"
                      : "/register"
                  }
                >
                  <Button size="lg" className="shadow-sm">
                    Start Your Mess হিসাব <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={user ? "/join" : "/login"}>
                  <Button variant="outline" size="lg">
                    Join with Invite Code
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Live Meal Rate (৳)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Bazar & Utility Split</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Closed Month Protection</span>
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="lg:col-span-5">
              <Card className="border-emerald-500/20 shadow-lg overflow-hidden">
                <div className="bg-emerald-600 text-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-emerald-100 font-semibold">
                        Live Mess Snapshot
                      </p>
                      <h2 className="text-xl font-bold mt-0.5">
                        Green View Mess
                      </h2>
                      <p className="text-xs text-emerald-100">
                        Mirpur, Dhaka • September 2026
                      </p>
                    </div>
                    <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-mono font-semibold">
                      GV-82X4K
                    </span>
                  </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3">
                      <p className="text-[11px] text-slate-500">মোট খরচ</p>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        ৳32,450
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3">
                      <p className="text-[11px] text-slate-500">মোট মিল</p>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        223
                      </p>
                    </div>
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        মিল রেট
                      </p>
                      <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                        ৳109.87
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">My Meals (Bilash)</span>
                      <span className="font-semibold">45 meals</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">My Estimated Cost</span>
                      <span className="font-semibold">৳6,534.15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">My Paid (জমা)</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ৳5,000
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-medium">My Due (বকেয়া)</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        ৳1,534.15 Due
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="border-t border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900/50 py-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-center">
              Everything Your Mess Needs Every Month
            </h2>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl mx-auto">
              Answers every financial question transparently for Owners, Admins,
              and Members.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
              {[
                {
                  icon: Utensils,
                  title: "Daily Meal Tracking (মিল)",
                  desc: "Configurable Breakfast, Lunch & Dinner weights (e.g. 0.5, 1, 1) with one-click Copy Previous Day and batched saves.",
                },
                {
                  icon: Receipt,
                  title: "Bazar & Shared Expenses (বাজার)",
                  desc: "Separate Meal Expenses from Utilities/Khala bills. Upload compressed receipt photos directly from your phone.",
                },
                {
                  icon: Calculator,
                  title: "Accurate Accounting & Splits",
                  desc: "Deterministic two-decimal BDT (৳) calculations supporting both Equal Split and Custom Member Split.",
                },
                {
                  icon: Users,
                  title: "Invite Code & Role Control",
                  desc: "Share a simple code like GV-82X4K. Strict Owner, Admin, and Member permissions enforced via Firestore Security Rules.",
                },
                {
                  icon: ShieldCheck,
                  title: "Monthly Closing & History",
                  desc: "Freeze monthly accounts when the month ends so historical calculations are never silently changed.",
                },
                {
                  icon: Smartphone,
                  title: "Mobile-First & Smart Settlement",
                  desc: "Designed for Android Chrome & desktop with instant minimum-transfer settlement suggestions.",
                },
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <Card key={feat.title} className="p-5 space-y-2.5">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-base">{feat.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {feat.desc}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* SEO FAQ Section */}
        <section className="py-14 sm:py-20 border-t border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-2">
              <Badge variant="info">FAQ • সাধারণ জিজ্ঞাসা</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Frequently Asked Questions (মেসের হিসাব সংক্রান্ত প্রশ্নাবলী)
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Answers to common questions about bachelor mess accounts, meal rates, and expense management.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "মিল রেট (Meal Rate) কীভাবে হিসাব হয়?",
                  qEn: "How is the mess meal rate calculated?",
                  a: "মেসকস্টে মিল রেট সম্পূর্ণ নিখুঁতভাবে হিসাব করা হয়: মোট বাজার ও খাবারের খরচ ÷ সব মেম্বারদের মোট মিল = লাইভ মিল রেট। এরপর মেম্বার মিল খরচ = মেম্বারের নিজস্ব মোট মিল × মিল রেট। পয়সার কোনো গরমিল ছাড়া শতভাগ সঠিক দুই-দশমিক BDT (৳) হিসাব পাওয়া যায়।",
                },
                {
                  q: "বাজার খরচ কে দেয় এবং কীভাবে তা জমা (Paid) হিসেবে যোগ হয়?",
                  qEn: "Who adds bazar expenses and how is the payer credited?",
                  a: "যেকোনো মেম্বার বাজার করলে সরাসরি অ্যাপে খরচ যোগ করতে পারেন। যিনি খরচটি এন্ট্রি করবেন, স্বয়ংক্রিয়ভাবে তার নামে পণ্য ক্রয়ের টাকা জমা হিসেবে যুক্ত হবে। ফলে মাস শেষে তার বকেয়া (Due) কমে আসবে অথবা তিনি পাওনাদার (Refundable) হবেন।",
                },
                {
                  q: "মেসকস্ট কি মোবাইল অ্যাপ হিসেবে ব্যবহার করা যায়?",
                  qEn: "Can I use MessCost as a mobile app on Android or iPhone?",
                  a: "হ্যাঁ! মেসকস্ট একটি আধুনিক PWA (Progressive Web App) যা যেকোনো মোবাইল ব্রাউজার থেকে সরাসরি হোম স্ক্রিনে ইনস্টল করা যায়। এছাড়াও GitHub Releases থেকে লাইটওয়েট অ্যান্ড্রয়েড .APK ডাউনলোড করে ইনস্টল করার সুবিধাও রয়েছে।",
                },
                {
                  q: "কাগজের খাতার চেয়ে মেসকস্টে মেসের হিসাব রাখা কেন ভালো?",
                  qEn: "Why is MessCost better than a traditional paper khata?",
                  a: "কাগজের খাতায় হিসাবের কাটাকাটি, ভুল মিল রেট এবং মাসের শেষে হিসাব মেলাতে গিয়ে অযথা ঝামেলা হয়। মেসকস্টে প্রতিটি মেম্বার নিজস্ব ফোন থেকে প্রতিদিনের মিল ও খরচের হিসাব রিয়েল-টাইমে দেখতে পান, ফলে সম্পূর্ণ স্বচ্ছতা ও মেসের সম্প্রীতি বজায় থাকে।",
                },
              ].map((faq, idx) => (
                <Card key={idx} className="p-5 space-y-2">
                  <h3 className="font-semibold text-base text-slate-900 dark:text-white flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <span>{faq.q}</span>
                    <span className="text-xs text-slate-400 font-normal">({faq.qEn})</span>
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {faq.a}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>MessCost</strong> — Simple Mess হিসাব, Shared by Everyone.
          </span>
          <span>Runs on $0 / 0 BDT Free Tier (Next.js + Firebase + Vercel)</span>
        </div>
      </footer>
    </div>
  );
}
