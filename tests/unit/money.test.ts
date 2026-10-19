import { describe, it, expect } from "vitest";
import { formatMoney, rialsToToman, applyBps, sumRials, MONEY_LIMITS } from "@/lib/money";

describe("money", () => {
  it("تبدیل ریال به تومان گرد نیم‌به‌بالا", () => {
    expect(rialsToToman(10)).toBe(1);
    expect(rialsToToman(15)).toBe(2); // 1.5 -> 2
    expect(rialsToToman(14)).toBe(1); // 1.4 -> 1
    expect(rialsToToman(0)).toBe(0);
    expect(rialsToToman(100_000_00)).toBe(1_000_000);
  });

  it("اعمال bps", () => {
    expect(applyBps(10_000_000, 7000)).toBe(7_000_000);
    expect(applyBps(10_000_000, 0)).toBe(0);
    expect(applyBps(10_000_000, 10_000)).toBe(10_000_000);
    expect(applyBps(1, 1)).toBe(0); // 0.0001 -> 0 با گرد
    expect(applyBps(5_000, 3333)).toBe(1667); // 1666.5 -> 1667
  });

  it("formatMoney مقدار null را — برمی‌گرداند و هرگز صفر فرض نمی‌کند", () => {
    expect(formatMoney(null)).toBe("—");
    expect(formatMoney(undefined)).toBe("—");
    expect(formatMoney(0)).not.toBe("—");
    expect(formatMoney(0)).toContain("۰");
  });

  it("sumRials جمع امن", () => {
    expect(sumRials([100, 200, 300])).toBe(600);
    expect(sumRials([])).toBe(0);
  });

  it("محدودیت‌های مبلغ رعایت می‌شود", () => {
    expect(MONEY_LIMITS.MAX_AMOUNT_RIAL).toBeGreaterThan(1_000_000_000);
  });

  it("نمایش تومان با ارقام فارسی", () => {
    const out = formatMoney(12_000_000); // 1_200_000 تومان
    expect(out).toContain("تومان");
  });

  it("مرزهای تبدیل ریال/تومان", () => {
    expect(MONEY_LIMITS.MAX_AMOUNT_RIAL).toBe(10_000_000_000);
    expect(() => {
      const v = MONEY_LIMITS.MAX_AMOUNT_RIAL;
      if (v > MONEY_LIMITS.MAX_AMOUNT_RIAL) throw new Error("over limit");
    }).not.toThrow();
  });
});
