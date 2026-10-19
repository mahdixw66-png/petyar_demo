"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RequestActions({ req, sessionRole }: { req: { id:string; status:string; totalAmountRial:number }; sessionRole:string }){
  const router=useRouter();
  const [reason,setReason]=useState("");
  const [eligible,setEligible]=useState(String(req.totalAmountRial));
  const [insurer,setInsurer]=useState("");
  const [owner,setOwner]=useState("");
  const [loading,setLoading]=useState<string | null>(null);
  const [error,setError]=useState<string|null>(null);
  const [success,setSuccess]=useState<string|null>(null);

  async function call(url:string, body?: unknown){
    setError(null); setSuccess(null);
    setLoading(url);
    try{
      const res=await fetch(url,{method:"POST", headers:{"Content-Type":"application/json"}, body: body? JSON.stringify(body): undefined});
      const j=await res.json();
      if(!res.ok || !j.success){ setError(j.error?.message ?? "خطا"); return false; }
      setSuccess("عملیات با موفقیت انجام شد.");
      router.refresh();
      return true;
    } catch{ setError("خطای شبکه"); return false; } finally{ setLoading(null); }
  }

  return (
    <Card>
      <CardHeader><CardTitle>اقدامات</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {(sessionRole==="CLINIC" && req.status==="DRAFT") && (
          <div className="flex gap-2"><Button onClick={()=>call(`/api/v1/requests/${req.id}/submit`)} loading={loading===`/api/v1/requests/${req.id}/submit`}>ارسال برای بررسی</Button></div>
        )}

        {(sessionRole==="CLINIC" && req.status==="NEEDS_CORRECTION") && (
          <div className="flex gap-2"><Button onClick={()=>call(`/api/v1/requests/${req.id}/resubmit`)} loading={loading?.includes("resubmit") ?? false}>ارسال مجدد پس از اصلاح</Button><span className="text-xs text-slate-500 py-2">در صورت نیاز ردیف‌ها را از ویرایش پرونده اصلاح کنید (در این نسخه ارسال مجدد بدون تغییر ردیف‌ها انجام می‌شود).</span></div>
        )}

        {(["REVIEWER","ADMIN"].includes(sessionRole) && req.status==="SUBMITTED") && (
          <Button onClick={()=>call(`/api/v1/requests/${req.id}/claim`)} loading={loading===`/api/v1/requests/${req.id}/claim`}>شروع بررسی (Claim)</Button>
        )}

        {(["REVIEWER","ADMIN"].includes(sessionRole) && req.status==="UNDER_REVIEW") && (
          <div className="space-y-3 rounded-xl border p-4 bg-slate-50">
            <Textarea label="دلیل تصمیم (برای رد/اصلاح الزامی)" value={reason} onChange={e=>setReason(e.target.value)} placeholder="حداقل ۵ کاراکتر" />
            <div className="grid grid-cols-3 gap-2">
              <Input label="مبلغ واجد شرایط (ریال)" type="number" value={eligible} onChange={e=>setEligible(e.target.value)} />
              <Input label="سهم بیمه (ریال)" type="number" value={insurer} onChange={e=>setInsurer(e.target.value)} />
              <Input label="سهم مالک (ریال)" type="number" value={owner} onChange={e=>setOwner(e.target.value)} />
            </div>
            <p className="text-xs text-slate-500">برای تأیید، مجموع سهم‌ها باید برابر مبلغ واجد شرایط باشد و از کل بیشتر نباشد.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={()=>call(`/api/v1/requests/${req.id}/decide`,{decision:"APPROVE", reason: reason||"تأیید شده", eligibleAmountRial:Number(eligible), insurerShareRial:Number(insurer), ownerShareRial:Number(owner)})} loading={loading?.includes("decide") ?? false}>تأیید</Button>
              <Button variant="danger" onClick={()=>call(`/api/v1/requests/${req.id}/decide`,{decision:"REJECT", reason})}>رد</Button>
              <Button variant="outline" onClick={()=>call(`/api/v1/requests/${req.id}/decide`,{decision:"REQUEST_CORRECTION", reason})}>درخواست اصلاح</Button>
            </div>
          </div>
        )}

        {(["REVIEWER","ADMIN"].includes(sessionRole) && req.status==="APPROVED") && (
          <Button onClick={()=>call(`/api/v1/requests/${req.id}/pending-settlement`)} loading={loading===`/api/v1/requests/${req.id}/pending-settlement`}>انتقال به صف تسویه</Button>
        )}

        {(["REVIEWER","ADMIN"].includes(sessionRole) && req.status==="PENDING_SETTLEMENT") && (
          <div className="space-y-2">
            <Alert variant="warning">این اقدام پرداخت واقعی انجام نمی‌دهد — فقط ثبت تسویهٔ آزمایشی (دمو) است.</Alert>
            <Button onClick={async()=>{
              if(!confirm("آیا از ثبت تسویهٔ آزمایشی اطمینان دارید؟ این پرداخت واقعی نیست.")) return;
              await call(`/api/v1/requests/${req.id}/settle`,{});
            }} loading={loading===`/api/v1/requests/${req.id}/settle`}>ثبت تسویهٔ آزمایشی</Button>
          </div>
        )}

        {!(
          (sessionRole==="CLINIC" && ["DRAFT","NEEDS_CORRECTION"].includes(req.status)) ||
          (["REVIEWER","ADMIN"].includes(sessionRole) && ["SUBMITTED","UNDER_REVIEW","APPROVED","PENDING_SETTLEMENT"].includes(req.status))
        ) && <p className="text-sm text-slate-500">در این وضعیت اقدامی برای نقش شما وجود ندارد.</p>}
      </CardContent>
    </Card>
  );
}
