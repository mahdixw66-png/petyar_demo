"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/input";

export function UploadForm({ requestId, canUpload }: { requestId:string; canUpload:boolean }){
  const router=useRouter();
  const [file,setFile]=useState<File|null>(null);
  const [docType,setDocType]=useState("INVOICE");
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  if(!canUpload) return <p className="text-xs text-slate-500">امکان بارگذاری در این وضعیت/نقش وجود ندارد.</p>;
  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!file){ setError("فایل را انتخاب کنید."); return; }
    setError(null); setLoading(true);
    try{
      const fd=new FormData();
      fd.append("file", file);
      fd.append("docType", docType);
      const res=await fetch(`/api/v1/requests/${requestId}/attachments`,{method:"POST", body:fd});
      const j=await res.json();
      if(!res.ok || !j.success){ setError(j.error?.message ?? "خطا"); return; }
      setFile(null); (document.getElementById(`file-${requestId}`) as HTMLInputElement).value="";
      router.refresh();
    } catch{ setError("خطای شبکه"); } finally{ setLoading(false); }
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <label className="text-xs font-medium">نوع مدرک</label>
        <Select value={docType} onChange={e=>setDocType(e.target.value)}>
          <option value="INVOICE">فاکتور</option>
          <option value="TREATMENT_REPORT">گزارش درمان</option>
          <option value="LAB_RESULT">نتیجه آزمایش</option>
          <option value="PRESCRIPTION">نسخه</option>
          <option value="IMAGING">تصویربرداری</option>
          <option value="OTHER">سایر</option>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">فایل (PDF/JPG/PNG/WEBP تا ۱۰MB)</label>
        <input id={`file-${requestId}`} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>setFile(e.target.files?.[0] ?? null)} className="block text-sm" />
      </div>
      <Button type="submit" loading={loading} size="sm">بارگذاری</Button>
      {error && <Alert variant="danger" className="w-full mt-2">{error}</Alert>}
    </form>
  );
}
