/**
 * طرح‌های اعتبارسنجی Zod — تنها منبع حقیقت برای ورودی‌های کلاینت و سرور.
 * پیام‌ها فارسی و قابل نمایش مستقیم به کاربر هستند.
 */

import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("ایمیل معتبر وارد کنید."))
  .optional()
  .or(z.literal(""));

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.")
  .optional()
  .or(z.literal(""));

export const passwordSchema = z
  .string()
  .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.")
  .max(128, "رمز عبور بیش از حد طولانی است.");

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "نام الزامی است.").max(80),
    lastName: z.string().trim().min(1, "نام خانوادگی الزامی است.").max(80),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v === true, { message: "پذیرش شرایط استفاده الزامی است." }),
  })
  .superRefine((data, ctx) => {
    const hasEmail = !!data.email;
    const hasPhone = !!data.phone;
    if (!hasEmail && !hasPhone) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "حداقل یکی از ایمیل یا شماره موبایل الزامی است." });
      ctx.addIssue({ code: "custom", path: ["phone"], message: "حداقل یکی از ایمیل یا شماره موبایل الزامی است." });
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "تکرار رمز با رمز اصلی مطابقت ندارد." });
    }
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "ایمیل یا شماره موبایل را وارد کنید."),
  password: z.string().min(1, "رمز عبور را وارد کنید."),
});

export const petSchema = z.object({
  name: z.string().trim().min(1, "نام حیوان الزامی است.").max(60),
  species: z.enum(["DOG", "CAT"], { message: "گونه را انتخاب کنید." }),
  breed: z.string().trim().max(80).optional().or(z.literal("")),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
  birthDate: z.string().optional().or(z.literal("")),
  approxAgeMonths: z.coerce.number().int().min(0).max(400).optional().or(z.literal("")),
  microchipCode: z.string().trim().max(40).optional().or(z.literal("")),
  weightKg: z.coerce.number().min(0).max(200).optional().or(z.literal("")),
  sterilized: z.boolean().optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const serviceLineInputSchema = z.object({
  serviceGroupId: z.string().min(1, "گروه خدمت را انتخاب کنید."),
  description: z.string().trim().min(2, "شرح خدمت الزامی است.").max(400),
  quantity: z.coerce.number().int().min(1).max(1000),
  unitAmountRial: z.coerce.number().int().min(0).max(10_000_000_000),
});

export const createRequestSchema = z.object({
  petId: z.string().min(1, "حیوان را انتخاب کنید."),
  policyId: z.string().min(1, "بیمه‌نامه را انتخاب کنید."),
  serviceDate: z.string().min(1, "تاریخ مراجعه الزامی است."),
  invoiceNumber: z.string().trim().max(80).optional().or(z.literal("")),
  clinicalSummary: z.string().trim().max(2000).optional().or(z.literal("")),
  idempotencyKey: z.string().trim().max(80).optional().or(z.literal("")),
  lines: z.array(serviceLineInputSchema).min(1, "حداقل یک ردیف خدمت اضافه کنید.").max(20),
});

export const reviewDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_CORRECTION"]),
  reason: z.string().trim().min(5, "دلیل باید حداقل ۵ کاراکتر باشد.").max(2000),
  eligibleAmountRial: z.coerce.number().int().min(0).max(10_000_000_000).optional(),
  insurerShareRial: z.coerce.number().int().min(0).max(10_000_000_000).optional(),
  ownerShareRial: z.coerce.number().int().min(0).max(10_000_000_000).optional(),
  lineDecisions: z
    .array(
      z.object({
        serviceLineId: z.string().min(1),
        coverageStatus: z.enum(["ELIGIBLE", "NOT_ELIGIBLE", "UNKNOWN"]),
        eligibleAmountRial: z.coerce.number().int().min(0).nullable().optional(),
        insurerShareRial: z.coerce.number().int().min(0).nullable().optional(),
        ownerShareRial: z.coerce.number().int().min(0).nullable().optional(),
        decisionReason: z.string().trim().max(500).optional().or(z.literal("")),
      }),
    )
    .optional(),
});

export const settlementSchema = z.object({
  reference: z.string().trim().max(80).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const pricingAssumptionSchema = z.object({
  code: z.string().trim().min(1, "کد الزامی است.").max(40),
  name: z.string().trim().min(1, "نام الزامی است.").max(120),
  species: z.enum(["DOG", "CAT"]),
  serviceGroupId: z.string().optional().or(z.literal("")),
  avgCostRial: z.coerce.number().int().min(0).max(10_000_000_000),
  annualFrequency: z.coerce.number().min(0).max(100),
  insurerPayShareBps: z.coerce.number().int().min(0).max(10000),
  source: z.string().trim().min(1, "منبع برآورد الزامی است.").max(300),
  estimatedAt: z.string().min(1, "تاریخ برآورد الزامی است."),
  status: z.enum(["DRAFT", "PROPOSED", "APPROVED"]).default("DRAFT"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const pricingRunSchema = z.object({
  name: z.string().trim().min(1, "نام الزامی است.").max(120),
  species: z.enum(["DOG", "CAT"]),
  L: z.coerce.number().int().min(0),
  F: z.coerce.number().int().min(0),
  R: z.coerce.number().int().min(0),
  C: z.coerce.number().int().min(0),
  Vbps: z.coerce.number().int().min(0).max(9999),
  Qbps: z.coerce.number().int().min(0).max(9999),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const clinicSearchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(80).optional(),
  serviceGroupId: z.string().optional(),
  species: z.enum(["DOG", "CAT"]).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PetInput = z.infer<typeof petSchema>;
export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;
