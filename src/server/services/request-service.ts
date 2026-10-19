import { prisma } from "@/server/db";
import { AppError } from "@/lib/domain/errors";
import { randomCode } from "@/lib/utils";
import { assertTransition } from "@/lib/domain/request-state-machine";
import { lineTotal, assertLinesSumMatchesTotal } from "@/lib/domain/money-ops";
import type { SessionPayload } from "@/server/auth";
import type { RequestStatus, Role } from "@prisma/client";
import { audit } from "@/server/audit";

function calcTotal(lines: { unitAmountRial: number; quantity: number }[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l.unitAmountRial, l.quantity), 0);
}

export async function createDraftRequest(
  session: SessionPayload,
  input: {
    petId: string;
    policyId: string;
    serviceDate: string;
    invoiceNumber?: string;
    clinicalSummary?: string;
    idempotencyKey?: string;
    lines: { serviceGroupId: string; description: string; quantity: number; unitAmountRial: number }[];
  },
) {
  if (session.role !== "CLINIC") throw AppError.forbidden("فقط کلینیک می‌تواند درخواست ایجاد کند.");
  if (!session.clinicId) throw AppError.forbidden("حساب کلینیک به هیچ کلینیک متصل نیست.");

  const serviceDate = new Date(input.serviceDate);
  if (Number.isNaN(serviceDate.getTime())) throw AppError.validation("تاریخ مراجعه معتبر نیست.");
  if (serviceDate > new Date(Date.now() + 24 * 60 * 60 * 1000)) throw AppError.validation("تاریخ مراجعه نمی‌تواند در آینده باشد.");

  // اعتبارسنجی پیوستگی‌ها
  const pet = await prisma.pet.findUnique({ where: { id: input.petId } });
  if (!pet || pet.deletedAt) throw AppError.notFound("حیوان یافت نشد.");
  const policy = await prisma.policy.findUnique({ where: { id: input.policyId }, include: { planVersion: true } });
  if (!policy || policy.deletedAt) throw AppError.notFound("بیمه‌نامه یافت نشد.");
  if (policy.petId !== input.petId) throw AppError.validation("بیمه‌نامه متعلق به این حیوان نیست.");
  if (policy.status !== "ACTIVE") throw AppError.validation("بیمه‌نامه فعال نیست.");
  if (serviceDate < policy.startDate || serviceDate > policy.endDate) throw AppError.validation("تاریخ مراجعه خارج از بازهٔ اعتبار بیمه‌نامه است.");

  if (input.idempotencyKey) {
    const existing = await prisma.treatmentRequest.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) return existing;
  }

  const totalAmountRial = calcTotal(input.lines);

  const trackingCode = `TR-${randomCode(8)}`;
  const publicPolIdCheck = await prisma.policy.findUnique({ where: { id: input.policyId }, select: { ownerId: true } });

  const created = await prisma.$transaction(async (tx) => {
    const req = await tx.treatmentRequest.create({
      data: {
        trackingCode,
        clinicId: session.clinicId!,
        petId: input.petId,
        policyId: input.policyId,
        ownerId: publicPolIdCheck!.ownerId,
        createdById: session.sub,
        serviceDate,
        invoiceNumber: input.invoiceNumber || null,
        clinicalSummary: input.clinicalSummary || null,
        totalAmountRial,
        status: "DRAFT" as RequestStatus,
        idempotencyKey: input.idempotencyKey || null,
      },
    });
    for (let i = 0; i < input.lines.length; i++) {
      const l = input.lines[i]!;
      const lt = lineTotal(l.unitAmountRial, l.quantity);
      await tx.serviceLine.create({
        data: {
          requestId: req.id,
          serviceGroupId: l.serviceGroupId,
          description: l.description,
          quantity: l.quantity,
          unitAmountRial: l.unitAmountRial,
          lineTotalRial: lt,
          sortOrder: i,
        },
      });
    }
    await tx.requestStatusEvent.create({
      data: { requestId: req.id, fromStatus: null, toStatus: "DRAFT", actorId: session.sub, actorRole: session.role as Role, note: "ایجاد پیش‌نویس توسط کلینیک" },
    });
    return req;
  });

  await audit({ actor: session, action: "REQUEST_CREATE_DRAFT", entityType: "TreatmentRequest", entityId: created.id, result: "SUCCESS", summary: `پیش‌نویس ${trackingCode} ایجاد شد.` });

  return prisma.treatmentRequest.findUnique({
    where: { id: created.id },
    include: { lines: { include: { serviceGroup: true } }, pet: true, policy: { include: { plan: true } }, clinic: true },
  });
}

