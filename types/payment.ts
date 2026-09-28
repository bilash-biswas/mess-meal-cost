export type PaymentMethod = "cash" | "bank_transfer" | "mobile_banking" | "other";

export interface PaymentMethodMeta {
  value: PaymentMethod;
  label: string;
  bengaliHint: string;
}

export const PAYMENT_METHODS: PaymentMethodMeta[] = [
  { value: "cash", label: "Cash", bengaliHint: "নগদ" },
  { value: "mobile_banking", label: "Mobile Banking (bKash/Nagad/Rocket)", bengaliHint: "মোবাইল ব্যাংকিং" },
  { value: "bank_transfer", label: "Bank Transfer", bengaliHint: "ব্যাংক ট্রান্সফার" },
  { value: "other", label: "Other", bengaliHint: "অন্যান্য" },
];

export interface MessPayment {
  id: string;
  messId: string;
  monthId: string; // "YYYY-MM"
  date: string; // "YYYY-MM-DD"
  userId: string; // Member who paid/deposited to the mess fund
  memberName: string;
  amount: number;
  method: PaymentMethod;
  note: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
