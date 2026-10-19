import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <h4 className="font-semibold text-slate-900">پت‌یار</h4>
            <p className="mt-2 leading-6 text-slate-500">
              پلتفرم بیمهٔ دامپزشکی سگ و گربه — نسخهٔ دمو. تمام داده‌ها و نرخ‌های نمایش‌داده‌شده نمونه و تأییدنشده‌اند.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">دسترسی سریع</h4>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li><Link href="/plans" className="hover:text-teal-700">طرح‌ها و مقایسه</Link></li>
              <li><Link href="/clinics" className="hover:text-teal-700">کلینیک‌ها</Link></li>
              <li><Link href="/login" className="hover:text-teal-700">ورود</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">قوانین</h4>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li><span className="text-slate-400">شرایط استفاده (نیازمند بازبینی حقوقی)</span></li>
              <li><span className="text-slate-400">حریم خصوصی (نیازمند بازبینی حقوقی)</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">تماس</h4>
            <p className="mt-2 text-slate-600">پشتیبانی دمو: demo@petyar.local<br />تهران، ایران</p>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-400 text-center">
          © {new Date().getFullYear()} پت‌یار — تمام حقوق محفوظ است. این محصول دمو است و هیچ تعهد بیمه‌ای ایجاد نمی‌کند.
        </div>
      </div>
    </footer>
  );
}