export async function submitRequest(session: SessionPayload, requestId: string) {
  const req = await prisma.treatmentRequest.findUnique({ where: { id: requestId }, include: { lines: true } });
  if (!req) throw AppError.notFound("درخواست یافت نشد.");
  if (session.role !== "CLINIC" || session.clinicId !== req.clinicId) throw AppError.forbidden("شما مجاز به ارسال این درخواست نیستید.");
  assertTransition(req.status as RequestStatus, "SUBMITTED", session.role as Role);
  if (req.lines.length === 0) throw AppError.validation("درخواست بدون ردیف خدمت قابل ارسال نیست.");
  const sum = req.lines.reduce((a, l) => a + l.lineTotalRial, 0);
  if (sum !== req.totalAmountRial) throw AppError.validation("جمع ردیف‌ها با مبلغ کل سازگار نیست.");

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.treatmentRequest.update({ where: { id: requestId }, data: { status: "SUBMITTED" as RequestStatus, submittedAt: new Date(), version: { increment: 1 } } });
    await tx.requestStatusEvent.create({ data: { requestId, fromStatus: req.status as RequestStatus, toStatus: "SUBMITTED" as RequestStatus, actorId: session.sub, actorRole: session.role as Role, note: "ارسال توسط کلینیک" } });
    return u;
  });
  await audit({ actor: session, action: "REQUEST_SUBMIT", entityType: "TreatmentRequest", entityId: requestId, result: "SUCCESS", summary: `درخواست ${req.trackingCode} ارسال شد.` });
  return updated;
}

export async function claimForReview(session: SessionPayload, requestId: string) {
  const req = await prisma.treatmentRequest.findUnique({ where: { id: requestId } });
  if (!req) throw AppError.notFound("درخواست یافت نشد.");
  if (!["REVIEWER", "ADMIN"].includes(session.role)) throw AppError.forbidden();
  assertTransition(req.status as RequestStatus, "UNDER_REVIEW", session.role as Role);
  return prisma.$transaction(async (tx) => {
    const u = await tx.treatmentRequest.update({ where: { id: requestId }, data: { status: "UNDER_REVIEW" as RequestStatus, assignedReviewerId: session.sub, version: { increment: 1 } } });
    await tx.requestStatusEvent.create({ data: { requestId, fromStatus: req.status as RequestStatus, toStatus: "UNDER_REVIEW" as RequestStatus, actorId: session.sub, actorRole: session.role as Role, note: "شروع بررسی" } });
    return u;
  });
}

