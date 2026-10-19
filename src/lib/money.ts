/**
 * یکای پول و توابع مبلغ.
 *
 * قرارداد پروژه:
 *  - واحدِ canonical در پایگاه داده و منطق سمت سرور: **ریالِ عدد صحیح** (Int).
 *  - واحد نمایش در رابط کاربری: **تومان** (۱ تومان = ۱۰ ریال).
 *  - هرگز از floating-point برای ذخیره یا جمع مبالغ استفاده نمی‌شود؛
 *    همهٔ جمع‌ها و ضرب‌ها روی عدد صحیح انجام و در انتها گرد می‌شوند.
 */

export const RIALS_PER_TOMAN = 10;

/** نرخ‌ها در دیتابیس به basis-point ذخیره می‌شوند (bps): 7000 = 70% */
export const BPS_DIVISOR = 10_000;

const persianNumberFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

const latinGroupFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/** گرد کردن نیم‌به‌بالا (نه banker's rounding) برای جلوگیری از سوگیری سیستماتیک */
export function roundHalfUp(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/** ریال ← تومان (گرد شده به نزدیک‌ترین تومان) */
export function rialsToToman(rials: number): number {
  return roundHalfUp(rials / RIALS_PER_TOMAN);
}

/** تومان ← ریال */
export function tomanToRials(toman: number): number {
  return roundHalfUp(toman) * RIALS_PER_TOMAN;
}

/** اعمال یک نرخِ bps روی مبلغ: مبلغ × bps / 10000 (گرد نیم‌به‌بالا) */
export function applyBps(amountRial: number, bps: number): number {
  return roundHalfUp((amountRial * bps) / BPS_DIVISOR);
}

/** درصد ← bps */
export function percentToBps(percent: number): number {
  return roundHalfUp(percent * 100);
}

/** bps ← درصد (برای نمایش) */
export function bpsToPercent(bps: number): number {
  return roundHalfUp(bps / 100);
}

/** اعداد را با ارقام فارسی برمی‌گرداند */
export function toPersianDigits(input: string | number): string {
  return persianNumberFormatter.format(
    typeof input === "number" ? input : Number(input),
  );
}

export type MoneyFormatOptions = {
  /** واحد نمایش: تومان (پیش‌فرض) یا ریال */
  unit?: "toman" | "rial";
  /** ارقام فارسی (پیش‌فرض) یا لاتین */
  digits?: "fa" | "en";
  /** نمایش علامت واحد کنار عدد (پیش‌فرض true) */
  withUnit?: boolean;
};

/**
 * قالب‌بندی مبلغ برای نمایش. مقدار ورودی همیشه **ریال** است.
 * مقدار null/undefined به معنای «تعیین نشده» است و با «—» نمایش داده می‌شود
 * (هرگز صفر فرض نمی‌شود).
 */
export function formatMoney(
  rials: number | null | undefined,
  options: MoneyFormatOptions = {},
): string {
  const { unit = "toman", digits = "fa", withUnit = true } = options;
  if (rials === null || rials === undefined || Number.isNaN(rials)) return "—";

  const value = unit === "toman" ? rialsToToman(rials) : Math.round(rials);
  const formatted =
    digits === "fa"
      ? persianNumberFormatter.format(value)
      : latinGroupFormatter.format(value);
  if (!withUnit) return formatted;
  return `${formatted} ${unit === "toman" ? "تومان" : "ریال"}`;
}

/** نمایش خلاصه برای مبالغ بزرگ (مثلاً ۱۲٫۵ میلیون تومان) */
export function formatMoneyShort(rials: number | null | undefined): string {
  if (rials === null || rials === undefined) return "—";
  const toman = rialsToToman(rials);
  if (Math.abs(toman) >= 1_000_000) {
    return `${toPersianDigits((toman / 1_000_000).toFixed(1))} میلیون تومان`;
  }
  if (Math.abs(toman) >= 1_000) {
    return `${toPersianDigits(Math.round(toman / 1_000))} هزار تومان`;
  }
  return `${toPersianDigits(toman)} تومان`;
}

/** جمع امنِ ردیف‌ها (همیشه عدد صحیح) */
export function sumRials(values: readonly number[]): number {
  return values.reduce<number>((acc, v) => acc + Math.round(v), 0);
}

export const MONEY_LIMITS = {
  /** بیشینهٔ مبلغ مجاز برای یک ردیف یا کل صورتحساب (۱۰ میلیارد ریال) */
  MAX_AMOUNT_RIAL: 10_000_000_000,
  /** بیشینهٔ تعداد مجاز برای یک ردیف خدمت */
  MAX_QUANTITY: 1000,
};
