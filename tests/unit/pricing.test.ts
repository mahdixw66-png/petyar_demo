import { describe, it, expect } from "vitest";
import { calculateGrossPremium, calculateExpectedLoss, calculateLossRatio } from "@/lib/domain/pricing";

describe("pricing", () => {
  it("فرمول P = (L+F+R+C)/(1-V-Q) درست محاسبه می‌شود", () => {
    const out = calculateGrossPremium({ L: 50_000_000, F: 10_000_000, R: 5_000_000, C: 2_000_000, Vbps: 1500, Qbps: 1000 });
    // (67M) / 0.75 = 89.333...
    expect(out.P).toBe(89_333_333);
    expect(out.denominator).toBeCloseTo(0.75);
  });

  it("V+Q >=1 خطا می‌دهد", () => {
    expect(() => calculateGrossPremium({ L: 10_000, F: 0, R: 0, C: 0, Vbps: 6000, Qbps: 4000 })).toThrow(/V.*Q/);
    expect(() => calculateGrossPremium({ L: 10_000, F: 0, R: 0, C: 0, Vbps: 5000, Qbps: 5000 })).toThrow();
  });

  it("خسارت موردانتظار از ردیف‌ها", () => {
    const loss = calculateExpectedLoss([
      { avgCostRial: 5_000_000, annualFrequency: 0.5, insurerPayShareBps: 7000 },
      { avgCostRial: 10_000_000, annualFrequency: 0.2, insurerPayShareBps: 5000 },
    ]);
    // 5M*0.5*0.7=1.75M + 10M*0.2*0.5=1M => 2.75M
    expect(loss).toBe(2_750_000);
  });

  it("Loss Ratio با داده ناقص null می‌دهد نه صفر", () => {
    expect(calculateLossRatio(null, 100_000_000)).toBeNull();
    expect(calculateLossRatio(50_000_000, null)).toBeNull();
    expect(calculateLossRatio(0, 0)).toBeNull();
    expect(calculateLossRatio(60_000_000, 100_000_000)).toBeCloseTo(0.6);
  });

  it("مقادیر منفی رد می‌شود", () => {
    expect(() => calculateGrossPremium({ L: -1, F: 0, R: 0, C: 0, Vbps: 1000, Qbps: 1000 })).toThrow();
  });
});
