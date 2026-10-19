import { getCurrentSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatJalali } from "@/lib/jalali";
import { formatMoney } from "@/lib/money";
import Link from "next/link";

export const dynamic="force-dynamic";

export default async function SettlementsPage(){
  const session=await getCurrentSession();
  if(!session || !["REVIEWER","ADMIN","CLINIC"].includes(session.role)) redirect("/dashboard");
  const pending=await prisma.treatmentRequest.findMany({
    where:{ status:"PENDING_SETTLEMENT", ...(session.role==="CLINIC"? {clinicId: session.clinicId!}: {})},
    orderBy:{ decidedAt:"desc"},
    take:30,
    include:{ pet:{select:{name:true}}, clinic:{select:{name:true}}}
  });
  const settled=await prisma.settlement.findMany({
    where: session.role==="CLINIC"? {clinicId: session.clinicId!}: {},
    orderBy:{createdAt:"desc"},
    take:30,
    include:{ request:{select:{trackingCode:true}}, clinic:{select:{name:true}}}
  });
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">صف تسویه</h1>
      <Card><CardHeader><CardTitle>در انتظار تسویه ({pending.length})</CardTitle></CardHeader><CardContent>
        {pending.length===0? <p className="text-sm text-slate-500">موردی در انتظار تسویه نیست.</p> :
        <ul className="space-y-2">{pending.map(r=> <li key={r.id} className="flex justify-between rounded-xl border p-3 text-sm"><span>{r.trackingCode} — {r.pet.name} — {r.clinic.name} — {r.insurerShareRial!=null? formatMoney(r.insurerShareRial): "—"}</span><Link href={`/dashboard/requests/${r.id}`} className="text-teal-700">مشاهده</Link></li>)}</ul>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>تسویه‌شده (آزمایشی) — {settled.length}</CardTitle></CardHeader><CardContent>
        {settled.length===0? <p className="text-sm text-slate-500">هنوز تسویه‌ای ثبت نشده.</p> :
        <ul className="space-y-2">{settled.map(s=> <li key={s.id} className="flex justify-between rounded-xl border p-3 text-sm"><span>{s.request.trackingCode} — {s.clinic.name} — {formatMoney(s.amountRial)} — {s.reference}</span><span className="text-xs text-slate-500">{formatJalali(s.settledAt)}</span></li>)}</ul>}
      </CardContent></Card>
      <p className="text-xs text-slate-500">تمام تسویه‌ها در این نسخه با حالت SIMULATED ثبت می‌شوند و هیچ انتقال وجه واقعی انجام نمی‌گیرد.</p>
    </div>
  );
}
