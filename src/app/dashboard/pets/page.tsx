import Link from "next/link";
import { getCurrentSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatJalali } from "@/lib/jalali";

export const dynamic="force-dynamic";

export default async function PetsPage(){
  const session=await getCurrentSession();
  if(!session) redirect("/login");
  if(session.role!=="OWNER" && session.role!=="ADMIN") redirect("/dashboard");
  const pets=await prisma.pet.findMany({where:{ownerId: session.sub, deletedAt:null}, orderBy:{createdAt:"desc"}, include:{policies:{where:{deletedAt:null}, include:{plan:true}}}});
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">حیوانات من</h1><Link href="/dashboard/pets/new"><Button>افزودن حیوان</Button></Link></div>
      {pets.length===0? <Card className="p-8 text-center text-slate-500">هنوز حیوانی ثبت نکرده‌اید.</Card> :
      <div className="grid gap-4 sm:grid-cols-2">
        {pets.map(p=> (
          <Card key={p.id}>
            <CardHeader><CardTitle className="flex justify-between">{p.name} <Badge tone="neutral">{p.species==="DOG"?"سگ":"گربه"}</Badge></CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>نژاد: {p.breed ?? "—"}</div>
              <div>تاریخ تولد: {formatJalali(p.birthDate)}</div>
              <div>بیمه‌نامه‌ها: {p.policies.length? p.policies.map(po=> <span key={po.id} className="ml-2">{po.plan.name} ({po.status})</span>): "بدون بیمه‌نامه"}</div>
              <Link href={`/dashboard/pets/${p.id}`} className="inline-block mt-2 text-teal-700 text-sm">مشاهده و ویرایش ←</Link>
            </CardContent>
          </Card>
        ))}
      </div>}
    </div>
  );
}
