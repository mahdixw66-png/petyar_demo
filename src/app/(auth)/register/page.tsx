import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>ثبت‌نام صاحب حیوان</CardTitle>
          <CardDescription>ثبت‌نام فقط برای نقش «صاحب حیوان» است. حساب کلینیک/کارشناس فقط توسط مدیر ساخته می‌شود.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="mt-4 text-center text-sm text-slate-600">
            قبلاً ثبت‌نام کرده‌اید؟ <a href="/login" className="text-teal-700 hover:underline">وارد شوید</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
