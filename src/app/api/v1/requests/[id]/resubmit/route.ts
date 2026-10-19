import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { getSessionFromRequest } from "@/server/auth";
import { resubmitAfterCorrection } from "@/server/services/request-service";
import { AppError } from "@/lib/domain/errors";
import { serviceLineInputSchema } from "@/lib/validators";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    const { id } = await params;
    let lines: { serviceGroupId: string; description: string; quantity: number; unitAmountRial: number }[] | undefined;
    try {
      const body = await req.json();
      if (body?.lines) {
        const parsed = serviceLineInputSchema.array().parse(body.lines);
        lines = parsed;
      }
    } catch { /* body optional */ }
    const result = await resubmitAfterCorrection(session, id, lines);
    return jsonSuccess(result);
  } catch (e) { return jsonError(e); }
}
