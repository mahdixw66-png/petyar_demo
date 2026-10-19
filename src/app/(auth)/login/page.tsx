import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; registered?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>ورود به حساب</CardTitle>
          <CardDescription>با ایمیل یا شماره موبایل وارد شوید.</CardDescription>
        </CardHeader>
        <CardContent>
          {sp.error && <Alert variant="danger" className="mb-4">{decodeURIComponent(sp.error)}</Alert>}
          {sp.registered && <Alert variant="success" className="mb-4">ثبت‌نام با موفقیت انجام شد. اکنون وارد شوید.</Alert>}
          <LoginForm next={sp.next} />
          <p className="mt-6 text-center text-sm text-slate-600">
            حساب ندارید؟ <a href="/register" className="font-medium text-teal-700 hover:underline">ثبت‌نام کنید</a>
          </p>
          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600 border border-slate-200">
            <div className="font-semibold text-slate-700">حساب‌های دمو (فقط محیط توسعه)</div>
            <div className="mt-1">مالک: owner@demo.local — کلینیک: clinic@demo.local — کارشناس: reviewer@demo.local — مدیر: admin@demo.local</div>
            <div>رمز همه: Demo@12345</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
