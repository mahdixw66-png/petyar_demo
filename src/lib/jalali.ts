/**
 * تبدیل و قالب‌بندی تاریخ شمسی (جلالی).
 *
 * قرارداد پروژه:
 *  - ذخیره در پایگاه داده: `timestamptz` (UTC) / `Date` استاندارد و timezone-aware.
 *  - نمایش در رابط کاربری: تاریخ شمسی با منطق خالصِ این ماژول (بدون وابستگی به ICU،
 *    تا خروجی روی سرور و کلاینت دقیقاً یکسان باشد و قابل تست واحد باشد).
 *  - منطقهٔ زمانیِ نمایش: Asia/Tehran.
 *  - الگوریسم: تبدیلِ استانداردِ تقویم جلالی بر پایهٔ جدول شکست‌های ۳۳ساله
 *    (هم‌راستا با تقویم رسمی ایران؛ با ICU/Intl در تست‌ها تطبیق داده شده است).
 */

export const DATE_DISPLAY_TIME_ZONE = "Asia/Tehran";
const TEHRAN_OFFSET_MINUTES = 210; // +03:30 — ایران در سال‌های اخیر DST ندارد

export type JalaliDate = { year: number; month: number; day: number };

const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const WEEKDAY_NAMES = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

function div(a: number, b: number): number {
  return Math.floor(a / b);
}

function mod(a: number, b: number): number {
  return a - b * div(a, b);
}

// --- جدول شکست‌های دوره‌های ۳۳سالهٔ تقویم جلالی --------------------------------
const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192,
  2262, 2324, 2394, 2456, 3178,
];

type JalCalResult = { leap: number; gy: number; march: number };

export function jalCal(jy: number): JalCalResult {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0]!;
  let jump = 0;
  let leapG = 0;
  let march = 0;
  let n = 0;
  let leap = 0;

  if (jy < BREAKS[0]! || jy >= BREAKS[bl - 1]!) {
    throw new RangeError(`سال شمسی خارج از بازهٔ پشتیبانی‌شده: ${jy}`);
  }

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i]!;
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  n = jy - jp;

  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

/** آیا سال شمسی کبیسه است؟ */
export function isLeapJalaliYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

/** طول ماه شمسی */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaliYear(jy) ? 30 : 29;
}

// --- عددِ روزِ جولیَن (JDN) --------------------------------------------------

/** میلادی → عدد روزِ جولیَن (فرمول استانداردِ Fliegel–Van Flandern) */
function g2d(gy: number, gm: number, gd: number): number {
  const a = div(14 - gm, 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  return (
    gd +
    div(153 * m + 2, 5) +
    365 * y +
    div(y, 4) -
    div(y, 100) +
    div(y, 400) -
    32045
  );
}

// نسخهٔ سرراست و قابل‌اعتماد از تبدیل JDN → میلادی
function d2gSafe(jdn: number): { gy: number; gm: number; gd: number } {
  let a = jdn + 32044;
  const b = div(4 * a + 3, 146097);
  const c = a - div(146097 * b, 4);
  const dd = div(4 * c + 3, 1461);
  const e = c - div(1461 * dd, 4);
  const m = div(5 * e + 2, 153);
  const day = e - div(153 * m + 2, 5) + 1;
  const month = m + 3 - 12 * div(m, 10);
  const year = 100 * b + dd - 4800 + div(m, 10);
  return { gy: year, gm: month, gd: day };
}

/** شمسی → JDN */
function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return (
    g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
  );
}

