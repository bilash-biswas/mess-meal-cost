"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Users,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createMess } from "@/lib/firebase/firestore";
import { createMessSchema, type CreateMessFormValues } from "@/lib/validations";
import { getFriendlyErrorMessage } from "@/lib/utils/error-messages";
import type { Mess } from "@/types/mess";
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

export default function CreateMessPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const [createdMess, setCreatedMess] = useState<Mess | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateMessFormValues>({
    resolver: zodResolver(createMessSchema),
    defaultValues: {
      name: "",
      address: "",
      description: "",
      monthStartDay: 1,
      defaultMealConfig: {
        breakfast: 1,
        lunch: 0,
        dinner: 0,
      },
    },
  });

  const onSubmit = async (values: CreateMessFormValues) => {
    if (!user) return;
    setErrorMsg(null);
    try {
      const mess = await createMess({
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        userPhotoURL: user.photoURL,
        name: values.name,
        address: values.address,
        description: values.description || "",
        monthStartDay: values.monthStartDay,
        defaultMealConfig: values.defaultMealConfig,
      });
      await refreshProfile();
      setCreatedMess(mess);
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err));
    }
  };

  const copyCode = async () => {
    if (!createdMess) return;
    await navigator.clipboard.writeText(createdMess.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg">
              ৳
            </div>
            <span className="font-bold text-lg">MessCost</span>
          </Link>
          <Link href="/join">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4" /> Join Existing Mess
            </Button>
          </Link>
        </div>

        {createdMess ? (
          <Card className="border-emerald-500/30">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl">
                {createdMess.name} Created!
              </CardTitle>
              <CardDescription>
                You are now the <strong>Owner</strong> of this mess. Share the
                invitation code below with your roommates so they can join.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 p-5 text-center space-y-2">
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                  Mess Invitation Code
                </p>
                <p className="text-3xl font-mono font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400">
                  {createdMess.inviteCode}
                </p>
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyCode}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Copy Invitation Code
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push("/dashboard")}
              >
                Open Mess Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" /> Create a New
                Mess (নতুন মেস)
              </CardTitle>
              <CardDescription>
                Set up your shared mess, day-wise meal system, and monthly হিসাব.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorMsg && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-700 dark:text-rose-300"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-1.5">
                  <Label htmlFor="name">Mess Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Green View Mess"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="e.g. Mirpur, Dhaka"
                    {...register("address")}
                  />
                  {errors.address && (
                    <p className="text-xs text-rose-600">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="e.g. Student mess / 4th Floor Flat B"
                    {...register("description")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="monthStartDay">
                    Monthly Accounting Start Day (1 - 28)
                  </Label>
                  <Input
                    id="monthStartDay"
                    type="number"
                    min={1}
                    max={28}
                    {...register("monthStartDay")}
                  />
                </div>

                <div className="rounded-xl border border-emerald-500/20 p-4 space-y-2 bg-emerald-500/5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                      Day-Wise Meal System (দৈনিক মিল হিসাব)
                    </p>
                    <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      Present = 1 • Absent = 0
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Each member&apos;s daily meal attendance is counted per day:{" "}
                    <strong>1</strong> when present and <strong>0</strong> when
                    absent. Monthly meal rate and individual costs are
                    calculated automatically from total present days.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating Mess..." : "Create Mess"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
