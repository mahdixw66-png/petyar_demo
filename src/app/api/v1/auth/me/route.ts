import { jsonSuccess, jsonError } from "@/lib/api";
import { getSessionFromRequest } from "@/server/auth";

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return jsonSuccess({ authenticated: false as const });
    return jsonSuccess({ authenticated: true as const, user: session });
  } catch (e) { return jsonError(e); }
}
