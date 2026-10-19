import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** شناسهٔ تصادفیِ غیرقابل حدس برای استفاده در URLها (کد پیگیری، شناسهٔ عمومی) */
export function randomCode(length = 10): string {
  // الفبای Crockford بدون حروف مشابه (I, L, O, U) برای جلوگیری از اشتباه خواندن
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function truncate(value: string, max = 120): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

/** حذف فاصله/نیم‌فاصله و نرمال‌سازی شمارهٔ موبایل ایرانی */
export function normalizePhone(input: string): string {
  const digits = input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\D/g, "");
  if (digits.startsWith("0098")) return `0${digits.slice(4)}`;
  if (digits.startsWith("98") && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.startsWith("+98")) return `0${digits.slice(3)}`;
  return digits;
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidIranianMobile(phone: string): boolean {
  return /^09\d{9}$/.test(normalizePhone(phone));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));
}

/** پوشاندن مقدار حساس در لاگ‌ها */
export function maskSecret(value: string | undefined): string {
  if (!value) return "(خالی)";
  return value.length <= 4 ? "••••" : `${value.slice(0, 2)}••••${value.slice(-2)}`;
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}
