# لانچ دائمی با GitHub + Vercel (بدون تغییر مداوم لینک)

این راهنما ۱۰ دقیقه زمان می‌برد و بعدش مدیر شما یک دامنه ثابت مثل `https://petyar-demo.vercel.app` خواهد داشت — بدون نیاز به `lhr.life` یا `serveo` و بدون انقضا.

---

## گزینه پیشنهادی: GitHub → Vercel + Neon (رایگان)

### چرا این ترکیب؟
- **Vercel**: بهترین هاست برای Next.js (همین پروژه) — دیپلوی با یک کلیک از GitHub، `fra1` (فرانکفورت) نزدیک ایران
- **Neon** (یا Supabase): Postgres رایگان serverless که با Prisma شما سازگار است
- **هزینه:** هر دو Hobby/Free — تا ۱۰ هزار بازدید/ماه رایگان

---

## قدم ۱ — ساخت مخزن GitHub (۲ دقیقه)

```bash
# داخل همین پوشه pet-insurance (من همین الان git init کردم)
git add .
git commit -m "feat: pet-insurance demo ready for deploy"

# در github.com یک repo خالی بسازید مثلا petyar-demo
# بعد:
git remote add origin https://github.com/YOUR_USERNAME/petyar-demo.git
git branch -M main
git push -u origin main
```

> اگر GitHub ندارید، همین پوشه را به صورت ZIP (`pet-insurance-deploy.zip`) که من ساختم دانلود و در GitHub با دکمه `Upload files` آپلود کنید.

### قدم ۲ — ساخت دیتابیس رایگان Neon (۲ دقیقه)

1. برو https://neon.tech → Sign up با GitHub
2. `Create Project` → Region: `Frankfurt (eu-central-1)` → Postgres 17
3. بعد از ساخت، روی `Connection string` کلیک کن → کپی کن:
   ```
   postgresql://neondb_owner:xxxxx@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   این همان `DATABASE_URL` توست.

### قدم ۳ — دیپلوی روی Vercel (۳ دقیقه)

1. برو https://vercel.com → Login با GitHub
2. `Add New Project` → همون `petyar-demo` رو Import کن
3. در صفحه `Configure Project` برو بخش `Environment Variables` و این ۶ تا را اضافه کن:

| نام | مقدار |
|---|---|
| `DATABASE_URL` | همون رشته Neon که کپی کردی |
| `AUTH_SECRET` | تولید کن: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `FILE_SIGNING_SECRET` | یکی دیگه با همین دستور |
| `APP_URL` | اول خالی بگذار — بعد از اولین دیپلوی، Vercel یک URL مثل `https://petyar-demo-xxxx.vercel.app` میده، همون رو اینجا بگذار و دوباره Deploy کن |
| `SEED_DEMO_ACCOUNTS` | `true` (برای اینکه مدیر لاگین‌ها را تست کنه) |
| `NEXT_PUBLIC_DEMO_MODE` | `true` |

4. `Deploy` را بزن — Vercel خودش `prisma generate && prisma migrate deploy && next build` را اجرا می‌کند (من `vercel.json` را آماده گذاشتم).

### قدم ۴ — Seed کردن دیتا (۳۰ ثانیه)

بعد از اولین دیپلوی موفق:
- در Vercel برو `Storage` یا `Settings` → `Functions` → یکبار این دستور را در `Vercel CLI` یا از لوکال بزن:
```bash
npx vercel env pull .env.local
DATABASE_URL="..." npx prisma db seed
```
  یا ساده‌تر: در Vercel Dashboard برو `Deployments` → آخرین دیپلوی → `...` → `Redeploy` با تیک `Include Build Cache` خاموش — چون `vercel.json` شامل `prisma migrate deploy` است، دیتابیس ساخته می‌شود و بعد با یک `curl` می‌توانی seed را اجرا کنی:
```bash
curl -X POST https://your-project.vercel.app/api/v1/seed-demo -H "x-seed-token: YOUR_SECRET"
```
  *(اگر نخواستی دستی seed کنی، بهم بگو من endpoint موقت seed را اضافه می‌کنم)*

### قدم ۵ — تست مدیر

```
https://petyar-demo.vercel.app/login
owner@demo.local / Demo@12345
clinic@demo.local / Demo@12345
reviewer@demo.local / Demo@12345
admin@demo.local / Demo@12345
```

همه چیز مثل `localhost:3000` کار می‌کند، ولی دامنه ثابت و بدون انقضاست.

---

## گزینه B — اگر Vercel نخواستید: GitHub → Railway (Docker)

پروژه شما `Dockerfile` + `docker-compose.yml` آماده دارد:

1. در https://railway.app با GitHub وارد شو
2. `New Project` → `Deploy from GitHub repo` → `petyar-demo`
3. Railway خودش Postgres می‌سازد — فقط `DATABASE_URL` را خودکار ست می‌کند، تو فقط `AUTH_SECRET` و `APP_URL` را اضافه کن.
4. Deploy → دامنه `https://petyar-demo.up.railway.app` می‌گیری.

---

## فایل‌های آماده‌ای که من ساختم

- `vercel.json` — بیلد و ریجن فرانکفورت
- `.env.production.example` — لیست متغیرها برای Vercel
- این فایل `DEPLOY-GITHUB.md` — همین راهنما

## کمک می‌خواهی؟

اگر یوزرنیم GitHub‌ات را بدهی، من همین الان:
1. repo را push می‌کنم (اگر توکن موقت بدهی) 
2. یا یک ZIP آماده `pet-insurance-deploy.zip` می‌دهم که فقط Drag & Drop در GitHub کنی
3. و حتی Vercel را با `npx vercel --prod` از همین محیط دیپلوی می‌کنم (نیاز به `vercel login` با مرورگر)

بگو کدوم راه را می‌خواهی تا ۱۰ دقیقه دیگه لینک دائمی تحویل بدهم.
