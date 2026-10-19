/**
 * برچسب‌های فارسیِ یکپارچه برای وضعیت‌ها، نقش‌ها و گروه‌های خدمت.
 * این فایل تنها منبع برچسب‌هاست تا ترجمه‌ها در صفحات مختلف یکسان بمانند.
 */

import type {
  Role,
  RequestStatus,
  PolicyStatus,
  Species,
  PetSex,
  CoverageStatus,
  LineCoverageStatus,
  ContractStatus,
  TermsStatus,
  AttachmentDocType,
  DecisionType,
  UserStatus,
  DeductibleType,
  SettlementMode,
  AssumptionStatus,
} from "@prisma/client";

export const APP_NAME = "بیمه دامپزشکی سگ و گربه";
export const APP_SHORT_NAME = "پت‌یار";

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "صاحب حیوان",
  CLINIC: "کلینیک",
  REVIEWER: "کارشناس بیمه",
  ADMIN: "مدیر سامانه",
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "فعال",
  SUSPENDED: "تعلیق‌شده",
  INVITED: "دعوت‌شده",
};

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";

export const REQUEST_STATUS_META: Record<
  RequestStatus,
  { label: string; description: string; tone: StatusTone }
> = {
  DRAFT: {
    label: "پیش‌نویس",
    description: "هنوز ارسال نشده؛ کلینیک در حال تکمیل اطلاعات است.",
    tone: "neutral",
  },
  SUBMITTED: {
    label: "ارسال‌شده",
    description: "توسط کلینیک ارسال شده و منتظر بررسی کارشناس است.",
    tone: "info",
  },
  UNDER_REVIEW: {
    label: "در حال بررسی",
    description: "کارشناس بیمه در حال بررسی ردیف‌ها و مدارک است.",
    tone: "info",
  },
  NEEDS_CORRECTION: {
    label: "نیازمند اصلاح",
    description: "کارشناس اصلاح خواسته است؛ کلینیک باید موارد را اصلاح و دوباره ارسال کند.",
    tone: "warning",
  },
  RESUBMITTED: {
    label: "اصلاح و ارسال مجدد",
    description: "پس از اصلاح دوباره ارسال شده و منتظر بررسی است.",
    tone: "info",
  },
  APPROVED: {
    label: "تأییدشده",
    description: "تأیید بیمه‌ای ثبت شده است. این وضعیت به‌معنای پرداخت نیست.",
    tone: "success",
  },
  REJECTED: {
    label: "ردشده",
    description: "درخواست با دلیل ثبت‌شده رد شده است.",
    tone: "danger",
  },
  PENDING_SETTLEMENT: {
    label: "در انتظار تسویه",
    description: "مبلغ تأیید شده و در صف تسویه است.",
    tone: "accent",
  },
  SETTLED_SIMULATED: {
    label: "تسویه‌شده (آزمایشی)",
    description: "تسویهٔ شبیه‌سازی‌شده ثبت شده؛ پرداخت واقعی انجام نشده است.",
    tone: "success",
  },
  CANCELLED: {
    label: "لغوشده",
    description: "درخواست لغو شده است.",
    tone: "neutral",
  },
};

export const POLICY_STATUS_META: Record<
  PolicyStatus,
  { label: string; tone: StatusTone }
> = {
  PENDING: { label: "در انتظار صدور", tone: "warning" },
  ACTIVE: { label: "فعال", tone: "success" },
  EXPIRED: { label: "منقضی‌شده", tone: "neutral" },
  SUSPENDED: { label: "تعلیق‌شده", tone: "warning" },
  CANCELLED: { label: "ابطال‌شده", tone: "danger" },
  REJECTED: { label: "ردشده", tone: "danger" },
};

export const SPECIES_LABEL: Record<Species, string> = {
  DOG: "سگ",
  CAT: "گربه",
};

export const PET_SEX_LABEL: Record<PetSex, string> = {
  MALE: "نر",
  FEMALE: "ماده",
  UNKNOWN: "نامشخص",
};

export const COVERAGE_STATUS_META: Record<
  CoverageStatus,
  { label: string; tone: StatusTone; icon: "check" | "x" | "question" }
