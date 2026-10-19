import { prisma } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/crypto";
import { AppError } from "@/lib/domain/errors";
import { normalizeEmail, normalizePhone, isValidEmail, isValidIranianMobile } from "@/lib/utils";
import type { Role } from "@prisma/client";

export async function findUserByIdentifier(identifier: string) {
  const normEmail = normalizeEmail(identifier);
  const normPhone = normalizePhone(identifier);
  const where =
    isValidEmail(normEmail) && identifier.includes("@")
      ? { email: normEmail }
      : isValidIranianMobile(normPhone)
        ? { phone: normPhone }
        : null;
  // برای پشتیبانی از هر دو حالت، هر دو را چک می‌کنیم
  if (!where) {
    // تلاش برای هر دو ستون
    return prisma.user.findFirst({
      where: { OR: [{ email: normEmail }, { phone: normPhone }] },
    });
  }
  return prisma.user.findFirst({ where });
}

export async function verifyUserPassword(user: { passwordHash: string }, plain: string): Promise<boolean> {
  return verifyPassword(plain, user.passwordHash);
}

export async function incrementFailedLogin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { failedLoginAttempts: true } });
  const attempts = (user?.failedLoginAttempts ?? 0) + 1;
  const lockMinutes = attempts >= 5 ? 15 : attempts >= 3 ? 5 : 0;
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: attempts,
      lockedUntil: lockMinutes ? new Date(Date.now() + lockMinutes * 60_000) : undefined,
    },
  });
}

export async function resetFailedLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}

export async function createOwner(data: { firstName: string; lastName: string; email?: string | null; phone?: string | null; password: string }) {
  const email = data.email ? normalizeEmail(data.email) : null;
  const phone = data.phone ? normalizePhone(data.phone) : null;

  if (email && email.length > 0) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw AppError.conflict("این ایمیل قبلاً ثبت شده است.");
  }
  if (phone && phone.length > 0) {
    const exists = await prisma.user.findUnique({ where: { phone } });
    if (exists) throw AppError.conflict("این شماره موبایل قبلاً ثبت شده است.");
  }

  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: email || null,
      phone: phone || null,
      passwordHash,
      role: "OWNER" as Role,
      status: "ACTIVE",
    },
    select: { id: true, email: true, phone: true, role: true, firstName: true, lastName: true },
  });
}

export async function listUsersForAdmin(page: number, pageSize: number) {
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, status: true, clinicId: true, createdAt: true },
    }),
    prisma.user.count(),
  ]);
  return { items, total, page, pageSize };
}
