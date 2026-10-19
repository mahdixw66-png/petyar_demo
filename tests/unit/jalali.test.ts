import { describe, it, expect } from "vitest";
import { formatJalali, toJalali, parseJalaliInput, gregorianToJalali, jalaliMonthLength } from "@/lib/jalali";

describe("jalali", () => {
  it("تبدیل شناخته‌شده: 2025-03-21 => 1404/01/01 (نوروز)", () => {
    const j = gregorianToJalali(2025, 3, 21);
    expect(j).toEqual({ year: 1404, month: 1, day: 1 });
  });

  it("تطبیق با Intl برای بازه 1900-2100 (نمونه هفتگی)", () => {
    const fmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Tehran" });
    for (let t = Date.UTC(2000, 0, 1); t < Date.UTC(2005, 0, 1); t += 86400000 * 7) {
      const d = new Date(t + 12 * 3600e3);
      const mine = formatJalali(d, { digits: "en" });
      const p = fmt.formatToParts(d);
      const theirs = `${p.find((x) => x.type === "year")!.value}/${p.find((x) => x.type === "month")!.value}/${p.find((x) => x.type === "day")!.value}`;
      expect(mine).toBe(theirs);
    }
  });

  it("formatJalali برای null/undefined — برمی‌گرداند و صفر نمی‌سازد", () => {
    expect(formatJalali(null)).toBe("—");
    expect(formatJalali(undefined)).toBe("—");
    expect(formatJalali(new Date("invalid"))).toBe("—");
  });

  it("parseJalaliInput رفت و برگشت", () => {
    const input = "1404/07/27";
    const date = parseJalaliInput(input);
    expect(date).not.toBeNull();
    expect(formatJalali(date!, { digits: "en" })).toBe(input);
  });

  it("parseJalaliInput مقدار نامعتبر null می‌دهد", () => {
    expect(parseJalaliInput("1404/13/01")).toBeNull();
    expect(parseJalaliInput("not-a-date")).toBeNull();
  });

  it("طول ماه اسفند در سال کبیسه و غیرکبیسه", () => {
    // 1403 کبیسه است (طبق تقویم رسمی)
    expect(jalaliMonthLength(1403, 12)).toBe(30);
    expect(jalaliMonthLength(1404, 12)).toBe(29);
  });

  it("نمایش شمسی شامل نام ماه و روز هفته", () => {
    const d = new Date("2026-10-19T12:00:00+03:30");
    const out = formatJalali(d, { withMonthName: true, withWeekday: true });
    expect(out).toContain("مهر");
  });
});
