import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, IllustrativeBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { ShieldCheck, Stethoscope, FileText, CreditCard, MapPin, Clock, Star } from "lucide-react";

export default function HomePage() {
  return (
    <div className="bg-slate-50">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge tone="info" className="mb-4">نسخهٔ دمو — بدون پرداخت واقعی</Badge>
            <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-[2.6rem] lg:leading-[1.2]">
              بیمهٔ دامپزشکی
              <span className="text-teal-700"> سگ و گربه</span>
              <br />با پوشش شفاف و تسویهٔ مستقیم به کلینیک
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              حیوان خود را ثبت کنید، بیمه‌نامهٔ مناسب را ببینید، به کلینیک طرف قرارداد مراجعه کنید و صورتحساب را همان‌جا به بیمه بسپارید. تمام مبالغ این نسخه نمونه و تأییدنشده‌اند.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/plans"><Button size="lg">مشاهدهٔ طرح‌ها</Button></Link>
              <Link href="/clinics"><Button size="lg" variant="outline">یافتن کلینیک</Button></Link>
              <Link href="/register"><Button size="lg" variant="ghost">شروع / ثبت‌نام</Button></Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-teal-600" /> شرایط هر طرح نسخه‌بندی‌شده</span>
              <span className="inline-flex items-center gap-1"><Stethoscope className="h-4 w-4 text-teal-600" /> بدون ادعای «همهٔ هزینه‌ها پوشش دارد»</span>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="aspect-[4/2.8] rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center border border-teal-100">
                <div className="text-center p-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow text-3xl">🐾</div>
                  <p className="mt-3 text-sm font-medium text-teal-900">پت‌یار — همراه سلامت پت شما</p>
                  <p className="text-xs text-slate-500">تصویر تزئینی — بدون وابستگی خارجی</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-xl bg-slate-50 p-3"><div className="font-bold text-slate-900">۳ سطح طرح</div><div className="text-slate-500">پایه / استاندارد / کامل</div></div>
                <div className="rounded-xl bg-slate-50 p-3"><div className="font-bold text-slate-900">۸ گروه خدمت</div><div className="text-slate-500">اورژانس تا پیشگیرانه</div></div>
                <div className="rounded-xl bg-slate-50 p-3"><div className="font-bold text-slate-900">تسویه به کلینیک</div><div className="text-slate-500">آزمایشی/دمو</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-slate-900">چگونه کار می‌کند؟</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "۱", title: "ثبت حیوان و بیمه‌نامه", desc: "پروفایل سگ/گربه را بسازید و طرح را ببینید. نرخ‌ها نمونه‌اند.", icon: FileText },
            { n: "۲", title: "مراجعه به کلینیک طرف قرارداد", desc: "از فهرست کلینیک‌ها نزدیک‌ترین مرکز را پیدا کنید.", icon: MapPin },
            { n: "۳", title: "ثبت صورتحساب توسط کلینیک", desc: "کلینیک ردیف‌ها و فاکتور را ثبت و ارسال می‌کند.", icon: Stethoscope },
            { n: "۴", title: "بررسی و تسویهٔ آزمایشی", desc: "کارشناس بررسی می‌کند؛ سهم‌ها مشخص و تسویهٔ دمو ثبت می‌شود.", icon: CreditCard },
          ].map((s) => (
            <Card key={s.n}>
              <CardHeader><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white text-sm font-bold">{s.n}</div></CardHeader>
              <CardContent>
                <div className="font-semibold text-slate-900 flex items-center gap-2"><s.icon className="h-4 w-4 text-teal-600" /> {s.title}</div>
                <p className="mt-1 text-sm leading-6 text-slate-500">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Plans preview */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">طرح‌ها</h2>
          <Link href="/plans" className="text-sm text-teal-700 hover:underline">مقایسهٔ کامل ←</Link>
        </div>
        <Alert variant="warning" className="mt-4">تمام سقف‌ها، فرانشیزها و نرخ‌های نمایش‌داده‌شده <b>نمونهٔ آموزشی و تأییدنشده</b> هستند و هیچ تعهد بیمه‌ای ایجاد نمی‌کنند.</Alert>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {[
            { name: "پایه", price: "نمونه: ۱٫۲ میلیون تومان/سال", desc: "پوشش حوادث و اورژانس", features: ["حوادث و اورژانس ✓", "ویزیت بیماری واجد شرایط ✓", "تصویربرداری ✗", "پیشگیرانه ✗"] },
            { name: "استاندارد", price: "نمونه: ۲٫۴ میلیون تومان/سال", desc: "پوشش بیماری‌های واجد شرایط + آزمایش", featured: true, features: ["همهٔ موارد پایه ✓", "آزمایش و تصویربرداری پایه ✓", "جراحی/بستری (سقف‌دار) ✓", "پیشگیرانه ✗"] },
            { name: "کامل", price: "نمونه: ۴٫۱ میلیون تومان/سال", desc: "گسترده‌ترین پوشش نمونه", features: ["همهٔ موارد استاندارد ✓", "تخصصی و تشخیص پیشرفته △", "داروی تجویزشده ✓", "چکاپ سالانه (سقف‌دار) ✓"] },
          ].map((p) => (
            <Card key={p.name} className={p.featured ? "ring-2 ring-teal-600" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">{p.name} {p.featured && <Badge tone="success">پیشنهادی</Badge>}</CardTitle>
                <p className="text-sm text-slate-500">{p.desc}</p>
                <IllustrativeBadge />
                <p className="text-sm font-semibold text-teal-800 mt-2">{p.price}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  {p.features.map((f) => <li key={f}>• {f}</li>)}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Clinics preview */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-slate-900">کلینیک‌های نمونه طرف قرارداد</h2>
          <Link href="/clinics" className="text-sm text-teal-700 hover:underline">همهٔ کلینیک‌ها ←</Link>
        </div>
        <p className="mt-2 text-sm text-slate-500">فهرست و اطلاعات زیر نمونه و مخصوص نسخهٔ دمو است. نقشه فقط در صورت پیکربندی کلید واقعی فعال می‌شود.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "کلینیک مهر", city: "تهران — سعادت‌آباد", phone: "۰۲۱-۸۸۰۰۰۰۰۱", hours: "۸–۲۱", status: "فعال" },
            { name: "کلینیک پت‌سینا", city: "اصفهان — چهارباغ", phone: "۰۳۱-۳۲۲۰۰۰۰۲", hours: "۹–۲۰", status: "فعال" },
            { name: "کلینیک دامپزشکی آریا", city: "مشهد — احمدآباد", phone: "۰۵۱-۳۸۰۰۰۰۰۳", hours: "۷–۲۳ (اورژانس ۲۴ساعته)", status: "فعال" },
          ].map((c) => (
            <Card key={c.name}>
              <CardContent className="pt-5">
                <div className="font-semibold text-slate-900">{c.name}</div>
                <div className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" /> {c.city}</div>
                <div className="mt-1 text-sm text-slate-600">{c.phone}</div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <Badge tone="success">{c.status}</Badge>
                  <span className="inline-flex items-center gap-1 text-slate-500"><Clock className="h-3 w-3" /> {c.hours}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-slate-900">سؤالات متداول</h2>
        <div className="mt-4 grid gap-3">
          {[
            { q: "آیا پرداخت به کلینیک واقعی است؟", a: "خیر. در این نسخه (MVP) تسویه فقط به‌صورت «آزمایشی/شبیه‌سازی‌شده» ثبت می‌شود و هیچ انتقال وجه واقعی انجام نمی‌گیرد. وضعیت «تأییدشده» به‌معنای پرداخت نیست." },
            { q: "آیا می‌توانم خودم درخواست بازپرداخت ثبت کنم؟", a: "خیر. در مدل محصول، کلینیک صورتحساب را ثبت می‌کند و تسویه به کلینیک انجام می‌شود. مالک مبلغ و وضعیت را فقط مشاهده می‌کند." },
            { q: "آیا نرخ‌ها قطعی هستند؟", a: "خیر. تمام اعداد این سایت نمونهٔ آموزشی و تأییدنشده‌اند. سقف، فرانشیز، دورهٔ انتظار و استثناها هنوز نهایی نشده‌اند." },
            { q: "نوبت‌دهی و ویزیت آنلاین فعال است؟", a: "خیر. این قابلیت‌ها در MVP غیرفعال و فقط به‌صورت نمونهٔ UI نمایش داده می‌شوند." },
          ].map((f) => (
            <Card key={f.q}><CardContent className="pt-5"><div className="font-medium text-slate-900">{f.q}</div><p className="mt-1 text-sm leading-6 text-slate-600">{f.a}</p></CardContent></Card>
          ))}
        </div>
      </section>
    </div>
  );
}
