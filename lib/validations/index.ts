import { z } from "zod";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/types/expense";
import { PAYMENT_METHODS, type PaymentMethod } from "@/types/payment";

const VALID_CATEGORIES = EXPENSE_CATEGORIES.map((c) => c.value) as [
  ExpenseCategory,
  ...ExpenseCategory[],
];

const VALID_PAYMENT_METHODS = PAYMENT_METHODS.map((m) => m.value) as [
  PaymentMethod,
  ...PaymentMethod[],
];

export const ALLOWED_RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// 1. Authentication Schemas
export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(60, "Name must be under 60 characters."),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

// 2. Date & Month Format Validators
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.");

export const monthIdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Month ID must be in YYYY-MM format (e.g. 2026-09).");

export const inviteCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{2,4}-[A-Z0-9]{4,8}$/, "Invalid invitation code format (example: GV-82X4K).");

// 3. Mess Creation & Configuration Schemas
export const mealConfigSchema = z.object({
  breakfast: z.coerce
    .number()
    .min(0, "Breakfast weight cannot be negative.")
    .max(5, "Breakfast weight cannot exceed 5."),
  lunch: z.coerce
    .number()
    .min(0, "Lunch weight cannot be negative.")
    .max(5, "Lunch weight cannot exceed 5."),
  dinner: z.coerce
    .number()
    .min(0, "Dinner weight cannot be negative.")
    .max(5, "Dinner weight cannot exceed 5."),
});

export const createMessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Mess name must be at least 2 characters.")
    .max(80, "Mess name cannot exceed 80 characters."),
  address: z
    .string()
    .trim()
    .min(2, "Address is required (e.g. Mirpur, Dhaka).")
    .max(150, "Address cannot exceed 150 characters."),
  description: z
    .string()
    .trim()
    .max(300, "Description cannot exceed 300 characters."),
  monthStartDay: z.coerce
    .number()
    .int()
    .min(1, "Start day must be between 1 and 28.")
    .max(28, "Start day must be between 1 and 28."),
  defaultMealConfig: mealConfigSchema,
});

export const joinMessSchema = z.object({
  inviteCode: inviteCodeSchema,
});

// 4. Meal Entry Schema
export const memberMealEntrySchema = z.object({
  userId: z.string().min(1, "Valid member is required."),
  memberName: z.string().min(1, "Member name is required."),
  breakfast: z.coerce.number().min(0, "Meal value cannot be negative.").max(10),
  lunch: z.coerce.number().min(0, "Meal value cannot be negative.").max(10),
  dinner: z.coerce.number().min(0, "Meal value cannot be negative.").max(10),
});

export const dailyMealBatchSchema = z.object({
  date: dateStringSchema,
  monthId: monthIdSchema,
  entries: z.array(memberMealEntrySchema).min(1, "At least one member meal entry is required."),
});

// 5. Expense & Receipt Validation Schemas
export const expenseSchema = z.object({
  date: dateStringSchema,
  monthId: monthIdSchema,
  category: z.enum(VALID_CATEGORIES, {
    errorMap: () => ({ message: "Please select a valid expense category." }),
  }),
  amount: z.coerce
    .number()
    .positive("Expense amount must be greater than 0.")
    .max(10_000_000, "Expense amount is unrealistically large."),
  paidBy: z.string().trim().min(1, "Please select which member paid for this expense."),
  expenseType: z.enum(["meal", "other"], {
    errorMap: () => ({ message: "Expense type must be Meal Expense or Other Shared Expense." }),
  }),
  splitMode: z.enum(["equal", "custom"]).optional().default("equal"),
  customShares: z.record(z.string(), z.number().min(0)).optional(),
  description: z
    .string()
    .trim()
    .min(2, "Please provide a short description (e.g. Vegetables + potatoes).")
    .max(250, "Description cannot exceed 250 characters."),
});

export function validateReceiptFile(file: {
  type: string;
  size: number;
  name?: string;
}): { valid: boolean; error?: string } {
  if (!ALLOWED_RECEIPT_MIME_TYPES.includes(file.type as (typeof ALLOWED_RECEIPT_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: "Invalid receipt file type. Only JPG, JPEG, PNG, and WEBP images are allowed.",
    };
  }
  if (file.size <= 0) {
    return {
      valid: false,
      error: "Receipt file cannot be empty.",
    };
  }
  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    return {
      valid: false,
      error: "Receipt image exceeds the 5 MB maximum file size.",
    };
  }
  return { valid: true };
}

// 6. Payment Schema
export const paymentSchema = z.object({
  date: dateStringSchema,
  monthId: monthIdSchema,
  userId: z.string().trim().min(1, "Please select a valid mess member."),
  amount: z.coerce
    .number()
    .positive("Payment amount must be greater than 0.")
    .max(10_000_000, "Payment amount is unrealistically large."),
  method: z.enum(VALID_PAYMENT_METHODS, {
    errorMap: () => ({ message: "Please select a valid payment method." }),
  }),
  note: z
    .string()
    .trim()
    .max(200, "Note cannot exceed 200 characters.")
    .optional()
    .default(""),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type CreateMessFormValues = z.infer<typeof createMessSchema>;
export type JoinMessFormValues = z.infer<typeof joinMessSchema>;
export type ExpenseFormValues = z.infer<typeof expenseSchema>;
export type PaymentFormValues = z.infer<typeof paymentSchema>;