/** JDN → شمسی */
function d2j(jdn: number): JalaliDate {
  const gy = d2gSafe(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(r.gy, 3, r.march);
  let k = jdn - jdn1f;
  let jm: number;
  let jd: number;

  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { year: jy, month: jm, day: jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { year: jy, month: jm, day: jd };
}

/**
 * تبدیل تاریخ میلادی (اجزای تقویمی) به شمسی.
 * ورودیِ خارج از بازه (مثلاً ماه ۱۳) نرمال‌سازی می‌شود.
 */
export function gregorianToJalali(
  gy: number,
  gm: number,
  gd: number,
): JalaliDate {
  const g = normalizeGregorianParts(gy, gm, gd);
  return d2j(g2d(g.year, g.month, g.day));
}

/** تبدیل تاریخ شمسی به میلادی */
export function jalaliToGregorian(
  jy: number,
  jm: number,
  jd: number,
): { year: number; month: number; day: number } {
  const g = d2gSafe(j2d(jy, jm, jd));
  return { year: g.gy, month: g.gm, day: g.gd };
}

function normalizeGregorianParts(
  year: number,
  month: number,
  day: number,
): { year: number; month: number; day: number } {
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  let y = year;
  let m = month;
  let d = day;

  if (m > 12) {
    const carry = div(m - 1, 12);
    m -= carry * 12;
    y += carry;
  } else if (m < 1) {
    const carry = div(12 - m, 12);
    m += carry * 12;
    y -= carry;
  }

  let dim = gDaysInMonth[m - 1] ?? 31;
  if (m === 2 && isLeap(y)) dim = 29;

  if (d > dim) {
    d -= dim;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  } else if (d < 1) {
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    d += m === 2 && isLeap(y) ? 29 : (gDaysInMonth[m - 1] ?? 31);
  }

  return { year: y, month: m, day: d };
}

/** تبدیل Date/ISO به اجزای تاریخِ محلیِ تهران */
function toTehranParts(input: Date | string | number): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
} {
  const date = input instanceof Date ? input : new Date(input);
  const shifted = new Date(date.getTime() + TEHRAN_OFFSET_MINUTES * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

export function toJalali(input: Date | string | number): JalaliDate {
  const p = toTehranParts(input);
  return gregorianToJalali(p.year, p.month, p.day);
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export type DateFormatOptions = {
  /** ارقام فارسی (پیش‌فرض) یا لاتین */
  digits?: "fa" | "en";
  /** شامل ساعت (HH:MM به وقت تهران) */
  withTime?: boolean;
  /** نمایش نام ماه به‌جای عدد */
  withMonthName?: boolean;
  /** شامل نام روز هفته */
  withWeekday?: boolean;
};

/**
 * قالب‌بندی تاریخ شمسی.
 * مقدار null/undefined به معنای «تعیین نشده» است و با «—» نمایش داده می‌شود
 * (هرگز صفر یا تاریخ ساختگی نمایش داده نمی‌شود).
 */
export function formatJalali(
  input: Date | string | number | null | undefined,
  options: DateFormatOptions = {},
): string {
  if (input === null || input === undefined || input === "") return "—";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "—";

  const { digits = "fa", withTime = false, withMonthName = false, withWeekday = false } = options;
  const j = toJalali(date);
  const parts = toTehranParts(date);

  let out = withMonthName
    ? `${j.day} ${JALALI_MONTH_NAMES[j.month - 1] ?? ""} ${j.year}`
    : `${j.year}/${pad(j.month)}/${pad(j.day)}`;

  if (withWeekday) {
    out = `${WEEKDAY_NAMES[parts.weekday] ?? ""} ${out}`;
  }
  if (withTime) {
    out = `${out}، ساعت ${pad(parts.hour)}:${pad(parts.minute)}`;
  }
  return digits === "fa" ? toPersianDigits(out) : out;
}

/** نمایش کوتاهِ «چقدر پیش» به فارسی */
export function formatRelative(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "همین الان";
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${toPersianDigits(days)} روز پیش`;
  return formatJalali(date);
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[,\s]+/g, " ")
    .trim();
}

/**
 * تبدیل رشتهٔ شمسیِ «۱۴۰۴/۰۷/۲۵» به Date (نیمه‌شبِ تهران).
 * برای ورودی کاربر در فرم‌ها استفاده می‌شود؛ نامعتبر ⇒ null.
 */
export function parseJalaliInput(value: string): Date | null {
  const cleaned = normalizeDigits(value);
  const match = /^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/.exec(cleaned);
  if (!match) return null;
  const jy = Number(match[1]);
  const jm = Number(match[2]);
  const jd = Number(match[3]);
  if (jm < 1 || jm > 12 || jd < 1 || jd > jalaliMonthLength(jy, jm)) return null;
  try {
    const g = jalaliToGregorian(jy, jm, jd);
    // نیمه‌شب به وقت تهران
    return new Date(
      Date.UTC(g.year, g.month - 1, g.day, 0, 0, 0) - TEHRAN_OFFSET_MINUTES * 60_000,
    );
  } catch {
    return null;
  }
}

/** بررسی اعتبارِ رشتهٔ تاریخ شمسی */
export function isValidJalali(value: string): boolean {
  return parseJalaliInput(value) !== null;
}

/** تبدیل Date به مقدار قابل قبولِ <input type="date"> (ISO میلادی) */
export function toDateInputValue(input: Date | string | null | undefined): string {
  if (!input) return "";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const p = toTehranParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** تبدیل مقدار <input type="date"> (ISO میلادی) به Date در ابتدای روزِ تهران */
export function fromDateInputValue(value: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const d = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0) -
      TEHRAN_OFFSET_MINUTES * 60_000,
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

export function jalaliMonthName(month: number): string {
  return JALALI_MONTH_NAMES[month - 1] ?? "";
}

/** اختلاف دو تاریخ بر حسب روز (بدون در نظر گرفتن ساعت) */
export function diffInDays(a: Date | string, b: Date | string): number {
  const da = a instanceof Date ? a : new Date(a);
  const db = b instanceof Date ? b : new Date(b);
  return Math.round((da.getTime() - db.getTime()) / 86_400_000);
}
