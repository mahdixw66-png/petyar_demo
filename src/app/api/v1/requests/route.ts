import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { getSessionFromRequest } from "@/server/auth";
import { createDraftRequest, listRequestsForActor } from "@/server/services/request-service";
import { createRequestSchema } from "@/lib/validators";
import { AppError } from "@/lib/domain/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    const q = req.nextUrl.searchParams.get("q") ?? undefined;
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("pageSize") ?? 12)));
    const result = await listRequestsForActor(session, { status, page, pageSize, q });
    return jsonSuccess(result);
  } catch (e) { return jsonError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    const body = await req.json();
    const data = createRequestSchema.parse(body);
    const result = await createDraftRequest(session, {
      petId: data.petId,
      policyId: data.policyId,
      serviceDate: data.serviceDate,
      invoiceNumber: data.invoiceNumber || undefined,
      clinicalSummary: data.clinicalSummary || undefined,
      idempotencyKey: data.idempotencyKey || undefined,
      lines: data.lines,
    });
    return jsonSuccess(result, 201);
  } catch (e) { return jsonError(e); }
}
