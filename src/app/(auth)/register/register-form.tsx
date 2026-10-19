"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "", acceptTerms: false });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        if (body.error?.details?.fieldErrors) {
          const fe: Record<string, string> = {};
          for (const [k, v] of Object.entries(body.error.details.fieldErrors as Record<string, string[]>)) fe[k] = v[0] ?? "";
          setFieldErrors(fe);
        }
        setError(body.error?.message ?? "ثبت‌نام ناموفق بود.");
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setError("خطای شبکه.");
    } finally {
      setLoading(false);
    }
  }

  function upd<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((f) => ({ ...f, [k]: v })); }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <Input label="نام" value={form.firstName} onChange={(e) => upd("firstName", e.target.value)} required error={fieldErrors.firstName} />
        <Input label="نام خانوادگی" value={form.lastName} onChange={(e) => upd("lastName", e.target.value)} required error={fieldErrors.lastName} />
      </div>
      <Input label="ایمیل (اختیاری اگر موبایل دارید)" value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="name@example.com" error={fieldErrors.email} dir="ltr" />
      <Input label="شماره موبایل (اختیاری اگر ایمیل دارید)" value={form.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="09123456789" error={fieldErrors.phone} dir="ltr" />
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">رمز عبور</label>
        <div className="flex gap-2">
          <input type={showPass ? "text" : "password"} value={form.password} onChange={(e) => upd("password", e.target.value)} required className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" dir="ltr" />
          <Button type="button" variant="outline" onClick={() => setShowPass((v) => !v)}>{showPass ? "مخفی" : "نمایش"}</Button>
        </div>
        {fieldErrors.password && <p className="text-xs text-red-600">{fieldErrors.password}</p>}
      </div>
      <Input label="تکرار رمز" type={showPass ? "text" : "password"} value={form.confirmPassword} onChange={(e) => upd("confirmPassword", e.target.value)} required error={fieldErrors.confirmPassword} dir="ltr" />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={form.acceptTerms} onChange={(e) => upd("acceptTerms", e.target.checked)} className="mt-1" />
        <span>شرایط استفاده و حریم خصوصی را می‌پذیرم. <span className="text-slate-400">(متن نهایی نیازمند بازبینی حقوقی)</span></span>
      </label>
      {fieldErrors.acceptTerms && <p className="text-xs text-red-600">{fieldErrors.acceptTerms}</p>}
      <Button type="submit" loading={loading} className="w-full">ثبت‌نام</Button>
    </form>
  );
}
