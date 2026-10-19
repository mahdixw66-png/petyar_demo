# مستند API — /api/v1

همهٔ پاسخ‌ها: `{ success: true, data: ... }` یا `{ success: false, error: { code, message, details? } }`

## احراز هویت
- `POST /api/v1/auth/register` — ثبت‌نام مالک (OWNER)
- `POST /api/v1/auth/login` — ورود (identifier: email/phone + password) ⇒ کوکی `session`
- `POST /api/v1/auth/logout` — خروج
- `GET /api/v1/auth/me` — وضعیت نشست

الگو خطا: `VALIDATION_ERROR` 422, `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `INVALID_STATE_TRANSITION` 409

## کلینیک‌ها و طرح‌ها
- `GET /api/v1/clinics?q=&city=&serviceGroupId=&page=&pageSize=`
- `GET /api/v1/plans` — طرح‌های منتشرشده + گروه‌های خدمت
- `GET /api/v1/search/pets?q=` — جستجوی حیوان (CLINIC/REVIEWER)

## حیوانات
- `GET /api/v1/pets` — فهرست حیوانات مالک
- `POST /api/v1/pets` — ایجاد حیوان (OWNER)
- `GET /api/v1/pets/:id`
- `PATCH /api/v1/pets/:id`

## بیمه‌نامه‌ها
- `GET /api/v1/policies?petId=` — فهرست بیمه‌نامه‌ها

## درخواست‌های درمان (صورتحساب)
- `GET /api/v1/requests?status=&q=&page=&pageSize=` — فهرست نقش‌محور
- `POST /api/v1/requests` — ایجاد پیش‌نویس (CLINIC) body: `CreateRequestInput`
- `GET /api/v1/requests/:id`
- `POST /api/v1/requests/:id/submit` — DRAFT → SUBMITTED (CLINIC)
- `POST /api/v1/requests/:id/claim` — SUBMITTED/RESUBMITTED → UNDER_REVIEW (REVIEWER)
- `POST /api/v1/requests/:id/decide` — UNDER_REVIEW → APPROVED/REJECTED/NEEDS_CORRECTION (REVIEWER) body: `ReviewDecisionInput`
- `POST /api/v1/requests/:id/resubmit` — NEEDS_CORRECTION → RESUBMITTED (CLINIC)
- `POST /api/v1/requests/:id/pending-settlement` — APPROVED → PENDING_SETTLEMENT (REVIEWER)
- `POST /api/v1/requests/:id/settle` — PENDING_SETTLEMENT → SETTLED_SIMULATED (REVIEWER) body: `{reference?, note?}`
- `GET /api/v1/requests/:id/attachments` — فهرست مدارک
- `POST /api/v1/requests/:id/attachments` — بارگذاری (multipart: file, docType)
- `GET /api/v1/files/:id` — دانلود خصوصی (احرازشده)

## قیمت‌گذاری
- `GET /api/v1/pricing/runs`
- `POST /api/v1/pricing/runs` — محاسبه P

## قراردادها
- Zod schemas در `src/lib/validators.ts` تنها منبع حقیقت
- مجوزها هرگز فقط در کلاینت چک نمی‌شوند
- `OpenAPI` کامل در آینده از همین Zod schemas قابل تولید است
