import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { getSessionFromRequest } from "@/server/auth";
import { listPetsForOwner, createPet } from "@/server/services/pet-service";
import { AppError } from "@/lib/domain/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    if (session.role !== "OWNER" && session.role !== "ADMIN") {
      // کلینیک هم می‌تواند برای جستجو حیوانات را ببیند via search endpoint
      // اما این endpoint فقط برای مالک
      if (session.role === "CLINIC") return jsonSuccess([]);
    }
    const ownerId = session.role === "OWNER" ? session.sub : (req.nextUrl.searchParams.get("ownerId") ?? session.sub);
    const pets = await listPetsForOwner(ownerId);
    return jsonSuccess(pets);
  } catch (e) { return jsonError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    if (session.role !== "OWNER") throw AppError.forbidden("فقط صاحب حیوان می‌تواند حیوان ثبت کند.");
    const body = await req.json();
    const pet = await createPet(session.sub, body);
    return jsonSuccess(pet, 201);
  } catch (e) { return jsonError(e); }
}
