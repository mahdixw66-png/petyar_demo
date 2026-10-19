import { prisma } from "@/server/db";
import { AppError } from "@/lib/domain/errors";

export async function listClinics(params: { q?: string; city?: string; serviceGroupId?: string; page: number; pageSize: number }) {
  const where: Record<string, unknown> = {};
  if (params.q) {
    (where as Record<string, unknown>).OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { address: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.city) (where as Record<string, unknown>).city = { contains: params.city, mode: "insensitive" };
  if (params.serviceGroupId) {
    (where as Record<string, unknown>).services = { some: { serviceGroupId: params.serviceGroupId } };
  }
  const [items, total] = await Promise.all([
    prisma.clinic.findMany({
      where: where as never,
      orderBy: [{ contractStatus: "asc" }, { name: "asc" }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { services: { include: { serviceGroup: true } } },
    }),
    prisma.clinic.count({ where: where as never }),
  ]);
  return { items, total, page: params.page, pageSize: params.pageSize };
}

export async function getClinicBySlug(slug: string) {
  const clinic = await prisma.clinic.findUnique({ where: { slug }, include: { services: { include: { serviceGroup: true } } } });
  if (!clinic) throw AppError.notFound("کلینیک مورد نظر یافت نشد.");
  return clinic;
}

export async function getClinicById(id: string) {
  const clinic = await prisma.clinic.findUnique({ where: { id } });
  if (!clinic) throw AppError.notFound("کلینیک یافت نشد.");
  return clinic;
}

export async function searchPetsForClinic(query: string, clinicId?: string) {
  void clinicId;
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  return prisma.pet.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { publicId: { contains: q, mode: "insensitive" } },
        { owner: { firstName: { contains: q, mode: "insensitive" } } },
        { owner: { lastName: { contains: q, mode: "insensitive" } } },
        { microchipCode: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 20,
    include: {
      owner: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      policies: { where: { deletedAt: null }, include: { plan: true, planVersion: true } },
    },
  });
}