> = {
  COVERED: { label: "تحت پوشش", tone: "success", icon: "check" },
  NOT_COVERED: { label: "خارج از پوشش", tone: "danger", icon: "x" },
  UNKNOWN: { label: "نامشخص / نیازمند تأیید", tone: "warning", icon: "question" },
};

export const LINE_COVERAGE_STATUS_META: Record<
  LineCoverageStatus,
  { label: string; tone: StatusTone }
> = {
  UNKNOWN: { label: "نامشخص / نیازمند بررسی", tone: "warning" },
  ELIGIBLE: { label: "واجد شرایط", tone: "success" },
  NOT_ELIGIBLE: { label: "غیرمشمول", tone: "danger" },
};

export const CONTRACT_STATUS_META: Record<
  ContractStatus,
  { label: string; tone: StatusTone }
> = {
  ACTIVE: { label: "دارای قرارداد فعال", tone: "success" },
  PENDING: { label: "در انتظار انعقاد قرارداد", tone: "warning" },
  SUSPENDED: { label: "قرارداد تعلیق‌شده", tone: "warning" },
  TERMINATED: { label: "قرارداد خاتمه‌یافته", tone: "danger" },
};

export const TERMS_STATUS_META: Record<
  TermsStatus,
  { label: string; tone: StatusTone }
> = {
  DRAFT: { label: "پیش‌نویس", tone: "neutral" },
  PROPOSED: { label: "پیشنهادی", tone: "info" },
  PENDING_APPROVAL: { label: "در انتظار تأیید", tone: "warning" },
  APPROVED: { label: "مصوب", tone: "success" },
  ARCHIVED: { label: "بایگانی‌شده", tone: "neutral" },
};

export const DEDUCTIBLE_TYPE_LABEL: Record<DeductibleType, string> = {
  NONE: "بدون فرانشیز",
  FIXED: "مبلغ ثابت",
  PERCENT: "درصدی",
  UNSPECIFIED: "تعیین نشده",
};

export const ATTACHMENT_DOC_TYPE_LABEL: Record<AttachmentDocType, string> = {
  INVOICE: "فاکتور",
  TREATMENT_REPORT: "گزارش درمان",
  LAB_RESULT: "نتیجهٔ آزمایش",
  PRESCRIPTION: "نسخه",
  IMAGING: "تصویربرداری",
  OTHER: "سایر مدارک",
};

export const DECISION_TYPE_LABEL: Record<DecisionType, string> = {
  APPROVE: "تأیید",
  REJECT: "رد",
  REQUEST_CORRECTION: "درخواست اصلاح",
  REOPENED: "بازگشت به بررسی",
};

export const SETTLEMENT_MODE_LABEL: Record<SettlementMode, string> = {
  SIMULATED: "آزمایشی (شبیه‌سازی‌شده)",
  REAL: "واقعی (در این نسخه فعال نیست)",
};

export const ASSUMPTION_STATUS_LABEL: Record<AssumptionStatus, string> = {
  DRAFT: "پیش‌نویس",
  PROPOSED: "پیشنهادی",
  APPROVED: "تأییدشده",
};

// گروه‌های خدمتِ پایه (کدها با seed هم‌خوان هستند)
export const SERVICE_GROUP_CODES = {
  EMERGENCY: "emergency",
  VISIT: "visit",
  LAB: "lab",
  IMAGING: "imaging",
  MEDICATION: "medication",
  SURGERY: "surgery",
  SPECIALIST: "specialist",
  PREVENTIVE: "preventive",
} as const;

export const SERVICE_GROUP_ORDER: string[] = [
  SERVICE_GROUP_CODES.EMERGENCY,
  SERVICE_GROUP_CODES.VISIT,
  SERVICE_GROUP_CODES.LAB,
  SERVICE_GROUP_CODES.IMAGING,
  SERVICE_GROUP_CODES.MEDICATION,
  SERVICE_GROUP_CODES.SURGERY,
  SERVICE_GROUP_CODES.SPECIALIST,
  SERVICE_GROUP_CODES.PREVENTIVE,
];

/** برچسب «نمونه/تأییدنشده» که باید کنار هر عددِ غیرمصوب نمایش داده شود */
export const ILLUSTRATIVE_BADGE = "نمونهٔ آموزشی — پیشنهاد بیمه‌ای نیست";
export const NOT_FINALIZED = "هنوز نهایی نشده";
