import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { getSessionFromRequest } from "@/server/auth";
import { searchPetsForClinic } from "@/server/services/clinic-service";
import { AppError } from "@/lib/domain/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    if (!["CLINIC","REVIEWER","ADMIN"].includes(session.role)) throw AppError.forbidden();
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const result = await searchPetsForClinic(q, session.clinicId ?? undefined);
    return jsonSuccess(result);
  } catch (e) { return jsonError(e); }
}
