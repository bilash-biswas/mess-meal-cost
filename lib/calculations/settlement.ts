import { roundCurrency } from "./meal-rate";

export interface SettlementMemberBalance {
  userId: string;
  memberName: string;
  /**
   * Positive balance => Member owes money (Due)
   * Negative balance => Member should receive money (Receivable)
   * Zero balance     => Settled
   */
  balance: number;
}

export interface SettlementTransfer {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
}

/**
 * Calculates suggested settlement transfers to clear dues and receivables
 * with the minimum number of transfers.
 *
 * Example:
 *   Bilash -> Rahim   ৳600
 *   Karim  -> Rahim   ৳400
 *   Sakib  -> Bilash  ৳250
 *
 * Pure, deterministic greedy net-balance matching algorithm.
 */
export function calculateSettlement(
  members: SettlementMemberBalance[]
): SettlementTransfer[] {
  if (!members || members.length === 0) return [];

  // Debtors: balance > 0 (they owe money)
  const debtors = members
    .filter((m) => roundCurrency(m.balance) > 0.009)
    .map((m) => ({
      userId: m.userId,
      name: m.memberName,
      remaining: roundCurrency(m.balance),
    }))
    .sort((a, b) => b.remaining - a.remaining || a.userId.localeCompare(b.userId));

  // Creditors: balance < 0 (they should receive money)
  const creditors = members
    .filter((m) => roundCurrency(m.balance) < -0.009)
    .map((m) => ({
      userId: m.userId,
      name: m.memberName,
      remaining: roundCurrency(Math.abs(m.balance)),
    }))
    .sort((a, b) => b.remaining - a.remaining || a.userId.localeCompare(b.userId));

  const transfers: SettlementTransfer[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const transferAmount = roundCurrency(Math.min(debtor.remaining, creditor.remaining));

    if (transferAmount > 0.009) {
      transfers.push({
        fromUserId: debtor.userId,
        fromName: debtor.name,
        toUserId: creditor.userId,
        toName: creditor.name,
        amount: transferAmount,
      });
    }

    debtor.remaining = roundCurrency(debtor.remaining - transferAmount);
    creditor.remaining = roundCurrency(creditor.remaining - transferAmount);

    if (debtor.remaining <= 0.009) {
      i++;
    }
    if (creditor.remaining <= 0.009) {
      j++;
    }
  }

  return transfers;
}
