import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatJalali } from "@/lib/jalali";
import { EditPetForm } from "./edit-form";

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }){
  const { id } = await params;
  const session = await getCurrentSession();
  if(!session) redirect("/login");
  const pet = await prisma.pet.findFirst({ where:{ id, ownerId: session.sub, deletedAt:null }, include:{ policies:{ include:{plan:true, planVersion:true}}, owner:true}});
  if(!pet) return notFound();
  const policies = pet.policies;
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold">پروفایل {pet.name}</h1>
      <Card><CardHeader><CardTitle>اطلاعات</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
        <div>گونه: {pet.species==="DOG"?"سگ":"گربه"} — جنسیت: {pet.sex}</div>
        <div>نژاد: {pet.breed ?? "—"}</div>
        <div>تاریخ تولد: {formatJalali(pet.birthDate)} — سن تقریبی: {pet.approxAgeMonths ?? "—"} ماه</div>
        <div>وزن: {pet.weightKg ?? "—"} کیلوگرم — عقیم‌شده: {pet.sterilized? "بله": pet.sterilized===false? "خیر":"نامشخص"}</div>
        <div>شناسه عمومی: <span dir="ltr">{pet.publicId}</span></div>
        {pet.microchipCode && <div>میکروچیپ: {pet.microchipCode}</div>}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>بیمه‌نامه‌ها</CardTitle></CardHeader><CardContent>
        {policies.length===0? <p className="text-sm text-slate-500">بیمه‌نامه‌ای ثبت نشده. در نسخهٔ دمو، بیمه‌نامه‌ها از seed ایجاد شده‌اند.</p> :
        <ul className="space-y-2">{policies.map(po=> <li key={po.id} className="rounded-xl border p-3 text-sm flex justify-between"><span>{po.plan.name} — {po.publicId}</span><Badge tone={po.status==="ACTIVE"?"success":"neutral"}>{po.status}</Badge><span>{formatJalali(po.startDate)} تا {formatJalali(po.endDate)}</span></li>)}</ul>}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>ویرایش</CardTitle></CardHeader><CardContent><EditPetForm pet={{ id: pet.id, name: pet.name, species: pet.species, breed: pet.breed, sex: pet.sex, birthDate: pet.birthDate ? pet.birthDate.toISOString() : null, approxAgeMonths: pet.approxAgeMonths, weightKg: pet.weightKg, sterilized: pet.sterilized, notes: pet.notes }} /></CardContent></Card>
    </div>
  );
}
