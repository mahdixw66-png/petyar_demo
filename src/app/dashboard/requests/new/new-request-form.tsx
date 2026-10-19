"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatMoney } from "@/lib/money";

type SG = { id:string; nameFa:string; code:string };
type PetOpt = { id:string; name:string; species:string; owner:{firstName:string;lastName:string}; policies:{id:string; publicId:string; plan:{name:string}}[] };

export function NewRequestForm({ serviceGroups, pets }: { serviceGroups: SG[]; pets: PetOpt[] }){
  const router=useRouter();
  const [petId,setPetId]=useState("");
  const [policyId,setPolicyId]=useState("");
  const [serviceDate,setServiceDate]=useState(new Date().toISOString().slice(0,10));
  const [invoiceNumber,setInvoiceNumber]=useState("");
  const [clinicalSummary,setClinicalSummary]=useState("");
  const [lines,setLines]=useState<{ serviceGroupId:string; description:string; quantity:number; unitAmountRial:number }[]>([{ serviceGroupId: serviceGroups[0]?.id ?? "", description:"", quantity:1, unitAmountRial:0 }]);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const [success,setSuccess]=useState<string|null>(null);

  const selectedPet=pets.find(p=>p.id===petId);
  const total= useMemo(()=> lines.reduce((a,l)=> a + l.unitAmountRial * l.quantity, 0), [lines]);

  function updateLine(idx:number, patch: Partial<typeof lines[0]>){
    setLines(ls=> ls.map((l,i)=> i===idx? {...l,...patch}: l));
  }

  async function submit(isDraft:boolean){
    setError(null); setSuccess(null); setLoading(true);
    try{
      const body={ petId, policyId, serviceDate, invoiceNumber, clinicalSummary, lines };
      const res=await fetch("/api/v1/requests",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
      const j=await res.json();
      if(!res.ok || !j.success){ setError(j.error?.message ?? "خطا در ثبت"); return; }
      const id=j.data.id as string;
      if(!isDraft){
        // submit immediately
        const r2=await fetch(`/api/v1/requests/${id}/submit`,{method:"POST"});
        const j2=await r2.json();
        if(!r2.ok || !j2.success){ setError(j2.error?.message ?? "ثبت شد اما ارسال ناموفق بود. از فهرست درخواست‌ها ارسال کنید."); return; }
        setSuccess("صورتحساب با موفقیت ارسال شد.");
        setTimeout(()=> router.push(`/dashboard/requests/${id}`), 800);
      } else {
        setSuccess("پیش‌نویس ذخیره شد.");
        setTimeout(()=> router.push(`/dashboard/requests/${id}`), 800);
      }
    } catch{ setError("خطای شبکه"); } finally{ setLoading(false); }
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card><CardHeader><CardTitle>انتخاب حیوان و بیمه‌نامه</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">حیوان</label>
          <Select value={petId} onChange={e=>{ setPetId(e.target.value); setPolicyId(""); }}>
            <option value="">— انتخاب کنید —</option>
            {pets.map(p=> <option key={p.id} value={p.id}>{p.name} — {p.species==="DOG"?"سگ":"گربه"} — مالک: {p.owner.firstName} {p.owner.lastName} ({p.policies.length} بیمه‌نامه)</option>)}
          </Select>
        </div>
        {selectedPet && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">بیمه‌نامه</label>
            <Select value={policyId} onChange={e=>setPolicyId(e.target.value)}>
              <option value="">— انتخاب کنید —</option>
              {selectedPet.policies.map(po=> <option key={po.id} value={po.id}>{po.publicId} — {po.plan.name}</option>)}
            </Select>
            {selectedPet.policies.length===0 && <p className="text-xs text-red-600">این حیوان بیمه‌نامهٔ فعال ندارد.</p>}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Input label="تاریخ مراجعه" type="date" value={serviceDate} onChange={e=>setServiceDate(e.target.value)} required />
          <Input label="شماره فاکتور (اختیاری)" value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)} />
        </div>
        <Textarea label="شرح بالینی (خلاصه)" value={clinicalSummary} onChange={e=>setClinicalSummary(e.target.value)} placeholder="خلاصهٔ خدمات ارائه‌شده…" />
      </CardContent></Card>

      <Card><CardHeader><CardTitle>ردیف‌های خدمت</CardTitle></CardHeader><CardContent className="space-y-3">
        {lines.map((l,idx)=> (
          <div key={idx} className="rounded-xl border p-3 space-y-2 bg-slate-50">
            <div className="flex justify-between items-center"><span className="text-sm font-medium">ردیف {idx+1}</span>{lines.length>1 && <Button size="sm" variant="ghost" onClick={()=> setLines(ls=> ls.filter((_,i)=> i!==idx))}>حذف</Button>}</div>
            <div className="space-y-1.5"><label className="text-xs font-medium">گروه خدمت</label><Select value={l.serviceGroupId} onChange={e=>updateLine(idx,{serviceGroupId:e.target.value})}>{serviceGroups.map(sg=> <option key={sg.id} value={sg.id}>{sg.nameFa}</option>)}</Select></div>
            <Input label="شرح خدمت" value={l.description} onChange={e=>updateLine(idx,{description:e.target.value})} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="تعداد" type="number" min={1} value={String(l.quantity)} onChange={e=>updateLine(idx,{quantity: Number(e.target.value)||1})} required />
              <Input label="مبلغ واحد (ریال)" type="number" min={0} value={String(l.unitAmountRial)} onChange={e=>updateLine(idx,{unitAmountRial: Number(e.target.value)||0})} required />
            </div>
            <div className="text-xs text-slate-600">جمع ردیف: {formatMoney(l.unitAmountRial * l.quantity)}</div>
          </div>
        ))}
        <Button variant="outline" onClick={()=> setLines(ls=> [...ls, {serviceGroupId: serviceGroups[0]?.id ?? "", description:"", quantity:1, unitAmountRial:0}])}>افزودن ردیف</Button>
        <div className="rounded-xl bg-white border p-3 text-sm">
          <div className="flex justify-between"><span>جمع کل صورتحساب:</span><b>{formatMoney(total)}</b></div>
          <div className="text-xs text-slate-500 mt-1">سهم برآوردی بیمه/مالک فقط پس از بررسی انسانی و با برچسب «برآورد/تأییدنشده» قابل نمایش است.</div>
        </div>
      </CardContent></Card>

      <div className="flex gap-2">
        <Button onClick={()=> submit(false)} loading={loading} disabled={!petId || !policyId || lines.length===0}>ذخیره و ارسال</Button>
        <Button variant="outline" onClick={()=> submit(true)} disabled={loading}>ذخیره پیش‌نویس</Button>
      </div>
    </div>
  );
}
