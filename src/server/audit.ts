import { prisma } from "@/server/db";
import type { Role } from "@prisma/client";
import type { SessionPayload } from "@/server/auth";

export type AuditInput = {
  actor?: SessionPayload | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  result: "SUCCESS" | "DENIED" | "ERROR";
  summary: string;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
};

export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        actorId: input.actor?.sub ?? null,
        actorRole: (input.actor?.role as Role) ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        result: input.result,
        summary: input.summary,
        metadata: input.metadata ? (input.metadata as never) : undefined,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (e) {
    // audit هرگز نباید مسیر اصلی را بشکند
    console.error("[audit] failed", e);
  }
}
