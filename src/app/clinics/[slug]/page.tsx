import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { CONTRACT_STATUS_META } from "@/lib/constants";
import { MapPin, Phone, Mail, Globe, Clock } from "lucide-react";

export default async function ClinicDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clinic = await prisma.clinic.findUnique({ where: { slug }, include: { services: { include: { serviceGroup: true } } } });
  if (!clinic || clinic.deletedAt) return notFound();
  const meta = CONTRACT_STATUS_META[clinic.contractStatus];
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">{clinic.name} <Badge tone={meta.tone}>{meta.label}</Badge></CardTitle>
          <p className="text-sm text-slate-500">{clinic.city} {clinic.district ? `— ${clinic.district}` : ""}</p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6">
          <div className="flex items-center gap-2 text-slate-700"><MapPin className="h-4 w-4 text-teal-600" /> {clinic.address}</div>
          <div className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {clinic.phone}</span>
            {clinic.email && <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {clinic.email}</span>}
            {clinic.website && <span className="inline-flex items-center gap-1"><Globe className="h-4 w-4" /> {clinic.website}</span>}
          </div>
          {clinic.description && <p className="text-slate-600">{clinic.description}</p>}
          <div>
            <div className="font-medium flex items-center gap-1"><Clock className="h-4 w-4" /> ساعات کاری</div>
            <div className="mt-1 text-slate-600">{clinic.openingHours ? <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs">{JSON.stringify(clinic.openingHours, null, 2)}</pre> : "در این نسخهٔ دمو ساعات نمونه است."}</div>
          </div>
          <div>
            <div className="font-medium">خدمات</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {clinic.services.map((s) => <Badge key={s.serviceGroupId} tone="neutral">{s.serviceGroup.nameFa}</Badge>)}
            </div>
          </div>
          <Alert variant="info">مدارک لازم برای مراجعه: کارت شناسایی مالک، شناسهٔ حیوان/میکروچیپ (در صورت وجود) و فاکتور خدمات. در این نسخه، بارگذاری فاکتور توسط کلینیک انجام می‌شود.</Alert>
          <Alert variant="warning">نقشهٔ تعاملی در این نسخه غیرفعال است. برای فعال‌سازی نیاز به کلید API نقشه و پیکربندی محیط است.</Alert>
          <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500 border border-slate-200">
            نوبت‌دهی آنلاین و ویزیت تصویری در فاز بعد (غیرفعال). این بخش فقط نمونهٔ UI است.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
