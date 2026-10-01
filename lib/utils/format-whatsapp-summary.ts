import { formatBDT, formatMonthTitle } from "@/lib/utils";
import type { MonthlyAccountingSummary } from "@/lib/calculations/member-balance";
import type { SettlementTransfer } from "@/lib/calculations/settlement";

export type SummaryFormatType = "full" | "summary" | "settlement";

export interface FormatSummaryOptions {
  messName: string;
  monthId: string;
  accounting: MonthlyAccountingSummary;
  settlements: SettlementTransfer[];
  appUrl?: string;
  formatType?: SummaryFormatType;
}

export function generateWhatsAppSummary({
  messName,
  monthId,
  accounting,
  settlements,
  appUrl = "https://mess-meal-cost.vercel.app",
  formatType = "full",
}: FormatSummaryOptions): string {
  const monthTitle = formatMonthTitle(monthId);
  const now = new Date().toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const lines: string[] = [];

  // Header
  lines.push(`🏠 *${messName} — ${monthTitle} হিসাব*`);
  lines.push(`📅 আপডেট: ${now}`);
  lines.push("");

  // Overview Stats
  lines.push(`📊 *সারসংক্ষেপ (Overview):*`);
  lines.push(`• মোট বাজার খরচ: ${formatBDT(accounting.totalMealExpense)}`);
  if (accounting.totalOtherExpense > 0) {
    lines.push(`• অন্যান্য/ফিক্সড বিল: ${formatBDT(accounting.totalOtherExpense)}`);
    lines.push(`• সর্বমোট খরচ: ${formatBDT(accounting.totalExpense)}`);
  }
  lines.push(`• মোট মিল: ${accounting.totalMeals}`);
  lines.push(`• *মিল রেট: ${formatBDT(accounting.mealRate, { minimumFractionDigits: 2 })}*`);
  lines.push(`• মোট জমা (Paid): ${formatBDT(accounting.totalPayments)}`);

  if (formatType === "summary") {
    lines.push("");
    lines.push(`• মোট বকেয়া (Due): ${formatBDT(accounting.totalDue)}`);
    lines.push(`• মোট পাওনা (Receivable): ${formatBDT(accounting.totalReceivable)}`);
    lines.push("");
    lines.push(`📱 লাইভ হিসাব দেখুন: ${appUrl}`);
    lines.push(`⚡ MessCost — মেসের হিসাব, সহজেই সবার জন্য।`);
    return lines.join("\n");
  }

  // Member Breakdown (Only in 'full' mode)
  if (formatType === "full") {
    lines.push("");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("👥 *সদস্যদের হিসাব বিবরণী (Member Breakdown):*");
    lines.push("");

    accounting.memberBalances.forEach((m, idx) => {
      lines.push(`${idx + 1}. *${m.memberName}*`);
      lines.push(`   • মিল: ${m.meals} | মিল খরচ: ${formatBDT(m.mealCost)}`);

      if (m.sharedExpenseShare + m.customExpenseShare > 0) {
        lines.push(
          `   • বিল শেয়ার: ${formatBDT(m.sharedExpenseShare + m.customExpenseShare)}`
        );
      }

      lines.push(`   • মোট খরচ: ${formatBDT(m.totalCost)}`);

      const paidBreakdown =
        m.expensePaid > 0 && m.depositPaid > 0
          ? ` (বাজার ${formatBDT(m.expensePaid)} + ক্যাশ ${formatBDT(m.depositPaid)})`
          : m.expensePaid > 0
          ? ` (বাজার খরচ)`
          : "";
      lines.push(`   • মোট জমা: ${formatBDT(m.totalPaid)}${paidBreakdown}`);

      if (m.status === "due") {
        lines.push(`   ➜ *বকেয়া (Due): ${formatBDT(m.absoluteBalance)}* ⚠️`);
      } else if (m.status === "receivable") {
        lines.push(`   ➜ *পাওনা (Receive): ${formatBDT(m.absoluteBalance)}* ✅`);
      } else {
        lines.push(`   ➜ *হিসাব সম্পন্ন (Settled)* ✨`);
      }
      lines.push("");
    });
  }

  // Settlement Transfers
  if (formatType === "full" || formatType === "settlement") {
    lines.push("━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("🔄 *কার টাকা কে দেবেন (Suggested Settlement):*");

    if (settlements.length === 0) {
      const dueCount = accounting.memberBalances.filter((m) => m.status === "due").length;
      if (dueCount > 0) {
        lines.push("• যাদের বকেয়া আছে তারা সরাসরি মেস ম্যানেজারের কাছে জমা দিন।");
      } else {
        lines.push("• চমৎকার! এই মাসের সব মেম্বারের হিসাব সম্পূর্ণ ব্যালেন্সড।");
      }
    } else {
      settlements.forEach((t) => {
        lines.push(`• *${t.fromName}* ➜ *${t.toName}*: ${formatBDT(t.amount)}`);
      });
      lines.push("• (টাকা পরিশোধের পর ম্যানেজারকে আপডেট করুন)");
    }
  }

  // Footer Link
  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(`📱 লাইভ হিসাব দেখুন: ${appUrl}`);
  lines.push(`⚡ MessCost — মেসের হিসাব, সহজেই সবার জন্য।`);

  return lines.join("\n");
}
