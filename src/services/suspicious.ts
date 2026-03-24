import { ExpenseLimit } from "@prisma/client";

type TxInput = { amount: number; merchantCategory: string; transactionTime: Date };

const START_HOUR = 8;
const END_HOUR = 18;

export function evaluateSuspicious(
  tx: TxInput,
  limit: Pick<ExpenseLimit, "singleTransactionLimit" | "dailyLimit" | "monthlyLimit">,
  allowedCategories: string[],
  sameDayCount: number,
  sameDayTotal: number,
  sameMonthTotal: number
) {
  const reasons: string[] = [];
  if (tx.amount > Number(limit.singleTransactionLimit)) reasons.push("single_limit");
  if (sameDayCount >= 8) reasons.push("too_many_daily_transactions");
  if (sameDayTotal > Number(limit.dailyLimit)) reasons.push("daily_limit");
  if (sameMonthTotal > Number(limit.monthlyLimit)) reasons.push("monthly_limit");
  const hour = tx.transactionTime.getHours();
  if (hour < START_HOUR || hour >= END_HOUR) reasons.push("outside_working_hours");
  if (!allowedCategories.includes(tx.merchantCategory)) reasons.push("merchant_category_not_allowed");
  return { suspicious: reasons.length > 0, reason: reasons.join(",") || null };
}
