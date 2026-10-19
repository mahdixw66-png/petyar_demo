import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { getSessionFromRequest } from "@/server/auth";
import { getRequestByIdForActor } from "@/server/services/request-service";
import { AppError } from "@/lib/domain/errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    const { id } = await params;
    const data = await getRequestByIdForActor(id, session);
    return jsonSuccess(data);
  } catch (e) { return jsonError(e); }
}
