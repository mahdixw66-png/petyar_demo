import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { getSessionFromRequest } from "@/server/auth";
import { prisma } from "@/server/db";
import { AppError } from "@/lib/domain/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    // return policies relevant to session
    if (session.role === "OWNER") {
      const policies = await prisma.policy.findMany({ where: { ownerId: session.sub, deletedAt: null }, include: { plan: true, pet: true } });
      return jsonSuccess(policies);
    }
    if (session.role === "CLINIC") {
      // for clinic, allow query by petId
      const petId = req.nextUrl.searchParams.get("petId");
      if (!petId) return jsonSuccess([]);
      const policies = await prisma.policy.findMany({ where: { petId, deletedAt: null, status: "ACTIVE" }, include: { plan: true, pet: true } });
      return jsonSuccess(policies);
    }
    // reviewer/admin
    const policies = await prisma.policy.findMany({ where: { deletedAt: null }, take: 50, include: { plan: true, pet: true } });
    return jsonSuccess(policies);
  } catch (e) { return jsonError(e); }
}
