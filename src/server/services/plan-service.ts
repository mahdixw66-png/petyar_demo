import { prisma } from "@/server/db";

export async function listPublishedPlans() {
  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      versions: {
        where: { isPublished: true, status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { coverageRules: { include: { serviceGroup: true } }, exclusions: true },
      },
    },
  });
}

export async function listAllPlansForManagement() {
  return prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
    include: { versions: { orderBy: { createdAt: "desc" } } },
  });
}

export async function getPlanByCode(code: string) {
  return prisma.plan.findUnique({
    where: { code },
    include: {
      versions: {
        orderBy: { createdAt: "desc" },
        include: { coverageRules: { include: { serviceGroup: true } }, exclusions: true },
      },
    },
  });
}

export async function listServiceGroups() {
  return prisma.serviceGroup.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
}
