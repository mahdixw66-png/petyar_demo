import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { getSessionFromRequest } from "@/server/auth";
import { getPetForOwner, updatePet } from "@/server/services/pet-service";
import { AppError } from "@/lib/domain/errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    const { id } = await params;
    const pet = await getPetForOwner(id, session.sub);
    return jsonSuccess(pet);
  } catch (e) { return jsonError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    const { id } = await params;
    const body = await req.json();
    const pet = await updatePet(id, session.sub, body);
    return jsonSuccess(pet);
  } catch (e) { return jsonError(e); }
}
