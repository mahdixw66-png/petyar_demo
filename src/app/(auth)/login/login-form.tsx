"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ identifier, password }),
      });
      let body: { success?: boolean; error?: { message?: string }; data?: unknown };
      try {
        body = await res.json();
      } catch {
        setError(`پاسخ سرور نامعتبر بود (وضعیت ${res.status}). لطفاً دوباره تلاش کنید.`);
        return;
      }
      if (!res.ok || !body.success) {
        setError(body.error?.message ?? `ورود ناموفق بود (وضعیت ${res.status}).`);
        return;
      }
      const dest = next ? decodeURIComponent(next) : "/dashboard";
      // ناوبری سخت برای اطمینان از ارسال کوکی HttpOnly در تمام مرورگرها/پیش‌نمایش
      window.location.href = dest;
      // fallback اگر location کار نکرد
      setTimeout(() => {
        router.push(dest);
        router.refresh();
      }, 100);
    } catch (err) {
      console.error("[login] fetch error", err);
      setError("خطای شبکه. دوباره تلاش کنید. کنسول مرورگر را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Alert variant="danger">{error}</Alert>}
      <Input label="ایمیل یا شماره موبایل" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="0912..." required autoComplete="username" dir="ltr" />
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">رمز عبور</label>
        <div className="flex gap-2">
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            dir="ltr"
          />
          <Button type="button" variant="outline" onClick={() => setShowPass((v) => !v)}>{showPass ? "مخفی" : "نمایش"}</Button>
        </div>
      </div>
      <Button type="submit" loading={loading} className="w-full">ورود</Button>
      <p className="text-center text-xs text-slate-500"><a href="#" className="hover:underline">بازیابی رمز (در نسخهٔ دمو غیرفعال)</a></p>
    </form>
  );
}
