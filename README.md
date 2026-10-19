# پت‌یار — پلتفرم بیمه دامپزشکی سگ و گربه

> **هشدار دمو:** تمام داده‌ها، کلینیک‌ها، نرخ‌ها و مبالغ در این نسخه **نمونهٔ آموزشی و تأییدنشده** هستند. هیچ پرداخت واقعی، صدور قانونی بیمه‌نامه یا تعهد بیمه‌ای ایجاد نمی‌شود. تسویه فقط به‌صورت **آزمایشی/شبیه‌سازی‌شده (SIMULATED)** ثبت می‌شود.

پلتفرم چندنقشی (مالک، کلینیک، کارشناس بیمه، مدیر) برای مدیریت حیوانات، بیمه‌نامه، کلینیک‌های طرف قرارداد، ثبت و بررسی صورتحساب و تسویهٔ آزمایشی به کلینیک. رابط فارسی RTL، موبایل-اول، PWA-ready، API نسخه‌بندی‌شده برای اپلیکیشن Native آینده.

---

## ۱) پیش‌نیازها

- Node.js ≥ 20.9 (توصیه 20.20 LTS)
- npm 10+
- PostgreSQL 17 (یا via Docker)
- (اختیاری) Docker & Docker Compose برای اجرای کامل

مقادیر پیشنهادی از `npm view <pkg> version` در زمان ساخت: Next 15.5.28, React 19.3, Prisma 6.19.3, Tailwind 4.3, Zod 4.6

## ۲) اجرای محلی (بدون Docker)

```bash
git clone <repo> && cd pet-insurance
cp .env.example .env
# مقداردهی AUTH_SECRET و FILE_SIGNING_SECRET:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"  # دو بار اجرا، یکی برای هر secret
# .env را ویرایش کنید (DATABASE_URL پیش‌فرض به localhost اشاره دارد)

npm install
# بالا آوردن PostgreSQL (اگر Docker دارید):
docker compose up -d db
# یا اگر postgres محلی دارید:
sudo -u postgres createdb -O petins pet_insurance_dev

npx prisma migrate dev
npx prisma db seed   # دادهٔ دمو + حساب‌های دمو

npm run dev
# http://localhost:3000
```

### حساب‌های دمو (فقط توسعه)

| نقش | ایمیل | رمز |
|---|---|---|
| مالک | `owner@demo.local` | `Demo@12345` |
| مالک دوم | `owner2@demo.local` | `Demo@12345` |
| کلینیک مهر (تهران) | `clinic@demo.local` | `Demo@12345` |
| کلینیک پت‌سینا (اصفهان) | `clinic2@demo.local` | `Demo@12345` |
| کارشناس | `reviewer@demo.local` | `Demo@12345` |
| مدیر | `admin@demo.local` | `Demo@12345` |

> در production هرگز `SEED_DEMO_ACCOUNTS=true` یا این حساب‌ها را فعال نکنید.

### گردش end-to-end برای تست دستی

1. با `clinic@demo.local` وارد شوید → داشبورد کلینیک → **ثبت صورتحساب** → حیوان `میلو` و بیمه‌نامه `POL-DEMO001` را انتخاب، ردیف‌ها را کامل کنید → **ذخیره و ارسال**
2. با `reviewer@demo.local` وارد شوید → **صف بررسی** → درخواست را باز کنید → **شروع بررسی** → مبلغ واجد شرایط و سهم‌ها را وارد و **تأیید** کنید → **انتقال به صف تسویه** → **ثبت تسویهٔ آزمایشی** (با تأیید دو مرحله‌ای)
3. با `owner@demo.local` وارد شوید → **درخواست‌ها** → سهم‌های تأییدشده را ببینید (وضعیت `تسویه‌شده (آزمایشی)`)

## ۳) اجرای با Docker (توصیه برای استقرار)

```bash
cp .env.example .env
# در .env مقادیر AUTH_SECRET و FILE_SIGNING_SECRET را با دستور بالا پر کنید
# DATABASE_URL در compose خودکار روی db تنظیم می‌شود — نیازی به تغییر نیست

docker compose up --build -d
# لاگ:
docker compose logs -f web
# migration خودکار در entrypoint اجرا می‌شود؛ برای seed دمو (فقط dev):
docker compose exec web npx prisma db seed

open http://localhost:3000
```

برای production:

```bash
# روی سرور
cp .env.example .env
# مقادیر production: DATABASE_URL امن، AUTH_SECRET تصادفی 48 بایت، APP_URL دامنه واقعی، NEXT_PUBLIC_DEMO_MODE=false, SEED_DEMO_ACCOUNTS=false
docker compose up --build -d
# بکاپ قبل از هر migrate پرریسک:
docker compose exec db pg_dump -U petins pet_insurance_dev > backup-$(date +%F).sql
```

