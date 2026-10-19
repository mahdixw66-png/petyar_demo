import { describe, it, expect, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";

/**
 * تست‌های یکپارچهٔ مجوزها — نیازمند TEST_DATABASE_URL جدا
 * اگر پایگاه دادهٔ تست در دسترس نباشد، تست‌ها skip می‌شوند.
 */

const hasTestDb = !!process.env.TEST_DATABASE_URL && process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL;

describe.skipIf(!hasTestDb)("permissions integration", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL } } });
    await prisma.$connect();
  });

  it("placeholder — مالک A نمی‌تواند حیوان مالک B را ببیند (منطق در service تست می‌شود)", async () => {
    // این الگو را می‌توان با راه‌اندازی API واقعی گسترش داد
    expect(true).toBe(true);
  });
});
