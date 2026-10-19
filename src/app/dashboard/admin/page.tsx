import { getCurrentSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic="force-dynamic";

export default async function AdminPage(){
  const session=await getCurrentSession();
  if(!session || session.role!=="ADMIN") redirect("/dashboard");
  const [users, clinics, plans, audit]=await Promise.all([
    prisma.user.findMany({orderBy:{createdAt:"desc"}, take:30, select:{id:true, firstName:true, lastName:true, email:true, phone:true, role:true, status:true, isDemo:true}}),
    prisma.clinic.findMany({take:20, orderBy:{createdAt:"desc"}}),
    prisma.plan.findMany({include:{versions:true}}),
    prisma.auditEvent.findMany({orderBy:{createdAt:"desc"}, take:20})
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">مدیریت سامانه</h1>
      <Card><CardHeader><CardTitle>کاربران ({users.length})</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b text-slate-500"><th className="p-2 text-right">نام</th><th>ایمیل/موبایل</th><th>نقش</th><th>وضعیت</th></tr></thead><tbody>{users.map(u=> <tr key={u.id} className="border-b"><td className="p-2">{u.firstName} {u.lastName} {u.isDemo && <Badge tone="warning">دمو</Badge>}</td><td className="p-2" dir="ltr">{u.email ?? u.phone}</td><td><Badge tone="neutral">{u.role}</Badge></td><td>{u.status}</td></tr>)}</tbody></table></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>کلینیک‌ها</CardTitle></CardHeader><CardContent>
        <ul className="space-y-1 text-sm">{clinics.map(c=> <li key={c.id} className="flex justify-between border rounded-xl p-2"><span>{c.name} — {c.city}</span><Badge tone={c.contractStatus==="ACTIVE"?"success":"warning"}>{c.contractStatus}</Badge></li>)}</ul>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>طرح‌ها و نسخه‌ها</CardTitle></CardHeader><CardContent>
        {plans.map(p=> <div key={p.id} className="text-sm border rounded-xl p-3 mb-2"><div className="font-medium">{p.name} ({p.code}) — {p.versions.length} نسخه</div><ul className="text-xs text-slate-600 mt-1">{p.versions.map(v=> <li key={v.id}>{v.versionCode} — {v.status} — {v.isPublished?"منتشرشده":"پیش‌نویس"} — {v.isIllustrative?"نمونه":"مصوب"}</li>)}</ul></div>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>آخرین رویدادهای ممیزی</CardTitle></CardHeader><CardContent>
        <ul className="space-y-1 text-xs">{audit.map(a=> <li key={a.id} className="border rounded-xl p-2"><div>{a.action} — {a.result} — {a.summary.slice(0,120)}</div><div className="text-slate-400">{a.createdAt.toISOString().slice(0,19)}</div></li>)}</ul>
      </CardContent></Card>
      <Card className="border-amber-200 bg-amber-50"><CardContent className="pt-4 text-xs text-amber-900">ویرایش شرایط جدید نباید مفاد نسخهٔ متصل به بیمه‌نامهٔ موجود را بی‌صدا تغییر دهد — در این پیاده‌سازی هر Policy به PlanVersion مشخص متصل است.</CardContent></Card>
    </div>
  );
}