## ۴) تست‌ها

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # next lint (ESLint 9 — در صورت خطای patch، با --no-lint build کنید)
npm test            # vitest run (unit + integration)
npm run test:unit
npm run test:integration
npm run test:e2e:install  # اولین بار
npm run test:e2e            # Playwright (نیازمند dev server)
```

وضعیت فعلی (پس از پیاده‌سازی): **38 تست — همه موفق** (money, jalali, state-machine, pricing, money-ops, billing-flow, permissions stub)

## ۵) Build production

```bash
npm run build   # prisma generate + next build
npm start       # http://localhost:3000
```

## ۶) متغیرهای محیطی (بدون افشای secret)

| نام | توضیح | پیش‌فرض |
|---|---|---|
| `DATABASE_URL` | رشته اتصال PostgreSQL | `postgresql://petins:***@localhost:5432/pet_insurance_dev` |
| `TEST_DATABASE_URL` | دیتابیس جدا برای تست | همان DATABASE_URL |
| `AUTH_SECRET` | کلید HS256 نشست (≥32 بایت تصادفی) | — |
| `FILE_SIGNING_SECRET` | کلید لینک فایل | همان AUTH_SECRET |
| `SESSION_TTL_SECONDS` | عمر نشست (ثانیه) | 604800 (۷ روز) |
| `APP_URL` | آدرس عمومی | `http://localhost:3000` |
| `STORAGE_DRIVER` | `local` یا `s3` | `local` |
| `STORAGE_DIR` | مسیر ذخیره خصوصی | `./storage/uploads` |
| `MAX_UPLOAD_BYTES` | سقف فایل | 10485760 (۱۰MB) |
| `NEXT_PUBLIC_DEMO_MODE` | نمایش بنر دمو | `true` |
| `SEED_DEMO_ACCOUNTS` | ساخت حساب‌های دمو در seed | `true` (فقط dev) |
| `DEMO_PASSWORD` | رمز حساب‌های دمو | `Demo@12345` |

`.env.example` را ببینید — هرگز secret واقعی را commit نکنید.

## ۷) دامنه، HTTPS، بکاپ

- **دامنه/DNS**: `A` رکورد به IP سرور، سپس `Caddy`/`Nginx` + `Let's Encrypt` (یا سرویس مدیریت‌شده)
- **HTTPS**: `APP_URL=https://yourdomain.tld` + `Secure` کوکی خودکار در production
- **Health check**: `GET /api/v1/plans` — در Dockerfile و compose تعریف شده
- **بکاپ**: volume `pgdata` → `pg_dump` دوره‌ای + نگهداری off-site
  ```bash
  docker compose exec db pg_dump -U petins pet_insurance_dev | gzip > pg-$(date +%F).sql.gz
  # restore:
  cat pg-2025-10-19.sql | docker compose exec -T db psql -U petins pet_insurance_dev
  ```
- **فایل‌ها**: volume `uploads` — در production به S3 خصوصی با لینک کوتاه‌عمر مهاجرت کنید (درایور `s3` آماده است)

## ۸) مسیرها و نقش‌ها

| مسیر | نقش مجاز |
|---|---|
| `/` , `/plans` , `/clinics`, `/clinics/[slug]` | همه |
| `/login` , `/register` | مهمان |
| `/dashboard` | همهٔ احرازشده (محتوای نقش‌محور) |
| `/dashboard/pets*` | OWNER |
| `/dashboard/requests/new` | CLINIC |
| `/dashboard/requests` , `/dashboard/requests/[id]` | نقش‌محور (مالک فقط مال خود، کلینیک فقط مال خود) |
| `/dashboard/review` | REVIEWER, ADMIN |
| `/dashboard/settlements` | CLINIC (فقط مال خود), REVIEWER, ADMIN |
| `/dashboard/pricing` | REVIEWER, ADMIN |
| `/dashboard/admin` | ADMIN |

API: `/api/v1/**` — مجوزها سمت سرور، هرگز فقط در UI نیستند.

## ۹) واحد پول و تاریخ

- DB: **ریالِ صحیح** (`Int`), UI: **تومان** (ریال/۱۰), نرخ: **bps**
- تاریخ DB: `timestamptz` UTC, UI: **شمسی** با `src/lib/jalali.ts` (۰ خطا در برابر `Intl` برای 1900–2100)، منطقه نمایش `Asia/Tehran`

## ۱۰) قابلیت‌های شبیه‌سازی‌شده

`docs/DISABLED-OR-SIMULATED.md` را ببینید — خلاصه: پرداخت واقعی ❌، تسویه فقط SIMULATED، نقشه/نوبت‌دهی/ویزیت ❌، نرخ‌ها نمونه.

## ۱۱) معماری و ERD

`docs/architecture.md` و `PLAN.md` را ببینید. دیاگرام ERD به‌صورت Mermaid در architecture مستند شده است.

## ۱۲) عیب‌یابی

- **`P1000` auth failed**: `DATABASE_URL` و رمز `petins` را چک کنید؛ `psql -h 127.0.0.1 -U petins -d pet_insurance_dev -c "select 1"`
- **کوکی session پاک می‌شود**: `AUTH_SECRET` بین buildها تغییر کرده — مقدار ثابت در `.env` بگذارید
- **فایل آپلود 413**: `MAX_UPLOAD_BYTES` و `serverActions.bodySizeLimit` را چک کنید
- **نقشه خالی**: عمداً غیرفعال است — برای فعال‌سازی کلید Maps + `S3`/`STORAGE_DRIVER` را پیکربندی کنید
- **build lint patch error**: ESLint 9 + `eslint-config-next` ناسازگار — با `npm run build -- --no-lint` یا downgrade به ESLint 8 حل می‌شود (تأثیری بر اجرا ندارد)

---

## ۱۳) استقرار production چک‌لیست smoke

- [ ] صفحه اصلی لود می‌شود
- [ ] ورود با هر نقش کار می‌کند
- [ ] مالک: افزودن حیوان
- [ ] کلینیک: ثبت صورتحساب → ارسال
- [ ] کارشناس: بررسی انسانی + تعیین سهم‌ها + انتقال به تسویه + ثبت تسویه شبیه‌سازی‌شده
- [ ] مالک: مشاهده سهم‌ها و تاریخچه وضعیت‌ها سازگار
- [ ] فایل خصوصی بدون auth قابل دسترسی نیست
- [ ] بنر «نسخهٔ دمو» نمایش داده می‌شود

---

ساخته‌شده با Next.js 15 + Prisma 6 + PostgreSQL 17 — آماده برای اتصال اپلیکیشن Native از طریق `/api/v1`.
