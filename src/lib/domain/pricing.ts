/**
 * محاسبات قیمت‌گذاری داخلی (Sandbox).
 *
 * این ماژول فقط برای تحلیل/آموزش است و هیچ تأثیری روی طرح‌های عمومی ندارد
 * مگر اینکه نرخ‌ها توسط نقش مجاز تأیید و منتشر شوند.
 */

import { AppError } from "@/lib/domain/errors";

export type PricingInputs = {
  /** خسارت موردانتظار (ریال) — مجموع فراوانی×هزینه×سهم بیمه روی ردیف‌های مفروض */
  L: number;
  /** هزینهٔ ثابت (ریال) */
  F: number;
  /** هزینهٔ رسیدگی به خسارت (ریال) */
  R: number;
  /** بار ریسک/سرمایه (ریال) — در صورت برآورد جداگانه */
  C: number;
  /** نسبت هزینهٔ متغیر به حق بیمه (bps) — مثلاً 1500 = 15% */
  Vbps: number;
  /** حاشیهٔ سود هدف (bps) — مثلاً 1000 = 10% */
  Qbps: number;
};

export type PricingOutputs = {
  /** حق بیمهٔ سالانهٔ ناخالص (ریال) */
  P: number;
  /** مخرج کسر: 1 - V - Q (به‌صورت اعشاری) */
  denominator: number;
};

const BPS = 10_000;

export function calculateGrossPremium(inputs: PricingInputs): PricingOutputs {
  const { L, F, R, C, Vbps, Qbps } = inputs;

  for (const [k, v] of Object.entries({ L, F, R, C })) {
    if (!Number.isFinite(v) || v < 0) throw AppError.validation(`مقدار ${k} باید عدد نامنفی باشد.`);
  }
  for (const [k, v] of Object.entries({ Vbps, Qbps })) {
    if (!Number.isFinite(v) || v < 0 || v >= BPS) throw AppError.validation(`مقدار ${k} باید بین ۰ و ۱۰۰۰۰ باشد.`);
  }

  const V = Vbps / BPS;
  const Q = Qbps / BPS;
  const denom = 1 - V - Q;
  if (denom <= 0) {
    throw AppError.validation(
      `مجموع V (${(V * 100).toFixed(1)}٪) و Q (${(Q * 100).toFixed(1)}٪) باید کمتر از ۱۰۰٪ باشد؛ در غیر این صورت فرمول حق بیمه تعریف نشده است. (V + Q = ${((V + Q) * 100).toFixed(1)}٪)`,
    );
  }
  const numerator = L + F + R + C;
  const P = Math.round(numerator / denom);
  return { P, denominator: denom };
}

export type ExpectedLossInput = {
  avgCostRial: number;
  annualFrequency: number;
  insurerPayShareBps: number; // سهم پرداختی مفروض بیمه
};

export function calculateExpectedLoss(items: ExpectedLossInput[]): number {
  let total = 0;
  for (const it of items) {
    if (it.avgCostRial < 0 || it.annualFrequency < 0) throw AppError.validation("مقادیر ورودی خسارت موردانتظار باید نامنفی باشند.");
    if (it.insurerPayShareBps < 0 || it.insurerPayShareBps > BPS) throw AppError.validation("سهم بیمه باید بین ۰ و ۱۰۰٪ باشد.");
    total += it.avgCostRial * it.annualFrequency * (it.insurerPayShareBps / BPS);
  }
  return Math.round(total);
}

export function calculateLossRatio(incurredLossRial: number | null, earnedPremiumRial: number | null): number | null {
  if (incurredLossRial === null || earnedPremiumRial === null) return null;
  if (earnedPremiumRial === 0) return null;
  return incurredLossRial / earnedPremiumRial;
}

export function calculateCombinedRatio(lossRatio: number | null, expenseRatio: number | null): number | null {
  if (lossRatio === null || expenseRatio === null) return null;
  return lossRatio + expenseRatio;
}

export function formatRatio(ratio: number | null): string {
  if (ratio === null) return "داده کافی نیست";
  return `${(ratio * 100).toFixed(1)}٪`;
}
