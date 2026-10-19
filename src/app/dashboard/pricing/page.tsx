import { getCurrentSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, IllustrativeBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { PricingClient } from "./pricing-client";

export const dynamic="force-dynamic";

export default async function PricingPage(){
  const session=await getCurrentSession();
  if(!session || !["REVIEWER","ADMIN"].includes(session.role)) redirect("/dashboard");
  const [assumptions, runs, serviceGroups]=await Promise.all([
    prisma.pricingAssumption.findMany({where:{status:{in:["DRAFT","PROPOSED","APPROVED"]}}, orderBy:{createdAt:"desc"}, take:30, include:{serviceGroup:true}}),
    prisma.pricingRun.findMany({orderBy:{createdAt:"desc"}, take:20}),
    prisma.serviceGroup.findMany({orderBy:{sortOrder:"asc"}})
  ]);
  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-bold">قیمت‌گذاری داخلی (Sandbox)</h1>
      <Alert variant="warning">این بخش فقط برای تحلیل/آموزش است و با برچسب «مدل تخمینی/آموزشی، نه نرخ مصوب» نمایش داده می‌شود. خروجی‌ها به‌صورت خودکار روی طرح عمومی اثر نمی‌گذارند.</Alert>
      <PricingClient assumptions={assumptions} runs={runs} serviceGroups={serviceGroups} />
      <Card><CardHeader><CardTitle>فرضیات ثبت‌شده</CardTitle></CardHeader><CardContent>
        {assumptions.length===0? <p className="text-sm text-slate-500">فرضی وجود ندارد.</p> :
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b text-slate-500"><th className="p-2 text-right">کد</th><th>گونه</th><th>گروه</th><th>میانگین هزینه</th><th>فراوانی</th><th>سهم بیمه</th><th>وضعیت</th></tr></thead><tbody>{assumptions.map(a=> <tr key={a.id} className="border-b"><td className="p-2">{a.code}</td><td>{a.species}</td><td>{a.serviceGroup?.nameFa ?? "—"}</td><td>{(a.avgCostRial/10).toLocaleString("fa-IR")} تومان</td><td>{a.annualFrequency}</td><td>{(a.insurerPayShareBps/100).toFixed(0)}%</td><td><Badge tone="neutral">{a.status}</Badge></td></tr>)}</tbody></table></div>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>اجراهای محاسباتی</CardTitle></CardHeader><CardContent>
        {runs.length===0? <p className="text-sm text-slate-500">هنوز اجرایی ثبت نشده.</p> :
        <ul className="space-y-2">{runs.map(r=> <li key={r.id} className="rounded-xl border p-3 text-sm"><div className="font-medium">{r.name} — {r.species}</div><pre className="whitespace-pre-wrap text-xs text-slate-600 mt-1">{JSON.stringify(r.outputs, null, 2)}</pre></li>)}</ul>}
      </CardContent></Card>
    </div>
  );
}
