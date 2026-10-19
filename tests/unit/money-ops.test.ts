import { describe, it, expect } from "vitest";
import { lineTotal, assertLinesSumMatchesTotal, calculateShares } from "@/lib/domain/money-ops";

describe("money ops", () => {
  it("lineTotal ضرب ساده", () => {
    expect(lineTotal(3_000_000, 2)).toBe(6_000_000);
  });

  it("مبلغ منفی یا تعداد نامعتبر خطا می‌دهد", () => {
    expect(() => lineTotal(-1, 1)).toThrow();
    expect(() => lineTotal(1000, 0)).toThrow();
    expect(() => lineTotal(1000, 1001)).toThrow();
  });

  it("جمع ردیف‌ها باید با total سازگار باشد", () => {
    expect(() => assertLinesSumMatchesTotal([{ lineTotalRial: 3000000 }, { lineTotalRial: 2000000 }], 5000000)).not.toThrow();
    expect(() => assertLinesSumMatchesTotal([{ lineTotalRial: 3000000 }], 5000000)).toThrow();
  });

  it("محاسبه سهم‌ها با فرانشیز ثابت", () => {
    const out = calculateShares({
      eligibleAmountRial: 10_000_000,
      deductibleType: "FIXED",
      deductibleValue: 2_000_000,
      ownerCoinsuranceBps: null,
      reimbursementRateBps: 7000,
      remainingLimitRial: 20_000_000,
    });
    // 8M * 70% = 5.6M بیمه، مالک 4.4M
    expect(out.insurerShareRial).toBe(5_600_000);
    expect(out.ownerShareRial).toBe(4_400_000);
  });

  it("اگر قواعد نامشخص باشد سهم null و نیازمند بررسی", () => {
    const out = calculateShares({
      eligibleAmountRial: 10_000_000,
      deductibleType: "UNSPECIFIED",
      deductibleValue: null,
      ownerCoinsuranceBps: null,
      reimbursementRateBps: null,
      remainingLimitRial: null,
    });
    expect(out.insurerShareRial).toBeNull();
    expect(out.reason).toMatch(/نامشخص|بررسی/);
  });

  it("سقف باقی‌مانده اعمال می‌شود", () => {
    const out = calculateShares({
      eligibleAmountRial: 10_000_000,
      deductibleType: "NONE",
      deductibleValue: null,
      ownerCoinsuranceBps: null,
      reimbursementRateBps: 8000,
      remainingLimitRial: 5_000_000,
    });
    expect(out.insurerShareRial).toBe(5_000_000);
    expect(out.ownerShareRial).toBe(5_000_000);
  });
});