export async function decideRequest(
  session: SessionPayload,
  requestId: string,
  input: { decision: "APPROVE" | "REJECT" | "REQUEST_CORRECTION"; reason: string; eligibleAmountRial?: number; insurerShareRial?: number; ownerShareRial?: number; lineDecisions?: { serviceLineId: string; coverageStatus: "ELIGIBLE" | "NOT_ELIGIBLE" | "UNKNOWN"; eligibleAmountRial?: number | null; insurerShareRial?: number | null; ownerShareRial?: number | null; decisionReason?: string | null }[] },
) {
  const req = await prisma.treatmentRequest.findUnique({ where: { id: requestId }, include: { lines: true } });
  if (!req) throw AppError.notFound("درخواست یافت نشد.");
  if (!["REVIEWER", "ADMIN"].includes(session.role)) throw AppError.forbidden();
  if (req.status !== "UNDER_REVIEW") throw AppError.badState("فقط درخواست‌های در حال بررسی قابل تصمیم‌گیری هستند.");

  let targetStatus: RequestStatus;
  if (input.decision === "APPROVE") targetStatus = "APPROVED";
  else if (input.decision === "REJECT") targetStatus = "REJECTED";
  else targetStatus = "NEEDS_CORRECTION";

  assertTransition(req.status as RequestStatus, targetStatus, session.role as Role, { reason: input.reason });

  // اعتبارسنجی سهم‌ها در صورت تأیید
  let eligibleAmountRial: number | null = null;
  let insurerShareRial: number | null = null;
  let ownerShareRial: number | null = null;

  if (input.decision === "APPROVE") {
    if (input.eligibleAmountRial === undefined || input.insurerShareRial === undefined || input.ownerShareRial === undefined) {
      throw AppError.validation("برای تأیید، مبلغ واجد شرایط و سهم‌ها الزامی است.");
    }
    eligibleAmountRial = input.eligibleAmountRial;
    insurerShareRial = input.insurerShareRial;
    ownerShareRial = input.ownerShareRial;
    if (eligibleAmountRial > req.totalAmountRial) throw AppError.validation("مبلغ واجد شرایط نمی‌تواند از مبلغ کل بیشتر باشد.");
    if (insurerShareRial + ownerShareRial !== eligibleAmountRial) throw AppError.validation("جمع سهم بیمه و مالک باید برابر مبلغ واجد شرایط باشد.");
    if (eligibleAmountRial < 0 || insurerShareRial < 0 || ownerShareRial < 0) throw AppError.validation("مبالغ نمی‌توانند منفی باشند.");
  }

  if (input.decision === "REJECT" && (!input.reason || input.reason.trim().length < 5)) {
    throw AppError.validation("دلیل رد الزامی است.");
  }

  const before = { status: req.status, eligibleAmountRial: req.eligibleAmountRial, insurerShareRial: req.insurerShareRial, ownerShareRial: req.ownerShareRial };
  const after = { status: targetStatus, eligibleAmountRial, insurerShareRial, ownerShareRial };

  return prisma.$transaction(async (tx) => {
    // به‌روزرسانی ردیف‌ها در صورت ارسال lineDecisions
    if (input.lineDecisions && input.lineDecisions.length > 0) {
      for (const ld of input.lineDecisions) {
        const line = req.lines.find((l) => l.id === ld.serviceLineId);
        if (!line) throw AppError.notFound(`ردیف ${ld.serviceLineId} یافت نشد.`);
        await tx.serviceLine.update({
          where: { id: ld.serviceLineId },
          data: {
            coverageStatus: ld.coverageStatus as never,
            eligibleAmountRial: ld.eligibleAmountRial ?? null,
            insurerShareRial: ld.insurerShareRial ?? null,
            ownerShareRial: ld.ownerShareRial ?? null,
            decisionReason: ld.decisionReason || null,
            decidedById: session.sub,
            decidedAt: new Date(),
          },
        });
      }
    }

    const updated = await tx.treatmentRequest.update({
      where: { id: requestId },
      data: {
        status: targetStatus,
        eligibleAmountRial,
        insurerShareRial,
        ownerShareRial,
        rejectionReason: input.decision === "REJECT" ? input.reason : null,
        correctionReason: input.decision === "REQUEST_CORRECTION" ? input.reason : null,
        reviewedAt: new Date(),
        decidedAt: ["APPROVED", "REJECTED"].includes(targetStatus) ? new Date() : null,
        version: { increment: 1 },
      },
    });
    await tx.reviewDecision.create({
      data: {
        requestId,
        reviewerId: session.sub,
        decision: input.decision as never,
        reason: input.reason,
        before: before as never,
        after: after as never,
        eligibleAmountRial,
        insurerShareRial,
        ownerShareRial,
      },
    });
    await tx.requestStatusEvent.create({
      data: {
        requestId,
        fromStatus: req.status as RequestStatus,
        toStatus: targetStatus,
        actorId: session.sub,
        actorRole: session.role as Role,
        note: input.reason,
      },
    });
    return updated;
  });
}

