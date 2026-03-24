import { z } from "zod";

export const clubSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(3),
  monthlyPrice: z.coerce.number().positive(),
  teacherName: z.string().min(2),
  capacity: z.coerce.number().int().positive(),
  schedule: z.string().min(2),
  isActive: z.coerce.boolean().default(true),
  kindergartenId: z.string().cuid().optional()
});

export const enrollmentSchema = z.object({
  childId: z.string().cuid(),
  clubId: z.string().cuid()
});

export const payInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
  provider: z.enum(["click", "payme"]),
  returnTo: z.string().startsWith("/").optional()
});

export const expenseLimitSchema = z.object({
  kindergartenId: z.string().cuid(),
  dailyLimit: z.coerce.number().positive(),
  singleTransactionLimit: z.coerce.number().positive(),
  monthlyLimit: z.coerce.number().positive()
});
