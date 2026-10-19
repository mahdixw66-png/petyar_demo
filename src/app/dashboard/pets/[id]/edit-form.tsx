"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { toDateInputValue } from "@/lib/jalali";

export function EditPetForm({ pet }: { pet: { id:string; name:string; species:string; breed:string|null; sex:string; birthDate:string|null; approxAgeMonths:number|null; weightKg:number|null; sterilized:boolean|null; notes:string|null } }){
  const router=useRouter();
  const [form,setForm]=useState({
    name: pet.name, species: pet.species, breed: pet.breed ?? "", sex: pet.sex,
    birthDate: pet.birthDate? toDateInputValue(pet.birthDate): "",
    approxAgeMonths: pet.approxAgeMonths?.toString() ?? "", weightKg: pet.weightKg?.toString() ?? "",
    sterilized: !!pet.sterilized, notes: pet.notes ?? ""
  });
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  async function submit(e:React.FormEvent){
    e.preventDefault(); setError(null); setLoading(true);
    try{
      const body={...form, approxAgeMonths: form.approxAgeMonths? Number(form.approxAgeMonths): undefined, weightKg: form.weightKg? Number(form.weightKg): undefined, birthDate: form.birthDate||undefined };
      const res=await fetch(`/api/v1/pets/${pet.id}`,{method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
      const j=await res.json();
      if(!res.ok || !j.success) { setError(j.error?.message ?? "خطا"); return; }
      router.refresh();
    }catch{ setError("خطای شبکه"); } finally{ setLoading(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <Alert variant="danger">{error}</Alert>}
      <Input label="نام" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><label className="text-sm font-medium">گونه</label><Select value={form.species} onChange={e=>setForm(f=>({...f,species:e.target.value}))}><option value="DOG">سگ</option><option value="CAT">گربه</option></Select></div>
        <div className="space-y-1.5"><label className="text-sm font-medium">جنسیت</label><Select value={form.sex} onChange={e=>setForm(f=>({...f,sex:e.target.value}))}><option value="UNKNOWN">نامشخص</option><option value="MALE">نر</option><option value="FEMALE">ماده</option></Select></div>
      </div>
      <Input label="نژاد" value={form.breed} onChange={e=>setForm(f=>({...f,breed:e.target.value}))} />
      <Input label="تاریخ تولد" type="date" value={form.birthDate} onChange={e=>setForm(f=>({...f,birthDate:e.target.value}))} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="سن تقریبی (ماه)" type="number" value={form.approxAgeMonths} onChange={e=>setForm(f=>({...f,approxAgeMonths:e.target.value}))} />
        <Input label="وزن" type="number" step="0.1" value={form.weightKg} onChange={e=>setForm(f=>({...f,weightKg:e.target.value}))} />
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.sterilized} onChange={e=>setForm(f=>({...f,sterilized:e.target.checked}))}/> عقیم‌شده</label>
      <Textarea label="یادداشت" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
      <Button type="submit" loading={loading}>ذخیره تغییرات</Button>
    </form>
  );
}
