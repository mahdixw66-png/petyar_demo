import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { getSessionFromRequest } from "@/server/auth";
import { submitRequest } from "@/server/services/request-service";
import { AppError } from "@/lib/domain/errors";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    const { id } = await params;
    const result = await submitRequest(session, id);
    return jsonSuccess(result);
  } catch (e) { return jsonError(e); }
}
