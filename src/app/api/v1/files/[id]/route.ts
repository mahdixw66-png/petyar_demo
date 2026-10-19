import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/server/auth";
import { prisma } from "@/server/db";
import { readPrivateFile } from "@/server/storage";
import { AppError } from "@/lib/domain/errors";
import { jsonError } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    const { id } = await params;
    const att = await prisma.attachment.findUnique({ where: { id }, include: { request: true } });
    if (!att || att.deletedAt) throw AppError.notFound("فایل یافت نشد.");
    // access control
    if (session.role === "OWNER" && att.request.ownerId !== session.sub) throw AppError.forbidden();
    if (session.role === "CLINIC" && att.request.clinicId !== session.clinicId) throw AppError.forbidden();
    const buffer = await readPrivateFile(att.storageKey);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": att.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(att.originalName)}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (e) { return jsonError(e); }
}
