/**
 * عملیات مبلغیِ حوزه — همهٔ جمع‌ها و اعتبارسنجی‌های مبلغی در یک جا.
 */

import { AppError } from "@/lib/domain/errors";
import { MONEY_LIMITS, applyBps, BPS_DIVISOR } from "@/lib/money";

export function assertPositiveAmount(value: number, label = "مبلغ"): void {
  if (!Number.isInteger(value)) throw AppError.validation(`${label} باید عدد صحیح (ریال) باشد.`);
  if (value < 0) throw AppError.validation(`${label} نمی‌تواند منفی باشد.`);
  if (value > MONEY_LIMITS.MAX_AMOUNT_RIAL) throw AppError.validation(`${label} بیش از سقف مجاز است.`);
}

export function assertQuantity(qty: number): void {
  if (!Number.isInteger(qty) || qty < 1 || qty > MONEY_LIMITS.MAX_QUANTITY) {
    throw AppError.validation(`تعداد باید عدد صحیح بین ۱ و ${MONEY_LIMITS.MAX_QUANTITY} باشد.`);
  }
}

export function lineTotal(unitAmountRial: number, quantity: number): number {
  assertPositiveAmount(unitAmountRial, "مبلغ واحد");
  assertQuantity(quantity);
  const total = unitAmountRial * quantity;
  if (total > MONEY_LIMITS.MAX_AMOUNT_RIAL) throw AppError.validation("جمع ردیف بیش از سقف مجاز است.");
  return total;
}

export function assertLinesSumMatchesTotal(lines: { lineTotalRial: number }[], totalAmountRial: number): void {
  const sum = lines.reduce((a, l) => a + l.lineTotalRial, 0);
  if (sum !== totalAmountRial) {
    throw AppError.validation(`جمع ردیف‌ها (${sum.toLocaleString("fa-IR")} ریال) با مبلغ کل (${totalAmountRial.toLocaleString("fa-IR")} ریال) سازگار نیست.`);
  }
}

/**
 * محاسبهٔ سهم‌ها بر اساس مبلغ واجد شرایط و قواعد نسخه.
 * اگر هر قاعدهٔ مؤثر نامشخص باشد، سهم‌ها null برمی‌گردند (نیازمند بررسی انسانی).
 */
export type ShareInputs = {
  eligibleAmountRial: number;
  deductibleType: "NONE" | "FIXED" | "PERCENT" | "UNSPECIFIED";
  deductibleValue: number | null; // ریال یا bps
  ownerCoinsuranceBps: number | null;
  reimbursementRateBps: number | null;
  remainingLimitRial: number | null; // null = نامشخص
};

export type ShareOutputs = {
  insurerShareRial: number | null;
  ownerShareRial: number | null;
  reason: string | null;
};

export function calculateShares(inputs: ShareInputs): ShareOutputs {
  const { eligibleAmountRial, deductibleType, deductibleValue, ownerCoinsuranceBps, reimbursementRateBps, remainingLimitRial } = inputs;

  if (deductibleType === "UNSPECIFIED" || reimbursementRateBps === null) {
    return { insurerShareRial: null, ownerShareRial: null, reason: "قواعد پوشش/نرخ بازپرداخت نامشخص — نیازمند بررسی انسانی" };
  }
  if (remainingLimitRial === null) {
    return { insurerShareRial: null, ownerShareRial: null, reason: "سقف باقی‌مانده نامشخص — نیازمند بررسی انسانی" };
  }

  let afterDeductible = eligibleAmountRial;

  if (deductibleType === "FIXED" && deductibleValue !== null) {
    afterDeductible = Math.max(0, eligibleAmountRial - deductibleValue);
  } else if (deductibleType === "PERCENT" && deductibleValue !== null) {
    const deductibleAmount = applyBps(eligibleAmountRial, deductibleValue);
    afterDeductible = Math.max(0, eligibleAmountRial - deductibleAmount);
  }

  let insurerBase = applyBps(afterDeductible, reimbursementRateBps);

  if (ownerCoinsuranceBps !== null && ownerCoinsuranceBps > 0) {
    const ownerPart = applyBps(insurerBase, ownerCoinsuranceBps);
    insurerBase = insurerBase - ownerPart;
  }

  // اعمال سقف باقی‌مانده
  const insurerShareRial = Math.min(insurerBase, Math.max(0, remainingLimitRial));
  const ownerShareRial = eligibleAmountRial - insurerShareRial;

  if (ownerShareRial < 0 || insurerShareRial < 0) {
    return { insurerShareRial: null, ownerShareRial: null, reason: "محاسبهٔ سهم‌ها نتیجهٔ نامعتبر داد — نیازمند بررسی" };
  }

  // invariant
  if (insurerShareRial + ownerShareRial !== eligibleAmountRial) {
    // گرد کردن جزئی — اختلاف حداکثر ۱ ریال قابل قبول است، ولی در حالت عادی نباید رخ دهد
  }

  return { insurerShareRial, ownerShareRial, reason: null };
}
