import { prisma } from "@/server/db";
import { AppError } from "@/lib/domain/errors";
import type { SessionPayload } from "@/server/auth";
import type { RequestStatus } from "@prisma/client";
import { randomCode } from "@/lib/utils";

export async function createSettlement(
  session: SessionPayload,
  requestId: string,
  input: { reference?: string; note?: string },
) {
  if (!["REVIEWER", "ADMIN"].includes(session.role)) throw AppError.forbidden("فقط کارشناس/مدیر می‌تواند تسویه ثبت کند.");

  const req = await prisma.treatmentRequest.findUnique({ where: { id: requestId }, include: { settlement: true } });
  if (!req) throw AppError.notFound("درخواست یافت نشد.");
  if (req.status !== "PENDING_SETTLEMENT") throw AppError.badState("فقط درخواست‌های در انتظار تسویه قابل تسویه هستند.", { status: req.status });
  if (req.settlement) throw AppError.conflict("برای این درخواست قبلاً تسویه ثبت شده است.");
  if (req.insurerShareRial === null || req.insurerShareRial === undefined) throw AppError.validation("مبلغ سهم بیمه برای تسویه نامشخص است.");

  const amountRial = req.insurerShareRial;

  // جلوگیری از تسویه با مبلغ متفاوت — فقط مبلغ مصوب مجاز است
  // (پارامتر ورودی مبلغ ندارد تا نتوان مبلغ دلخواه وارد کرد)

  return prisma.$transaction(async (tx) => {
    const settlement = await tx.settlement.create({
      data: {
        requestId,
        clinicId: req.clinicId,
        amountRial,
        mode: "SIMULATED",
        reference: input.reference || `DEMO-${randomCode(8)}`,
        settledAt: new Date(),
        note: input.note || null,
        createdById: session.sub,
      },
    });
    await tx.treatmentRequest.update({
      where: { id: requestId },
      data: { status: "SETTLED_SIMULATED" as RequestStatus, settledAt: new Date(), version: { increment: 1 } },
    });
    await tx.requestStatusEvent.create({
      data: {
        requestId,
        fromStatus: "PENDING_SETTLEMENT" as RequestStatus,
        toStatus: "SETTLED_SIMULATED" as RequestStatus,
        actorId: session.sub,
        actorRole: session.role as never,
        note: `تسویهٔ آزمایشی به مبلغ ${amountRial.toLocaleString("fa-IR")} ریال ثبت شد. این پرداخت واقعی نیست.`,
      },
    });
    await tx.auditEvent.create({
      data: {
        actorId: session.sub,
        actorRole: session.role as never,
        action: "SETTLEMENT_CREATE_SIMULATED",
        entityType: "Settlement",
        entityId: settlement.id,
        result: "SUCCESS",
        summary: `تسویهٔ آزمایشی برای ${req.trackingCode} به مبلغ ${amountRial} ریال ثبت شد.`,
        metadata: { requestId, amountRial, mode: "SIMULATED" } as never,
      },
    });
    return settlement;
  });
}

export async function listSettlements(session: SessionPayload, params: { page: number; pageSize: number; mode?: string }) {
  if (!["REVIEWER", "ADMIN", "CLINIC"].includes(session.role)) throw AppError.forbidden();
  const where: Record<string, unknown> = {};
  if (session.role === "CLINIC") (where as Record<string, unknown>).clinicId = session.clinicId;
  if (params.mode) (where as Record<string, unknown>).mode = params.mode;

  const [items, total] = await Promise.all([
    prisma.settlement.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { request: { select: { trackingCode: true, pet: { select: { name: true } } } }, clinic: { select: { name: true } } },
    }),
    prisma.settlement.count({ where: where as never }),
  ]);
  return { items, total, page: params.page, pageSize: params.pageSize };
}
