import { describe, it, expect } from "vitest";
import { canTransition, assertTransition, isTerminal } from "@/lib/domain/request-state-machine";

describe("request state machine", () => {
  it("انتقال‌های مجاز کلینیک", () => {
    expect(canTransition("DRAFT", "SUBMITTED", "CLINIC").allowed).toBe(true);
    expect(canTransition("NEEDS_CORRECTION", "RESUBMITTED", "CLINIC").allowed).toBe(true);
  });

  it("کلینیک نمی‌تواند مستقیماً تأیید کند", () => {
    expect(canTransition("UNDER_REVIEW", "APPROVED", "CLINIC").allowed).toBe(false);
  });

  it("کارشناس می‌تواند تأیید/رد کند، اما نیاز به دلیل دارد", () => {
    expect(canTransition("UNDER_REVIEW", "APPROVED", "REVIEWER").allowed).toBe(true);
    expect(() => assertTransition("UNDER_REVIEW", "APPROVED", "REVIEWER", { reason: "" })).toThrow();
    expect(() => assertTransition("UNDER_REVIEW", "APPROVED", "REVIEWER", { reason: "دلیل کافی و کامل است" })).not.toThrow();
  });

  it("APPROVED به‌معنای پرداخت نیست — فقط PENDING_SETTLEMENT مجاز است", () => {
    expect(canTransition("APPROVED", "PENDING_SETTLEMENT", "REVIEWER").allowed).toBe(true);
    expect(canTransition("APPROVED", "SETTLED_SIMULATED", "REVIEWER").allowed).toBe(false);
  });

  it("انتقال نامعتبر رد می‌شود", () => {
    expect(canTransition("DRAFT", "APPROVED", "CLINIC").allowed).toBe(false);
    expect(canTransition("REJECTED", "APPROVED", "REVIEWER").allowed).toBe(false);
  });

  it("وضعیت‌های پایانی", () => {
    expect(isTerminal("REJECTED")).toBe(true);
    expect(isTerminal("SETTLED_SIMULATED")).toBe(true);
    expect(isTerminal("APPROVED")).toBe(false);
  });

  it("تسویه فقط از PENDING_SETTLEMENT", () => {
    expect(canTransition("PENDING_SETTLEMENT", "SETTLED_SIMULATED", "REVIEWER").allowed).toBe(true);
    expect(canTransition("APPROVED", "SETTLED_SIMULATED", "REVIEWER").allowed).toBe(false);
  });
});
