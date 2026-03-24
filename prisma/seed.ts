import { PrismaClient, UserRole, EnrollmentStatus, InvoiceStatus, PaymentProvider, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.club.deleteMany();
  await prisma.child.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.cardTransaction.deleteMany();
  await prisma.expenseLimit.deleteMany();
  await prisma.allowedMerchantCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.kindergarten.deleteMany();
  await prisma.district.deleteMany();

  const district = await prisma.district.create({ data: { name: "Toshkent tumani" } });
  const kindergartens = await Promise.all([
    prisma.kindergarten.create({ data: { districtId: district.id, name: "MTT 1", address: "Yunusobod" } }),
    prisma.kindergarten.create({ data: { districtId: district.id, name: "MTT 12", address: "Chilonzor" } }),
    prisma.kindergarten.create({ data: { districtId: district.id, name: "MTT 25", address: "Sergeli" } })
  ]);

  const hash = await bcrypt.hash("Password123!", 10);

  await prisma.user.create({ data: { fullName: "Tuman Admin", email: "admin@dmtt.uz", passwordHash: hash, role: UserRole.district_admin, districtId: district.id } });

  for (let i = 0; i < kindergartens.length; i++) {
    await prisma.user.create({ data: { fullName: `Direktor ${i + 1}`, email: `director${i + 1}@dmtt.uz`, passwordHash: hash, role: UserRole.kindergarten_director, districtId: district.id, kindergartenId: kindergartens[i].id } });
  }

  await prisma.user.create({ data: { fullName: "Xodim 1", email: "staff1@dmtt.uz", passwordHash: hash, role: UserRole.staff, districtId: district.id, kindergartenId: kindergartens[0].id } });
  await prisma.user.create({ data: { fullName: "Xodim 2", email: "staff2@dmtt.uz", passwordHash: hash, role: UserRole.staff, districtId: district.id, kindergartenId: kindergartens[1].id } });

  const parents = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.create({ data: { fullName: `Ota-ona ${i}`, email: `parent${i}@dmtt.uz`, passwordHash: hash, role: UserRole.parent, districtId: district.id } });
    const profile = await prisma.parentProfile.create({ data: { userId: user.id, phone: `+99890100000${i}` } });
    parents.push(profile);
  }

  const clubs = [];
  for (const kg of kindergartens) {
    clubs.push(await prisma.club.create({ data: { kindergartenId: kg.id, name: "Ingliz tili", description: "Boshlang'ich ingliz tili", monthlyPrice: 180000, teacherName: "Dilnoza", capacity: 25, schedule: "Du-Chor-Juma 16:00", isActive: true } }));
    clubs.push(await prisma.club.create({ data: { kindergartenId: kg.id, name: "Rasm", description: "Ijodiy rasm darslari", monthlyPrice: 150000, teacherName: "Kamola", capacity: 20, schedule: "Seshanba-Payshanba 15:00", isActive: true } }));
    clubs.push(await prisma.club.create({ data: { kindergartenId: kg.id, name: "Raqs", description: "Milliy raqs to'garagi", monthlyPrice: 170000, teacherName: "Madina", capacity: 20, schedule: "Shanba 11:00", isActive: true } }));

    await prisma.expenseLimit.create({ data: { kindergartenId: kg.id, dailyLimit: 1200000, singleTransactionLimit: 350000, monthlyLimit: 18000000 } });
  }

  await prisma.allowedMerchantCategory.createMany({
    data: [
      { code: "stationery", label: "Kanselyariya" },
      { code: "kids_goods", label: "Bolalar mahsulotlari" },
      { code: "educational_materials", label: "O'quv materiallari" },
      { code: "cleaning", label: "Tozalash" },
      { code: "utility", label: "Kommunal" }
    ]
  });

  const children = [];
  for (let i = 0; i < 8; i++) {
    const kg = kindergartens[i % 3];
    const child = await prisma.child.create({ data: { fullName: `Bola ${i + 1}`, birthDate: new Date(2020, i % 12, 3 + i), kindergartenId: kg.id, parentId: parents[i % parents.length].id, groupName: `Guruh ${(i % 4) + 1}` } });
    children.push(child);
  }

  const enrollments = [];
  for (let i = 0; i < 8; i++) {
    const child = children[i];
    const club = clubs.find((c) => c.kindergartenId === child.kindergartenId)!;
    const enr = await prisma.enrollment.create({ data: { childId: child.id, clubId: club.id, status: EnrollmentStatus.active, startDate: new Date(2026, 0, 1) } });
    enrollments.push(enr);

    const invoice = await prisma.invoice.create({
      data: {
        parentId: child.parentId,
        childId: child.id,
        enrollmentId: enr.id,
        month: "2026-03",
        amount: club.monthlyPrice,
        dueDate: new Date(2026, 2, 15),
        status: i % 2 === 0 ? InvoiceStatus.paid : InvoiceStatus.unpaid
      }
    });

    if (i % 2 === 0) {
      await prisma.payment.create({ data: { invoiceId: invoice.id, amount: invoice.amount, provider: i % 4 === 0 ? PaymentProvider.click : PaymentProvider.payme, transactionReference: `TX-${i + 1000}`, paidAt: new Date(2026, 2, 10), status: PaymentStatus.succeeded } });
    }
  }

  await prisma.cardTransaction.createMany({
    data: [
      { kindergartenId: kindergartens[0].id, cardLast4: "1122", merchantName: "Office Market", merchantCategory: "stationery", amount: 120000, transactionTime: new Date("2026-03-05T09:30:00Z"), currency: "UZS", rawReference: "REF-1", status: "completed", suspiciousFlag: false },
      { kindergartenId: kindergartens[0].id, cardLast4: "1122", merchantName: "Unknown Shop", merchantCategory: "electronics", amount: 510000, transactionTime: new Date("2026-03-05T21:20:00Z"), currency: "UZS", rawReference: "REF-2", status: "completed", suspiciousFlag: true, suspiciousReason: "limit_and_category" },
      { kindergartenId: kindergartens[1].id, cardLast4: "3344", merchantName: "Clean Service", merchantCategory: "cleaning", amount: 200000, transactionTime: new Date("2026-03-07T10:00:00Z"), currency: "UZS", rawReference: "REF-3", status: "completed", suspiciousFlag: false },
      { kindergartenId: kindergartens[2].id, cardLast4: "5566", merchantName: "Late Night Utility", merchantCategory: "utility", amount: 90000, transactionTime: new Date("2026-03-09T23:40:00Z"), currency: "UZS", rawReference: "REF-4", status: "completed", suspiciousFlag: true, suspiciousReason: "outside_working_hours" }
    ]
  });

  console.log("Seed completed");
}

main().finally(() => prisma.$disconnect());
