import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { REQUEST_STATUS_META } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { formatJalali } from "@/lib/jalali";
import { RequestActions } from "./request-actions";
import { UploadForm } from "./upload-form";

export const dynamic="force-dynamic";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }){
  const { id } = await params;
  const session=await getCurrentSession();
  if(!session) redirect("/login");
  const req=await prisma.treatmentRequest.findUnique({
    where:{ id },
    include:{
      lines:{ include:{ serviceGroup:true}, orderBy:{sortOrder:"asc"} },
      pet:{ include:{ owner:{select:{firstName:true,lastName:true,phone:true,email:true}}}},
      policy:{ include:{plan:true, planVersion:true}},
      clinic:true,
      attachments:true,
      decisions:{ orderBy:{createdAt:"desc"}, include:{reviewer:{select:{firstName:true,lastName:true}}}},
      statusEvents:{ orderBy:{createdAt:"asc"}},
      settlement:true
    }
  });
  if(!req) return notFound();
  // access control
  if(session.role==="OWNER" && req.ownerId!==session.sub) return notFound();
  if(session.role==="CLINIC" && req.clinicId!==session.clinicId) return notFound();

  const meta=REQUEST_STATUS_META[req.status as keyof typeof REQUEST_STATUS_META];

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">درخواست {req.trackingCode}</h1>
          <p className="text-sm text-slate-500">ثبت: {formatJalali(req.createdAt, {withTime:true})} — خدمت: {formatJalali(req.serviceDate)}</p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <Alert variant={meta.tone==="danger"?"danger": meta.tone==="success"?"success":"info"}>{meta.description}</Alert>
      {req.status==="APPROVED" && <Alert variant="warning">وضعیت «تأییدشده» به‌معنای تأیید بیمه‌ای است، نه پرداخت. تسویه جداگانه ثبت می‌شود.</Alert>}
      {req.settlement && <Alert variant="success">تسویهٔ آزمایشی ثبت شد — مبلغ {formatMoney(req.settlement.amountRial)} — مرجع: {req.settlement.reference ?? "—"} — این پرداخت واقعی نیست.</Alert>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>حیوان و مالک</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
          <div>حیوان: <b>{req.pet.name}</b> — {req.pet.species==="DOG"?"سگ":"گربه"} — {req.pet.breed ?? "—"}</div>
          <div>مالک: {req.pet.owner.firstName} {req.pet.owner.lastName} — {req.pet.owner.phone ?? req.pet.owner.email}</div>
          <div>کلینیک: {req.clinic.name} — {req.clinic.city}</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>بیمه‌نامه</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
          <div>شماره: <span dir="ltr">{req.policy.publicId}</span> — طرح: {req.policy.plan.name}</div>
          <div>نسخه شرایط: {req.policy.planVersion.versionCode} — {req.policy.planVersion.isIllustrative? "نمونه": "مصوب"}</div>
          <div>اعتبار: {formatJalali(req.policy.startDate)} تا {formatJalali(req.policy.endDate)} — وضعیت: {req.policy.status}</div>
          {req.invoiceNumber && <div>شماره فاکتور: {req.invoiceNumber}</div>}
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>ردیف‌های صورتحساب — جمع کل: {formatMoney(req.totalAmountRial)}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-slate-500"><th className="p-2 text-right">خدمت</th><th className="p-2">گروه</th><th className="p-2">تعداد</th><th className="p-2">مبلغ واحد</th><th className="p-2">جمع</th><th className="p-2">وضعیت پوشش</th></tr></thead>
              <tbody>{req.lines.map(l=> (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="p-2">{l.description}</td>
                  <td className="p-2">{l.serviceGroup.nameFa}</td>
                  <td className="p-2 text-center">{l.quantity}</td>
                  <td className="p-2 text-center">{formatMoney(l.unitAmountRial)}</td>
                  <td className="p-2 text-center font-medium">{formatMoney(l.lineTotalRial)}</td>
                  <td className="p-2 text-center"><Badge tone={l.coverageStatus==="ELIGIBLE"?"success": l.coverageStatus==="NOT_ELIGIBLE"?"danger":"warning"}>{l.coverageStatus}</Badge></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">مبلغ واجد شرایط: <b>{req.eligibleAmountRial!=null? formatMoney(req.eligibleAmountRial): "—"}</b></div>
            <div className="rounded-xl bg-emerald-50 p-3">سهم بیمه: <b>{req.insurerShareRial!=null? formatMoney(req.insurerShareRial): "—"}</b></div>
            <div className="rounded-xl bg-amber-50 p-3">سهم مالک: <b>{req.ownerShareRial!=null? formatMoney(req.ownerShareRial): "—"}</b></div>
          </div>
          {req.rejectionReason && <Alert variant="danger" className="mt-3">دلیل رد: {req.rejectionReason}</Alert>}
          {req.correctionReason && <Alert variant="warning" className="mt-3">دلیل درخواست اصلاح: {req.correctionReason}</Alert>}
          {req.clinicalSummary && <p className="mt-3 text-sm text-slate-600">شرح بالینی: {req.clinicalSummary}</p>}
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle>مدارک</CardTitle></CardHeader><CardContent>
        {req.attachments.length===0? <p className="text-sm text-slate-500">مدرکی بارگذاری نشده.</p> :
        <ul className="space-y-2">{req.attachments.map(a=> <li key={a.id} className="flex justify-between rounded-xl border p-3 text-sm"><span>{a.originalName} — {a.docType} — {(a.sizeBytes/1024).toFixed(0)}KB</span><a href={`/api/v1/files/${a.id}`} target="_blank" className="text-teal-700 underline">دانلود</a></li>)}</ul>}
        <div className="mt-4"><UploadForm requestId={req.id} canUpload={["DRAFT","NEEDS_CORRECTION","RESUBMITTED","SUBMITTED","UNDER_REVIEW"].includes(req.status) && (session.role==="CLINIC" || session.role==="REVIEWER" || session.role==="ADMIN")} /></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>تاریخچه وضعیت‌ها</CardTitle></CardHeader><CardContent>
        <ol className="relative border-r pr-4 space-y-3">
          {req.statusEvents.map(ev=> (
            <li key={ev.id} className="text-sm">
              <div className="font-medium">{ev.fromStatus ?? "—"} → {ev.toStatus} <span className="text-slate-500">— {formatJalali(ev.createdAt, {withTime:true})}</span></div>
              {ev.note && <div className="text-slate-600">{ev.note}</div>}
              {ev.actorId && <div className="text-xs text-slate-400">توسط: {ev.actorId.slice(0,8)}</div>}
            </li>
          ))}
        </ol>
      </CardContent></Card>

      {req.decisions.length>0 && (
        <Card><CardHeader><CardTitle>تصمیم‌های کارشناسی</CardTitle></CardHeader><CardContent>
          <ul className="space-y-2">{req.decisions.map(d=> <li key={d.id} className="rounded-xl border p-3 text-sm"><div className="font-medium">{d.decision} — {d.reviewer.firstName} {d.reviewer.lastName} — {formatJalali(d.createdAt, {withTime:true})}</div><div className="text-slate-600">دلیل: {d.reason}</div></li>)}</ul>
        </CardContent></Card>
      )}

      <RequestActions req={{ id:req.id, status:req.status, totalAmountRial:req.totalAmountRial }} sessionRole={session.role} />

      {(session.role==="OWNER") && (
        <Alert variant="info">شما به‌عنوان مالک، جزئیات سهم‌ها و وضعیت را فقط پس از ثبت تصمیم معتبر می‌بینید. درخواست بازپرداخت مستقل در این نسخه وجود ندارد؛ تسویه به کلینیک انجام می‌شود.</Alert>
      )}
    </div>
  );
}
