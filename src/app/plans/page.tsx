import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, IllustrativeBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { formatMoney } from "@/lib/money";
import { COVERAGE_STATUS_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      versions: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { coverageRules: { include: { serviceGroup: true }, orderBy: { serviceGroup: { sortOrder: "asc" } } }, exclusions: true },
      },
    },
  });
  const groups = await prisma.serviceGroup.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">طرح‌ها و مقایسهٔ پوشش</h1>
      <p className="mt-2 text-sm text-slate-600">تمام اعداد و جداول زیر نمونهٔ آموزشی و تأییدنشده‌اند. هر فیلد مصوب‌نشده با «هنوز نهایی نشده» نمایش داده شده است.</p>
      <Alert variant="warning" className="mt-4">برچسب «نمونهٔ آموزشی» به‌معنای عدم تعهد بیمه‌ای است. نرخ واقعی فقط با تأیید نقش مجاز منتشر می‌شود.</Alert>

      {/* comparison table as cards on mobile */}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-3 text-right font-semibold">گروه خدمت</th>
              {plans.map((p) => (
                <th key={p.id} className="p-3 text-center font-semibold">{p.name}<div className="text-xs font-normal text-slate-500">{p.code}</div></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{g.nameFa}</td>
                {plans.map((p) => {
                  const ver = p.versions[0];
                  const rule = ver?.coverageRules.find((r) => r.serviceGroupId === g.id);
                  const meta = rule ? COVERAGE_STATUS_META[rule.coverageStatus] : null;
                  return (
                    <td key={p.id} className="p-3 text-center">
                      {rule ? <Badge tone={meta!.tone}>{meta!.label}</Badge> : <Badge tone="neutral">هنوز نهایی نشده</Badge>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {plans.map((p) => {
          const ver = p.versions[0];
          return (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">{p.name} <IllustrativeBadge /></CardTitle>
                <p className="text-xs text-slate-500">نسخه: {ver?.versionCode ?? "هنوز نهایی نشده"} — {ver ? (ver.isIllustrative ? "نمونهٔ آموزشی" : "مصوب") : "—"}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>سقف سالانه: <b>{ver?.annualLimitRial ? formatMoney(ver.annualLimitRial) : "هنوز نهایی نشده"}</b></div>
                <div>فرانشیز: <b>{ver?.deductibleType === "UNSPECIFIED" ? "تعیین نشده" : ver?.deductibleType === "NONE" ? "بدون فرانشیز" : ver?.deductibleValue ? formatMoney(ver.deductibleValue) : "—"}</b></div>
                <div>دوره انتظار: <b>{ver?.waitingPeriodDays != null ? `${ver.waitingPeriodDays} روز` : "هنوز نهایی نشده"}</b></div>
                <div>سن واجد شرایط: <b>{ver?.minAgeMonths != null || ver?.maxAgeMonths != null ? `${ver?.minAgeMonths ?? "—"} تا ${ver?.maxAgeMonths ?? "—"} ماه` : "هنوز نهایی نشده"}</b></div>
                {ver?.exclusions && ver.exclusions.length > 0 && (
                  <div className="pt-2">
                    <div className="font-medium">استثناها:</div>
                    <ul className="list-disc pr-4 text-slate-600">{ver.exclusions.map((e) => <li key={e.id}>{e.title}</li>)}</ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 border-amber-200 bg-amber-50">
        <CardHeader><CardTitle className="text-amber-900">مثال محاسبهٔ صورتحساب (نمونهٔ آموزشی)</CardTitle><IllustrativeBadge /></CardHeader>
        <CardContent className="text-sm leading-6 text-slate-700">
          صورتحساب ۸,۰۰۰,۰۰۰ ریالی (۸۰۰,۰۰۰ تومان) شامل ویزیت + آزمایش. با فرض فرانشیز ۱,۰۰۰,۰۰۰ ریال و نرخ بازپرداخت ۷۰٪ ⇒ مبلغ واجد شرایط ۷,۰۰۰,۰۰۰ ریال، سهم بیمه ۴,۹۰۰,۰۰۰ ریال، سهم مالک ۳,۱۰۰,۰۰۰ ریال. این محاسبه فقط برای آموزش است.
        </CardContent>
      </Card>
    </div>
  );
}
