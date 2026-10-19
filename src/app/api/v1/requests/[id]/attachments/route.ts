import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { getSessionFromRequest } from "@/server/auth";
import { AppError } from "@/lib/domain/errors";
import { prisma } from "@/server/db";
import { saveFile, generateStorageKey, validateFileMeta } from "@/server/storage";
import { randomBytes } from "node:crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    const { id } = await params;
    const treatment = await prisma.treatmentRequest.findUnique({ where: { id } });
    if (!treatment) throw AppError.notFound("درخواست یافت نشد.");
    if (session.role === "CLINIC" && treatment.clinicId !== session.clinicId) throw AppError.forbidden();
    if (session.role === "OWNER" && treatment.ownerId !== session.sub) throw AppError.forbidden();
    if (!["CLINIC", "REVIEWER", "ADMIN"].includes(session.role) && session.role !== "OWNER") throw AppError.forbidden();

    // فقط کلینیک صاحب درخواست می‌تواند فایل اضافه کند و فقط در وضعیت‌های اولیه
    if (session.role === "CLINIC" && !["DRAFT", "NEEDS_CORRECTION", "RESUBMITTED"].includes(treatment.status)) {
      throw AppError.badState("در این وضعیت امکان افزودن مدرک وجود ندارد.");
    }
    if (treatment.status === "SETTLED_SIMULATED" || treatment.status === "REJECTED") throw AppError.badState("پرونده بسته شده است.");

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const docType = (form.get("docType") as string) || "OTHER";
    if (!file) throw AppError.validation("فایل ارسال نشده است.");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    validateFileMeta(file.name, file.type, buffer.length);

    const storageKey = generateStorageKey(file.name);
    const { sizeBytes, checksum } = await saveFile(storageKey, buffer);

    const attachment = await prisma.attachment.create({
      data: {
        requestId: id,
        uploadedById: session.sub,
        docType: docType as never,
        storageKey,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes,
        checksum,
      },
    });
    return jsonSuccess(attachment, 201);
  } catch (e) { return jsonError(e); }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw AppError.unauthenticated();
    const { id } = await params;
    const treatment = await prisma.treatmentRequest.findUnique({ where: { id } });
    if (!treatment) throw AppError.notFound("درخواست یافت نشد.");
    if (session.role === "OWNER" && treatment.ownerId !== session.sub) throw AppError.forbidden();
    if (session.role === "CLINIC" && treatment.clinicId !== session.clinicId) throw AppError.forbidden();
    const attachments = await prisma.attachment.findMany({ where: { requestId: id, deletedAt: null }, orderBy: { createdAt: "desc" } });
    return jsonSuccess(attachments);
  } catch (e) { return jsonError(e); }
}
