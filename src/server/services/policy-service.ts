import { prisma } from "@/server/db";
import { AppError } from "@/lib/domain/errors";

export async function listPoliciesForOwner(ownerId: string) {
  return prisma.policy.findMany({
    where: { ownerId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { pet: true, plan: true, planVersion: true },
  });
}

export async function getPolicyById(policyId: string) {
  const policy = await prisma.policy.findUnique({ where: { id: policyId }, include: { plan: true, planVersion: true, pet: true } });
  if (!policy) throw AppError.notFound("بیمه‌نامه یافت نشد.");
  return policy;
}

export async function assertPolicyValidForDate(policyId: string, serviceDate: Date): Promise<void> {
  const policy = await prisma.policy.findUnique({ where: { id: policyId } });
  if (!policy) throw AppError.notFound("بیمه‌نامه یافت نشد.");
  if (policy.status !== "ACTIVE") throw AppError.validation("بیمه‌نامه فعال نیست و نمی‌توان برای آن درخواست ثبت کرد.");
  if (serviceDate < policy.startDate || serviceDate > policy.endDate) {
    throw AppError.validation("تاریخ مراجعه خارج از بازهٔ اعتبار بیمه‌نامه است.");
  }
}

export async function assertPolicyBelongsToPet(policyId: string, petId: string, ownerId: string): Promise<void> {
  const policy = await prisma.policy.findUnique({ where: { id: policyId } });
  if (!policy) throw AppError.notFound("بیمه‌نامه یافت نشد.");
  if (policy.petId !== petId) throw AppError.validation("بیمه‌نامه متعلق به این حیوان نیست.");
  if (policy.ownerId !== ownerId) throw AppError.forbidden("شما مالک این بیمه‌نامه نیستید.");
}
