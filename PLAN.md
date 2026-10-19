# طرح معماری و برنامه اجرا — پلتفرم بیمه دامپزشکی سگ و گربه

> این سند خلاصهٔ تصمیم‌های معماری است (گام ۲ از برنامه اجرا). جزئیات کامل در `README.md` و `docs/`.

## ۱. پشته فنی انتخاب‌شده و دلیل

| لایه | انتخاب | دلیل |
|---|---|---|
| فریم‌ورک | Next.js 15 (App Router) + TypeScript strict | یک کدبیس برای UI و API، route handlerهای نسخه‌بندی‌شده، اکوسیستم بالغ |
| استایل | Tailwind CSS v4 + tokens در `@theme` | سیستم طراحی یکپارچه، logical properties برای RTL، بدون وابستگی خارجی |
| دیتابیس | PostgreSQL 17 + Prisma 6 | migration نسخه‌بندی‌شده، تایپ‌سیف، تراکنش واقعی |
| اعتبارسنجی | Zod 4 | یک منبع حقیقت برای قرارداد ورودی در کلاینت و سرور |
| احراز هویت | JWT امضا‌شده (`jose`, HS256) در کوکی HttpOnly/SameSite + سالت/هش scrypt | بالغ، بدون وابستگی به بتای auth، قابل ممیزی، بدون رمز متن‌ساده |
| فایل | درایور ذخیره‌سازی خصوصی (local→قابل تعویض با S3) + دسترسی با احراز هویت | فایل خصوصی هیچ URL عمومی دائمی ندارد |
| تست | Vitest (unit/integration) + Playwright (E2E) | سریع، بدون نیاز به سرویس اضافه |
| استقرار | Dockerfile چندمرحله‌ای + docker-compose (web + postgres) | عدم قفل‌شدن به پلتفرم خاص |

## ۲. مرزبندی لایه‌ها

```
UI (Server/Client Components)
        │  فقط فراخوانی
        ▼
Service Layer  (src/server/services/*)  ← قوانین کسب‌وکار، ماشین وضعیت، محاسبات
        │
        ▼
Data Access    (Prisma)  ← src/server/db.ts
```

- هیچ قانون پوشش/مبلغ/مجوزی فقط در مرورگر اجرا نمی‌شود.
- APIهای `/api/v1/**` پوشش نازکی روی همان Serviceها هستند؛ بنابراین اپلیکیشن Native آینده از همان قرارداد استفاده می‌کند.
- صفحات نیز مستقیماً Service را صدا می‌زنند (بدون round-trip HTTP) ولی همان authorization را اعمال می‌کنند.

## ۳. موجودیت‌های اصلی (خلاصه؛ نسخهٔ دقیق در `prisma/schema.prisma`)

`User`(نقش: OWNER/CLINIC/REVIEWER/ADMIN) · `Clinic` · `ClinicContract` · `ServiceGroup` · `ClinicService`
`Pet`(ownerId) · `Plan` · `PlanVersion`(شرایط نسخه‌شده) · `CoverageRule` · `PlanVersionExclusion`
`Policy`(petId + planVersionId + بازهٔ اعتبار) · `TreatmentRequest`(trackingCode) · `ServiceLine` · `Attachment`
`ReviewDecision` · `Settlement`(فقط SIMULATED) · `RequestStatusEvent`(timeline) · `AuditEvent`(فقط الحاقی)
`PricingAssumption` · `PricingRun` · `Notification` · `PasswordResetToken`

## ۴. ماشین وضعیت درخواست درمان

```
DRAFT ──submit──▶ SUBMITTED ──claim──▶ UNDER_REVIEW
                                          │
                       ┌──────────────────┼──────────────────┐
                       ▼                  ▼                  ▼
              NEEDS_CORRECTION        APPROVED           REJECTED (پایان)
                       │                  │
                resubmit│         mark_pending_settlement
                       ▼                  ▼
                  RESUBMITTED       PENDING_SETTLEMENT
                       │                  │
                       └──▶ UNDER_REVIEW  └──settle_simulated──▶ SETTLED_SIMULATED (پایان)
```

- انتقال‌ها فقط از طریق `src/lib/domain/request-state-machine.ts` مجازند.
- `APPROVED` = تأیید بیمه‌ای، **نه** پرداخت.
- هر انتقال: actor، نقش، زمان، وضعیت قبلی/جدیd و توضیح را در `RequestStatusEvent` + `AuditEvent` ثبت می‌کند.
- تغییر مؤثرِ فیلدهای پوشش/مبلغ پس از تصمیم نهایی ⇒ بازگشت به `UNDER_REVIEW`.

## ۵. یکای پول

- دیتابیس: **ریالِ عدد صحیح** (`Int`) — هرگز float.
- رابط کاربری: تبدیل کنترل‌شده به تومان (`src/lib/money.ts`)، گرد کردن با `Math.round` روی مرزها و تست مرزی.
- خروجی نمونه: مقدار فرضی ۱۲٬۰۰۰٬۰۰۰ ریال ⇒ «۱,۲۰۰,۰۰۰ تومان».

## ۶. تاریخ

- ذخیره: `timestamptz` (UTC).
- نمایش: شمسی (تبدیل در `src/lib/jalali.ts`، منطق خالص و تست‌شده، بدون وابستگی به ICU).
- ورودی فرم‌ها: ISO میلادی در `input[type=date]` + نمایش زندهٔ معادل شمسی (تجربهٔ بومی موبایل حفظ می‌شود).

## ۷. سیاست «عدم جعل قابلیت»

هر قابلیت واقعیِ پیاده‌سازی‌نشده یا به‌صورت **غیرفعال/برچسب‌خورده** (`docs/DISABLED-OR-SIMULATED.md`) یا با نشان صریح «نمونه/آزمایشی/تأییدنشده» نمایش داده می‌شود:
پرداخت واقعی، پیامک/ایمیل، نقشهٔ زنده، نوبت‌دهی، ویزیت آنلاین، نرخ مصوب بیمه‌ای.
