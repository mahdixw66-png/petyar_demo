import Link from "next/link";
import { getCurrentSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { REQUEST_STATUS_META } from "@/lib/constants";
import { formatJalali } from "@/lib/jalali";
import { formatMoney } from "@/lib/money";

export const dynamic="force-dynamic";

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }){
  const sp = await searchParams;
  const session=(await getCurrentSession())!;
  const where: Record<string, unknown>={};
  if(session.role==="OWNER") (where as Record<string,unknown>).ownerId=session.sub;
  else if(session.role==="CLINIC") (where as Record<string,unknown>).clinicId=session.clinicId;
  if(sp.status) (where as Record<string,unknown>).status=sp.status;
  if(sp.q) (where as Record<string,unknown>).trackingCode={ contains: sp.q, mode:"insensitive"};

  const items=await prisma.treatmentRequest.findMany({
    where: where as never,
    orderBy:{createdAt:"desc"},
    take: 50,
    include:{ pet:{select:{name:true, species:true}}, clinic:{select:{name:true}}, policy:{select:{publicId:true}} }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">درخواست‌ها / صورتحساب‌ها</h1>
        {session.role==="CLINIC" && <Link href="/dashboard/requests/new"><Button>ثبت صورتحساب</Button></Link>}
      </div>

      <form className="flex flex-wrap gap-2">
        <input name="q" placeholder="شناسه پیگیری" defaultValue={sp.q} className="h-9 rounded-xl border px-3 text-sm" />
        <select name="status" defaultValue={sp.status ?? ""} className="h-9 rounded-xl border px-3 text-sm">
          <option value="">همهٔ وضعیت‌ها</option>
          {Object.entries(REQUEST_STATUS_META).map(([k,v])=> <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button type="submit" className="h-9 rounded-xl bg-slate-900 px-4 text-sm text-white">اعمال فیلتر</button>
      </form>

      {items.length===0? <Card className="p-8 text-center text-slate-500">موردی یافت نشد.</Card> :
      <div className="space-y-3">
        {items.map(r=>{
          const meta=REQUEST_STATUS_META[r.status as keyof typeof REQUEST_STATUS_META];
          return (
            <Card key={r.id}>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-sm font-semibold" dir="ltr">{r.trackingCode}</div>
                    <div className="text-sm text-slate-600">{r.pet.name} — {r.clinic.name} — {formatJalali(r.serviceDate)}</div>
                    <div className="text-xs text-slate-500">{formatMoney(r.totalAmountRial)} — {r.policy.publicId}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <Link href={`/dashboard/requests/${r.id}`}><Button size="sm" variant="outline">مشاهده</Button></Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>}
    </div>
  );
}
