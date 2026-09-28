import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number in Bangladeshi Taka (৳) with 2 decimal places when fractional,
 * or exact decimals when requested.
 *
 * Rounding Policy:
 * All monetary amounts use integer paisa rounding (`Math.round((n + EPSILON) * 100) / 100`).
 */
export function formatBDT(
  amount: number,
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const rounded = Math.round((safeAmount + Number.EPSILON) * 100) / 100;
  const hasFraction = Math.abs(rounded % 1) > 0.001;
  const minDecimals = options.minimumFractionDigits ?? (hasFraction ? 2 : 0);
  const maxDecimals = options.maximumFractionDigits ?? 2;

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(Math.abs(rounded));

  return rounded < 0 ? `-৳${formatted}` : `৳${formatted}`;
}

/**
 * Generates a readable, unique Mess Invitation Code like "GV-82X4K"
 * derived from the mess name prefix and 5 unambiguous alphanumeric characters.
 */
export function generateInviteCode(messName: string): string {
  const words = messName
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  let prefix = "MC";
  if (words.length >= 2) {
    prefix = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    prefix = words[0].slice(0, 2).toUpperCase();
  }

  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * alphabet.length);
    suffix += alphabet[idx];
  }

  return `${prefix}-${suffix}`;
}

/**
 * Returns current YYYY-MM string (e.g. "2026-09").
 */
export function getCurrentMonthId(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Returns current YYYY-MM-DD string (e.g. "2026-09-26").
 */
export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Converts a YYYY-MM string (e.g. "2026-09") into a human-readable month title
 * like "September 2026".
 */
export function formatMonthTitle(monthId: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthId);
  if (!match) return monthId;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const date = new Date(year, monthIndex, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Formats a YYYY-MM-DD date string into a readable label like "26 September 2026".
 */
export function formatReadableDate(dateStr: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return dateStr;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Returns the previous day's YYYY-MM-DD string for a given YYYY-MM-DD date.
 */
export function getPreviousDateString(dateStr: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return getTodayDateString();
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  d.setDate(d.getDate() - 1);
  return getTodayDateString(d);
}
