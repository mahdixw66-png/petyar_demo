import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { getSessionFromRequest } from "@/server/auth";
import { decideRequest } from "@/server/services/request-service";
import { reviewDecisionSchema } from "@/lib/validators";
import { AppError } from "@/lib/domain/errors";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    const { id } = await params;
    const body = await req.json();
    const data = reviewDecisionSchema.parse(body);
    const result = await decideRequest(session, id, data);
    return jsonSuccess(result);
  } catch (e) { return jsonError(e); }
}
