import { jsonSuccess, jsonError } from "@/lib/api";
import { listPublishedPlans, listServiceGroups } from "@/server/services/plan-service";

export async function GET() {
  try {
    const [plans, serviceGroups] = await Promise.all([listPublishedPlans(), listServiceGroups()]);
    return jsonSuccess({ plans, serviceGroups });
  } catch (e) { return jsonError(e); }
}
