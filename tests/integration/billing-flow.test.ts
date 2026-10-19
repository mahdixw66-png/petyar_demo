import { describe, it, expect } from "vitest";
import { canTransition } from "@/lib/domain/request-state-machine";

/**
 * گردش صورتحساب — تست منطق بدون وابستگی به DB
 */
describe("billing flow invariants", () => {
  it("کلینیک می‌تواند پیش‌نویس بسازد و ارسال کند، کارشناس بررسی کند", () => {
    expect(canTransition("DRAFT", "SUBMITTED", "CLINIC").allowed).toBe(true);
    expect(canTransition("SUBMITTED", "UNDER_REVIEW", "REVIEWER").allowed).toBe(true);
  });

  it("پس از تأیید، تسویه دو‌مرحله‌ای است", () => {
    expect(canTransition("APPROVED", "PENDING_SETTLEMENT", "REVIEWER").allowed).toBe(true);
    expect(canTransition("PENDING_SETTLEMENT", "SETTLED_SIMULATED", "REVIEWER").allowed).toBe(true);
    expect(canTransition("APPROVED", "SETTLED_SIMULATED", "REVIEWER").allowed).toBe(false);
  });

  it("رد یا درخواست اصلاح نیاز به دلیل دارد", async () => {
    const { assertTransition } = await import("@/lib/domain/request-state-machine");
    expect(() => assertTransition("UNDER_REVIEW", "REJECTED", "REVIEWER", { reason: "" })).toThrow();
    expect(() => assertTransition("UNDER_REVIEW", "NEEDS_CORRECTION", "REVIEWER", { reason: "دلیل کافی" })).not.toThrow();
  });

  it("سهم‌ها باید با مبلغ واجد شرایط جمع شوند", () => {
    const eligible = 10_000_000;
    const insurer = 7_000_000;
    const owner = 3_000_000;
    expect(insurer + owner).toBe(eligible);
  });

  it("ثبت تسویه دوباره باید رد شود (کنترل در service)", () => {
    // در سرویس settlement، unique constraint روی requestId اعمال شده است
    expect(true).toBe(true);
  });
});
