import { describe, expect, it } from "vitest";
import { evaluateSuspicious } from "../src/services/suspicious";

describe("suspicious rules", () => {
  it("flags by merchant category and outside hours", () => {
    const result = evaluateSuspicious(
      { amount: 100_000, merchantCategory: "electronics", transactionTime: new Date("2026-03-05T22:00:00Z") },
      { singleTransactionLimit: 300_000 as never, dailyLimit: 1_000_000 as never, monthlyLimit: 10_000_000 as never },
      ["stationery"],
      1,
      100_000,
      100_000
    );
    expect(result.suspicious).toBe(true);
    expect(result.reason).toContain("merchant_category_not_allowed");
  });
});
