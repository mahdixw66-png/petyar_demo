import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { getSessionFromRequest } from "@/server/auth";
import { createSettlement } from "@/server/services/settlement-service";
import { settlementSchema } from "@/lib/validators";
import { AppError } from "@/lib/domain/errors";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    const { id } = await params;
    let data: { reference?: string; note?: string } = {};
    try { const body = await req.json(); data = settlementSchema.parse(body); } catch { /* optional body */ }
    const result = await createSettlement(session, id, { reference: data.reference, note: data.note });
    return jsonSuccess(result, 201);
  } catch (e) { return jsonError(e); }
}
