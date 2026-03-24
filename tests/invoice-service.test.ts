import { describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    enrollment: { findMany: vi.fn().mockResolvedValue([{ id: "e1", childId: "c1", child: { parentId: "p1" }, club: { monthlyPrice: 120000 } }]) },
    invoice: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "i1" })
    }
  }
}));

import { generateMonthlyInvoices } from "../src/services/invoice-service";

describe("invoice generation", () => {
  it("creates invoice for active enrollment", async () => {
    const result = await generateMonthlyInvoices("2026-03");
    expect(result.length).toBe(1);
  });
});
