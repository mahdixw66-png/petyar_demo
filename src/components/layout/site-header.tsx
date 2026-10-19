import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentSession } from "@/server/auth";
import { APP_SHORT_NAME } from "@/lib/constants";
import { PawPrint, LogOut, LayoutDashboard } from "lucide-react";

export async function SiteHeader() {
  const session = await getCurrentSession();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-teal-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white">
              <PawPrint className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline text-lg tracking-tight">{APP_SHORT_NAME}</span>
            <Badge tone="warning" className="hidden sm:inline-flex mr-2">دمو</Badge>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link href="/plans" className="rounded-lg px-3 py-2 hover:bg-slate-100">طرح‌ها</Link>
            <Link href="/clinics" className="rounded-lg px-3 py-2 hover:bg-slate-100">کلینیک‌ها</Link>
            <Link href="/#faq" className="rounded-lg px-3 py-2 hover:bg-slate-100">سؤالات متداول</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <span className="hidden sm:inline text-sm text-slate-600">
                {session.firstName} {session.lastName} <span className="text-slate-400">·</span> {session.role === "OWNER" ? "مالک" : session.role === "CLINIC" ? "کلینیک" : session.role === "REVIEWER" ? "کارشناس" : "مدیر"}
              </span>
              <Link href="/dashboard"><Button size="sm" variant="outline"><LayoutDashboard className="h-4 w-4" /> داشبورد</Button></Link>
              <form action="/api/v1/auth/logout" method="post">
                <Button size="sm" variant="ghost" type="submit"><LogOut className="h-4 w-4" /> خروج</Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login"><Button size="sm" variant="ghost">ورود</Button></Link>
              <Link href="/register"><Button size="sm">ثبت‌نام</Button></Link>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-amber-200 bg-amber-50">
        <div className="mx-auto max-w-7xl px-4 py-1.5 text-center text-xs text-amber-900 sm:px-6 lg:px-8">
          نسخهٔ دمو — داده‌ها، نرخ‌ها و مبالغ نمونه و تأییدنشده‌اند. هیچ پرداخت واقعی انجام نمی‌شود.
        </div>
      </div>
    </header>
  );
}
