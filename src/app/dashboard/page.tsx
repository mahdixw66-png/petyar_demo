import { getCurrentSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatJalali } from "@/lib/jalali";
import { formatMoney } from "@/lib/money";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = (await getCurrentSession())!;
  if (session.role === "OWNER") {
    const [pets, policies, requests] = await Promise.all([
      prisma.pet.findMany({ where: { ownerId: session.sub, deletedAt: null }, take: 5, orderBy: { createdAt: "desc" } }),
      prisma.policy.findMany({ where: { ownerId: session.sub, deletedAt: null }, take: 5, orderBy: { createdAt: "desc" }, include: { plan: true, pet: true } }),
      prisma.treatmentRequest.findMany({ where: { ownerId: session.sub }, take: 5, orderBy: { createdAt: "desc" }, include: { pet: true } }),
    ]);
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-slate-900">داشبورد مالک</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{pets.length}</div><div className="text-sm text-slate-500">حیوانات ثبت‌شده</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{policies.filter(p=>p.status==="ACTIVE").length}</div><div className="text-sm text-slate-500">بیمه‌نامه فعال</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{requests.filter(r=>["SUBMITTED","UNDER_REVIEW","NEEDS_CORRECTION","RESUBMITTED"].includes(r.status)).length}</div><div className="text-sm text-slate-500">درخواست‌های باز</div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>حیوانات من</CardTitle></CardHeader>
          <CardContent>
            {pets.length===0 ? <p className="text-sm text-slate-500">هنوز حیوانی ثبت نکرده‌اید. <Link href="/dashboard/pets/new" className="text-teal-700 underline">افزودن حیوان</Link></p> :
            <ul className="space-y-2">{pets.map(p=> <li key={p.id} className="flex justify-between rounded-xl border p-3 text-sm"><span>{p.name} — {p.species==="DOG"?"سگ":"گربه"}</span><Link href={`/dashboard/pets/${p.id}`} className="text-teal-700">جزئیات</Link></li>)}</ul>}
            <div className="mt-3"><Link href="/dashboard/pets"><Button variant="outline" size="sm">مدیریت حیوانات</Button></Link> <Link href="/dashboard/pets/new"><Button size="sm">افزودن حیوان</Button></Link></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>آخرین درخواست‌ها</CardTitle></CardHeader>
          <CardContent>
            {requests.length===0 ? <p className="text-sm text-slate-500">هنوز درخواستی ندارید. درخواست توسط کلینیک ثبت می‌شود.</p> :
            <ul className="space-y-2">{requests.map(r=> <li key={r.id} className="flex justify-between rounded-xl border p-3 text-sm"><span>{r.trackingCode} — {r.pet.name}</span><span><Badge tone="info">{r.status}</Badge></span><Link href={`/dashboard/requests/${r.id}`} className="text-teal-700">مشاهده</Link></li>)}</ul>}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.role === "CLINIC") {
    const counts = await prisma.treatmentRequest.groupBy({ by: ["status"], where: { clinicId: session.clinicId! }, _count: true });
    const total = await prisma.treatmentRequest.count({ where: { clinicId: session.clinicId! } });
    const recent = await prisma.treatmentRequest.findMany({ where: { clinicId: session.clinicId! }, orderBy:{createdAt:"desc"}, take:6, include:{pet:true}});
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">داشبورد کلینیک</h1>
        <div className="grid gap-3 sm:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="text-xl font-bold">{total}</div><div className="text-xs text-slate-500">کل درخواست‌ها</div></CardContent></Card>
          {counts.map(c=> <Card key={c.status}><CardContent className="pt-6"><div className="text-lg font-bold">{c._count}</div><div className="text-xs text-slate-500">{c.status}</div></CardContent></Card>)}
        </div>
        <div className="flex gap-2"><Link href="/dashboard/requests/new"><Button>ثبت صورتحساب جدید</Button></Link><Link href="/dashboard/requests"><Button variant="outline">همهٔ درخواست‌ها</Button></Link></div>
        <Card><CardHeader><CardTitle>آخرین فعالیت‌ها</CardTitle></CardHeader><CardContent>{recent.length===0? <p className="text-sm text-slate-500">هنوز درخواستی ثبت نشده.</p> : <ul className="space-y-2">{recent.map(r=> <li key={r.id} className="flex justify-between border rounded-xl p-3 text-sm"><span>{r.trackingCode} — {r.pet.name}</span><Badge tone="neutral">{r.status}</Badge><Link href={`/dashboard/requests/${r.id}`} className="text-teal-700">مشاهده</Link></li>)}</ul>}</CardContent></Card>
      </div>
    );
  }

  // REVIEWER / ADMIN
  const [qSubmitted, qReview, qPending, recent] = await Promise.all([
    prisma.treatmentRequest.count({ where:{ status:"SUBMITTED"}}),
    prisma.treatmentRequest.count({ where:{ status:"UNDER_REVIEW"}}),
    prisma.treatmentRequest.count({ where:{ status:"PENDING_SETTLEMENT"}}),
    prisma.treatmentRequest.findMany({ orderBy:{createdAt:"desc"}, take:8, include:{pet:true, clinic:true}}),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">صف عملیات بیمه</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{qSubmitted}</div><div className="text-sm text-slate-500">ارسال‌شده (منتظر بررسی)</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{qReview}</div><div className="text-sm text-slate-500">در حال بررسی</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{qPending}</div><div className="text-sm text-slate-500">در انتظار تسویه</div></CardContent></Card>
      </div>
      <div className="flex gap-2"><Link href="/dashboard/review"><Button>رفتن به صف بررسی</Button></Link><Link href="/dashboard/settlements"><Button variant="outline">صف تسویه</Button></Link></div>
      <Card><CardHeader><CardTitle>آخرین درخواست‌ها</CardTitle></CardHeader><CardContent><ul className="space-y-2">{recent.map(r=> <li key={r.id} className="flex flex-wrap gap-2 items-center justify-between border rounded-xl p-3 text-sm"><span>{r.trackingCode} — {r.pet.name} — {r.clinic.name}</span><Badge tone="info">{r.status}</Badge><Link href={`/dashboard/requests/${r.id}`} className="text-teal-700">بررسی</Link></li>)}</ul></CardContent></Card>
    </div>
  );
}
