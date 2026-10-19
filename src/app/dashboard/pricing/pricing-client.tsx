"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function PricingClient({ assumptions, runs, serviceGroups }: { assumptions:any[]; runs:any[]; serviceGroups:any[] }){
  const [form,setForm]=useState({ name:"محاسبه تست", species:"DOG", L:"50000000", F:"10000000", R:"5000000", C:"2000000", Vbps:"1500", Qbps:"1000" });
  const [result,setResult]=useState<null | {P:number; denominator:number}>(null);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);

  function calc(){
    setError(null); setResult(null);
    const L=Number(form.L), F=Number(form.F), R=Number(form.R), C=Number(form.C), Vbps=Number(form.Vbps), Qbps=Number(form.Qbps);
    const V=Vbps/10000, Q=Qbps/10000, denom=1-V-Q;
    if(denom<=0){ setError(`V+Q = ${((V+Q)*100).toFixed(1)}% ≥ 100% — مخرج نامثبت و محاسبه نامعتبر است.`); return; }
    const P=Math.round((L+F+R+C)/denom);
    setResult({P, denominator: denom});
  }

  async function saveRun(){
    if(!result){ setError("ابتدا محاسبه کنید."); return; }
    setLoading(true);
    try{
      const res=await fetch("/api/v1/pricing/runs",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name:form.name, species:form.species, L:Number(form.L), F:Number(form.F), R:Number(form.R), C:Number(form.C), Vbps:Number(form.Vbps), Qbps:Number(form.Qbps)})});
      const j=await res.json();
      if(!res.ok || !j.success){ setError(j.error?.message ?? "خطا"); return; }
      location.reload();
    } catch{ setError("خطای شبکه"); } finally{ setLoading(false); }
  }

  // Loss ratio demo
  const lossRatio = assumptions.length>0? (120000000/200000000): null;

  return (
    <div className="space-y-4">
      <Card className="border-amber-200 bg-amber-50"><CardContent className="pt-4 text-xs text-amber-900">فرمول: P = (L + F + R + C) / (1 - V - Q) — اگر V+Q ≥ 1 باشد محاسبه متوقف و خطا نمایش داده می‌شود. واحدها ریال و نرخ‌ها bps هستند.</CardContent></Card>
      <Card><CardHeader><CardTitle>محاسبه حق بیمه ناخالص (نمونه)</CardTitle></CardHeader><CardContent className="space-y-3">
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <Input label="نام اجرا" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
          <div className="space-y-1.5"><label className="text-sm font-medium">گونه</label><Select value={form.species} onChange={e=>setForm(f=>({...f,species:e.target.value}))}><option value="DOG">سگ</option><option value="CAT">گربه</option></Select></div>
          <Input label="L خسارت موردانتظار (ریال)" value={form.L} onChange={e=>setForm(f=>({...f,L:e.target.value}))} />
          <Input label="F هزینه ثابت (ریال)" value={form.F} onChange={e=>setForm(f=>({...f,F:e.target.value}))} />
          <Input label="R هزینه رسیدگی (ریال)" value={form.R} onChange={e=>setForm(f=>({...f,R:e.target.value}))} />
          <Input label="C بار ریسک (ریال)" value={form.C} onChange={e=>setForm(f=>({...f,C:e.target.value}))} />
          <Input label="V هزینه متغیر (bps)" value={form.Vbps} onChange={e=>setForm(f=>({...f,Vbps:e.target.value}))} hint="1500 = 15%" />
          <Input label="Q حاشیه سود (bps)" value={form.Qbps} onChange={e=>setForm(f=>({...f,Qbps:e.target.value}))} hint="1000 = 10%" />
        </div>
        <div className="flex gap-2"><Button onClick={calc}>محاسبه</Button><Button variant="outline" onClick={saveRun} loading={loading}>ذخیره اجرا</Button></div>
        {result && <div className="rounded-xl bg-white border p-3 text-sm">نتیجه: <b>{(result.P/10).toLocaleString("fa-IR")} تومان</b> — مخرج: {result.denominator.toFixed(3)}</div>}
        <div className="text-xs text-slate-500">Loss Ratio نمونه: {lossRatio? (lossRatio*100).toFixed(1)+"%": "داده کافی نیست"} — Combined Ratio: {lossRatio? ((lossRatio+0.25)*100).toFixed(1)+"%": "داده کافی نیست"}</div>
      </CardContent></Card>
    </div>
  );
}
