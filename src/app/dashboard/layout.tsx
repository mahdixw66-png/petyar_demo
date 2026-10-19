import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth";
import { Badge } from "@/components/ui/badge";

const navForRole = (role: string) => {
  if (role === "OWNER") return [
    { href: "/dashboard", label: "خلاصه" },
    { href: "/dashboard/pets", label: "حیوانات من" },
    { href: "/dashboard/requests", label: "درخواست‌ها" },
    { href: "/plans", label: "طرح‌ها" },
    { href: "/clinics", label: "کلینیک‌ها" },
  ];
  if (role === "CLINIC") return [
    { href: "/dashboard", label: "خلاصه کلینیک" },
    { href: "/dashboard/requests", label: "صورتحساب‌ها" },
    { href: "/dashboard/requests/new", label: "ثبت صورتحساب" },
    { href: "/clinics", label: "پروفایل کلینیک" },
  ];
  if (role === "REVIEWER") return [
    { href: "/dashboard", label: "صف بررسی" },
    { href: "/dashboard/review", label: "کارهای در انتظار" },
    { href: "/dashboard/settlements", label: "تسویه" },
    { href: "/dashboard/pricing", label: "قیمت‌گذاری" },
  ];
  // ADMIN
  return [
    { href: "/dashboard", label: "نمای کلی" },
    { href: "/dashboard/review", label: "صف کارشناسی" },
    { href: "/dashboard/settlements", label: "تسویه" },
    { href: "/dashboard/pricing", label: "قیمت‌گذاری" },
    { href: "/dashboard/admin", label: "مدیریت" },
  ];
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=" + encodeURIComponent("/dashboard"));
  const nav = navForRole(session.role);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full lg:w-64 shrink-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">{session.firstName} {session.lastName}</div>
            <div className="text-xs text-slate-500">{session.email ?? session.phone}</div>
            <Badge tone="info" className="mt-2">{session.role}</Badge>
            <nav className="mt-4 space-y-1">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-xl px-3 py-2 text-sm hover:bg-slate-50 text-slate-700">
                  {n.label}
                </Link>
              ))}
            </nav>
            <form action="/api/v1/auth/logout" method="post" className="mt-4">
              <button type="submit" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">خروج</button>
            </form>
          </div>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
