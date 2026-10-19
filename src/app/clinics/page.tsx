import Link from "next/link";
import { prisma } from "@/server/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CONTRACT_STATUS_META } from "@/lib/constants";
import { MapPin, Phone, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClinicsPage({ searchParams }: { searchParams: Promise<{ q?: string; city?: string }> }) {
  const sp = await searchParams;
  const clinics = await prisma.clinic.findMany({
    where: {
      deletedAt: null,
      ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: "insensitive" } }, { address: { contains: sp.q, mode: "insensitive" } }] } : {}),
      ...(sp.city ? { city: { contains: sp.city, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    include: { services: { include: { serviceGroup: true } } },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">کلینیک‌های طرف قرارداد</h1>
      <p className="mt-2 text-sm text-slate-500">در نسخهٔ دمو، فهرست و اطلاعات نمونه‌اند. نقشه فقط در صورت پیکربندی کلید واقعی فعال می‌شود (فعلاً غیرفعال).</p>

      <form className="mt-6 flex flex-wrap gap-3">
        <input name="q" defaultValue={sp.q} placeholder="جست‌جو بر اساس نام یا آدرس" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm min-w-64 flex-1 max-w-md" />
        <input name="city" defaultValue={sp.city} placeholder="شهر" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm w-40" />
        <button type="submit" className="h-10 rounded-xl bg-teal-700 px-5 text-sm font-medium text-white hover:bg-teal-800">جست‌وجو</button>
      </form>

      {clinics.length === 0 ? (
        <Card className="mt-6 p-8 text-center text-slate-500">کلینیکی با این فیلتر یافت نشد.</Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clinics.map((c) => {
            const meta = CONTRACT_STATUS_META[c.contractStatus];
            return (
              <Link key={c.id} href={`/clinics/${c.slug}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" /> {c.city} {c.district ? `— ${c.district}` : ""}</div>
                    <div className="text-sm text-slate-600 line-clamp-1">{c.address}</div>
                    <div className="mt-2 flex items-center gap-1 text-sm text-slate-600"><Phone className="h-3.5 w-3.5" /> {c.phone}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.services.slice(0, 4).map((s) => <span key={s.serviceGroupId} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{s.serviceGroup.nameFa}</span>)}
                      {c.services.length > 4 && <span className="text-xs text-slate-400">+{c.services.length - 4}</span>}
                    </div>
                    <div className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.openingHours ? JSON.stringify(c.openingHours).slice(0,60) : "ساعات کاری در صفحهٔ جزئیات"}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