export async function resubmitAfterCorrection(session: SessionPayload, requestId: string, lines?: { serviceGroupId: string; description: string; quantity: number; unitAmountRial: number }[]) {
  const req = await prisma.treatmentRequest.findUnique({ where: { id: requestId }, include: { lines: true } });
  if (!req) throw AppError.notFound("درخواست یافت نشد.");
  if (session.role !== "CLINIC" || session.clinicId !== req.clinicId) throw AppError.forbidden();
  if (req.status !== "NEEDS_CORRECTION") throw AppError.badState("فقط درخواست‌های نیازمند اصلاح قابل ارسال مجدد هستند.");

  return prisma.$transaction(async (tx) => {
    if (lines && lines.length > 0) {
      // حذف ردیف‌های قبلی و جایگزینی (نسخهٔ قبلی در audit باقی می‌ماند)
      await tx.serviceLine.deleteMany({ where: { requestId } });
      let total = 0;
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i]!;
        const lt = lineTotal(l.unitAmountRial, l.quantity);
        total += lt;
        await tx.serviceLine.create({
          data: {
            requestId,
            serviceGroupId: l.serviceGroupId,
            description: l.description,
            quantity: l.quantity,
            unitAmountRial: l.unitAmountRial,
            lineTotalRial: lt,
            sortOrder: i,
          },
        });
      }
      await tx.treatmentRequest.update({ where: { id: requestId }, data: { totalAmountRial: total } });
    }
    const updated = await tx.treatmentRequest.update({ where: { id: requestId }, data: { status: "RESUBMITTED" as RequestStatus, version: { increment: 1 } } });
    await tx.requestStatusEvent.create({ data: { requestId, fromStatus: "NEEDS_CORRECTION" as RequestStatus, toStatus: "RESUBMITTED" as RequestStatus, actorId: session.sub, actorRole: session.role as Role, note: "ارسال مجدد پس از اصلاح" } });
    return updated;
  });
}

export async function markPendingSettlement(session: SessionPayload, requestId: string) {
  const req = await prisma.treatmentRequest.findUnique({ where: { id: requestId } });
  if (!req) throw AppError.notFound("درخواست یافت نشد.");
  if (!["REVIEWER", "ADMIN"].includes(session.role)) throw AppError.forbidden();
  assertTransition(req.status as RequestStatus, "PENDING_SETTLEMENT", session.role as Role);
  return prisma.$transaction(async (tx) => {
    const u = await tx.treatmentRequest.update({ where: { id: requestId }, data: { status: "PENDING_SETTLEMENT" as RequestStatus, version: { increment: 1 } } });
    await tx.requestStatusEvent.create({ data: { requestId, fromStatus: req.status as RequestStatus, toStatus: "PENDING_SETTLEMENT" as RequestStatus, actorId: session.sub, actorRole: session.role as Role, note: "انتقال به صف تسویه" } });
    return u;
  });
}

export async function getRequestByIdForActor(requestId: string, session: SessionPayload) {
  const req = await prisma.treatmentRequest.findUnique({
    where: { id: requestId },
    include: {
      lines: { include: { serviceGroup: true }, orderBy: { sortOrder: "asc" } },
      pet: { include: { owner: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } } },
      policy: { include: { plan: true, planVersion: true } },
      clinic: true,
      attachments: true,
      decisions: { orderBy: { createdAt: "desc" }, include: { reviewer: { select: { firstName: true, lastName: true } } } },
      statusEvents: { orderBy: { createdAt: "asc" } },
      settlement: true,
    },
  });
  if (!req) throw AppError.notFound("درخواست یافت نشد.");

  // کنترل دسترسی
  if (session.role === "OWNER" && req.ownerId !== session.sub) throw AppError.forbidden("شما مجاز به مشاهدهٔ این درخواست نیستید.");
  if (session.role === "CLINIC" && req.clinicId !== session.clinicId) throw AppError.forbidden("این درخواست متعلق به کلینیک شما نیست.");
  // REVIEWER/ADMIN همه را می‌بینند

  return req;
}

export async function listRequestsForActor(session: SessionPayload, params: { status?: string; page: number; pageSize: number; q?: string }) {
  const where: Record<string, unknown> = {};
  if (session.role === "OWNER") (where as Record<string, unknown>).ownerId = session.sub;
  else if (session.role === "CLINIC") (where as Record<string, unknown>).clinicId = session.clinicId;
  // REVIEWER/ADMIN: no filter

  if (params.status) (where as Record<string, unknown>).status = params.status;
  if (params.q) {
    (where as Record<string, unknown>).OR = [
      { trackingCode: { contains: params.q, mode: "insensitive" } },
      { invoiceNumber: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.treatmentRequest.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        pet: { select: { name: true, species: true } },
        clinic: { select: { name: true } },
        policy: { select: { publicId: true } },
        lines: { select: { lineTotalRial: true } },
      },
    }),
    prisma.treatmentRequest.count({ where: where as never }),
  ]);
  return { items, total, page: params.page, pageSize: params.pageSize };
}
