/**
 * ماشین وضعیت درخواست درمان — تنها منبع حقیقت برای انتقال وضعیت‌ها.
 *
 * هیچ API یا صفحه‌ای نباید وضعیت را مستقیماً تغییر دهد؛ همهٔ تغییرات
 * باید از طریق `canTransition` و `assertTransition` عبور کنند.
 */

import type { RequestStatus, Role } from "@prisma/client";
import { AppError } from "@/lib/domain/errors";

export type TransitionRule = {
  from: readonly RequestStatus[];
  to: RequestStatus;
  allowedRoles: readonly Role[];
  requiresReason: boolean;
  description: string;
};

// ترتیب منطقی برای نمایش timeline
export const STATUS_ORDER: RequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "NEEDS_CORRECTION",
  "RESUBMITTED",
  "APPROVED",
  "REJECTED",
  "PENDING_SETTLEMENT",
  "SETTLED_SIMULATED",
  "CANCELLED",
];

const RULES: TransitionRule[] = [
  { from: ["DRAFT"], to: "SUBMITTED", allowedRoles: ["CLINIC"], requiresReason: false, description: "ارسال درخواست توسط کلینیک" },
  { from: ["SUBMITTED", "RESUBMITTED"], to: "UNDER_REVIEW", allowedRoles: ["REVIEWER", "ADMIN"], requiresReason: false, description: "شروع بررسی توسط کارشناس" },
  { from: ["UNDER_REVIEW"], to: "NEEDS_CORRECTION", allowedRoles: ["REVIEWER", "ADMIN"], requiresReason: true, description: "درخواست اصلاح از کلینیک" },
  { from: ["NEEDS_CORRECTION"], to: "RESUBMITTED", allowedRoles: ["CLINIC"], requiresReason: false, description: "اصلاح و ارسال مجدد توسط کلینیک" },
  { from: ["UNDER_REVIEW"], to: "APPROVED", allowedRoles: ["REVIEWER", "ADMIN"], requiresReason: true, description: "تأیید بیمه‌ای (به‌معنای پرداخت نیست)" },
  { from: ["UNDER_REVIEW"], to: "REJECTED", allowedRoles: ["REVIEWER", "ADMIN"], requiresReason: true, description: "رد درخواست با دلیل ثبت‌شده" },
  { from: ["APPROVED"], to: "PENDING_SETTLEMENT", allowedRoles: ["REVIEWER", "ADMIN"], requiresReason: false, description: "انتقال به صف تسویه" },
  { from: ["PENDING_SETTLEMENT"], to: "SETTLED_SIMULATED", allowedRoles: ["REVIEWER", "ADMIN"], requiresReason: false, description: "ثبت تسویهٔ آزمایشی" },
  // لغو فقط از وضعیت‌های اولیه مجاز است
  { from: ["DRAFT", "SUBMITTED", "NEEDS_CORRECTION"], to: "CANCELLED", allowedRoles: ["CLINIC", "REVIEWER", "ADMIN"], requiresReason: true, description: "لغو درخواست" },
  // بازگشایی پس از تأیید در صورت اصلاح مؤثر (توسط کلینیک یا کارشناس)
  { from: ["APPROVED", "PENDING_SETTLEMENT"], to: "UNDER_REVIEW", allowedRoles: ["REVIEWER", "ADMIN", "CLINIC"], requiresReason: true, description: "بازگشت به بررسی پس از اصلاح مؤثر" },
];

export function findRule(from: RequestStatus, to: RequestStatus): TransitionRule | undefined {
  return RULES.find((r) => r.to === to && (r.from as readonly string[]).includes(from));
}

export function canTransition(from: RequestStatus, to: RequestStatus, role: Role): { allowed: boolean; rule?: TransitionRule; reason?: string } {
  const rule = findRule(from, to);
  if (!rule) return { allowed: false, reason: `انتقال از «${from}» به «${to}» مجاز نیست.` };
  if (!(rule.allowedRoles as readonly string[]).includes(role)) {
    return { allowed: false, rule, reason: `نقش «${role}» مجاز به این انتقال نیست.` };
  }
  return { allowed: true, rule };
}

export function assertTransition(from: RequestStatus, to: RequestStatus, role: Role, opts?: { reason?: string | null }): TransitionRule {
  const { allowed, rule, reason } = canTransition(from, to, role);
  if (!allowed || !rule) throw AppError.badState(reason ?? "انتقال وضعیت مجاز نیست.", { from, to, role });
  if (rule.requiresReason && (!opts?.reason || opts.reason.trim().length < 5)) {
    throw AppError.validation("برای این انتقال، ذکر دلیل (حداقل ۵ کاراکتر) الزامی است.");
  }
  return rule;
}

export function getAllowedTargets(from: RequestStatus, role: Role): RequestStatus[] {
  return RULES.filter((r) => (r.from as readonly string[]).includes(from) && (r.allowedRoles as readonly string[]).includes(role)).map((r) => r.to);
}

export const TERMINAL_STATUSES: ReadonlySet<RequestStatus> = new Set(["REJECTED", "SETTLED_SIMULATED", "CANCELLED"] as RequestStatus[]);
export const REVIEWABLE_STATUSES: ReadonlySet<RequestStatus> = new Set(["SUBMITTED", "RESUBMITTED", "UNDER_REVIEW"] as RequestStatus[]);

export function isTerminal(status: RequestStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
