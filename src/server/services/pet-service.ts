import { prisma } from "@/server/db";
import { AppError } from "@/lib/domain/errors";
import { randomCode } from "@/lib/utils";
import type { SessionPayload } from "@/server/auth";
import { petSchema } from "@/lib/validators";

export async function listPetsForOwner(ownerId: string) {
  return prisma.pet.findMany({
    where: { ownerId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { policies: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, include: { plan: true, planVersion: true } } },
  });
}

export async function getPetForOwner(petId: string, ownerId: string) {
  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId, deletedAt: null } });
  if (!pet) throw AppError.notFound("حیوان مورد نظر یافت نشد یا شما مالک آن نیستید.");
  return pet;
}

export async function createPet(ownerId: string, input: unknown) {
  const data = petSchema.parse(input);
  const birthDate = data.birthDate ? new Date(data.birthDate) : null;
  if (data.birthDate && birthDate && Number.isNaN(birthDate.getTime())) throw AppError.validation("تاریخ تولد معتبر نیست.");

  // اگر تاریخ تولد ناقص باشد ولی سن تقریبی داده شده، همان را ذخیره کن
  let approxAgeMonths: number | null = null;
  if (typeof data.approxAgeMonths === "number" && !Number.isNaN(data.approxAgeMonths)) approxAgeMonths = data.approxAgeMonths;
  const weightKg = typeof data.weightKg === "number" && !Number.isNaN(data.weightKg) ? data.weightKg : null;

  return prisma.pet.create({
    data: {
      publicId: `PET-${randomCode(8)}`,
      ownerId,
      name: data.name,
      species: data.species,
      breed: data.breed || null,
      sex: data.sex,
      birthDate,
      approxAgeMonths,
      microchipCode: data.microchipCode || null,
      weightKg,
      sterilized: data.sterilized ?? null,
      notes: data.notes || null,
    },
  });
}

export async function updatePet(petId: string, ownerId: string, input: unknown) {
  const data = petSchema.parse(input);
  const existing = await getPetForOwner(petId, ownerId);
  void existing;
  const birthDate = data.birthDate ? new Date(data.birthDate) : null;
  return prisma.pet.update({
    where: { id: petId },
    data: {
      name: data.name,
      species: data.species,
      breed: data.breed || null,
      sex: data.sex,
      birthDate,
      approxAgeMonths: typeof data.approxAgeMonths === "number" && !Number.isNaN(data.approxAgeMonths) ? data.approxAgeMonths : null,
      microchipCode: data.microchipCode || null,
      weightKg: typeof data.weightKg === "number" && !Number.isNaN(data.weightKg) ? data.weightKg : null,
      sterilized: data.sterilized ?? null,
      notes: data.notes || null,
    },
  });
}

export async function assertOwnerOwnsPet(petId: string, ownerId: string): Promise<void> {
  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId, deletedAt: null }, select: { id: true } });
  if (!pet) throw AppError.forbidden("شما مالک این حیوان نیستید.");
}
