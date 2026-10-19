import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { listClinics } from "@/server/services/clinic-service";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") ?? undefined;
    const city = req.nextUrl.searchParams.get("city") ?? undefined;
    const serviceGroupId = req.nextUrl.searchParams.get("serviceGroupId") ?? undefined;
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("pageSize") ?? 12)));
    const result = await listClinics({ q, city, serviceGroupId, page, pageSize });
    return jsonSuccess(result);
  } catch (e) { return jsonError(e); }
}
