import Link from "next/link";
import { getCurrentSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatJalali } from "@/lib/jalali";
import { formatMoney } from "@/lib/money";

export const dynamic="force-dynamic";

export default async function ReviewQueuePage({ searchParams }: { searchParams: Promise<{ status?:string; q?:string }> }){
  const sp = await searchParams;
  const session=await getCurrentSession();
  if(!session || !["REVIEWER","ADMIN"].includes(session.role)) redirect("/dashboard");
  const statusFilter=sp.status || undefined;
  const q=sp.q || undefined;
  const where: Record<string,unknown>={};
  if(statusFilter) (where as Record<string,unknown>).status=statusFilter;
  else (where as Record<string,unknown>).status={ in:["SUBMITTED","UNDER_REVIEW","RESUBMITTED","NEEDS_CORRECTION","APPROVED","PENDING_SETTLEMENT"]};
  if(q) (where as Record<string,unknown>).OR=[{trackingCode:{contains:q, mode:"insensitive"}},{invoiceNumber:{contains:q, mode:"insensitive"}}];
  const items=await prisma.treatmentRequest.findMany({
    where: where as never,
    orderBy:{createdAt:"desc"},
    take:50,
    include:{ pet:{select:{name:true}}, clinic:{select:{name:true}}, policy:{select:{publicId:true}}}
  });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">صف کارشناسی</h1>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="شناسه پیگیری / فاکتور" className="h-9 rounded-xl border px-3 text-sm flex-1 max-w-xs" />
        <select name="status" defaultValue={statusFilter ?? ""} className="h-9 rounded-xl border px-3 text-sm">
          <option value="">همه (صف فعال)</option>
          <option value="SUBMITTED">ارسال‌شده</option>
          <option value="UNDER_REVIEW">در حال بررسی</option>
          <option value="RESUBMITTED">ارسال مجدد</option>
          <option value="NEEDS_CORRECTION">نیازمند اصلاح</option>
          <option value="APPROVED">تأییدشده</option>
          <option value="PENDING_SETTLEMENT">در انتظار تسویه</option>
        </select>
        <button type="submit" className="h-9 rounded-xl bg-slate-900 px-4 text-sm text-white">جست‌وجو</button>
      </form>
      {items.length===0? <Card className="p-8 text-center text-slate-500">موردی یافت نشد.</Card> :
      <div className="space-y-2">
        {items.map(r=> (
          <Card key={r.id}><CardContent className="pt-4 flex flex-wrap justify-between gap-2">
            <div>
              <div className="font-mono text-sm font-semibold" dir="ltr">{r.trackingCode} — {formatMoney(r.totalAmountRial)}</div>
              <div className="text-sm text-slate-600">{r.pet.name} — {r.clinic.name} — {r.policy.publicId} — {formatJalali(r.serviceDate)}</div>
            </div>
            <div className="flex items-center gap-2"><Badge tone="info">{r.status}</Badge><Link href={`/dashboard/requests/${r.id}`}><Button size="sm">بررسی</Button></Link></div>
          </CardContent></Card>
        ))}
      </div>}
    </div>
  );
}
