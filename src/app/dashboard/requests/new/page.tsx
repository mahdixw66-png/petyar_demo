import { getCurrentSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { NewRequestForm } from "./new-request-form";

export const dynamic="force-dynamic";

export default async function NewRequestPage(){
  const session=await getCurrentSession();
  if(!session) redirect("/login");
  if(session.role!=="CLINIC") redirect("/dashboard");
  const serviceGroups=await prisma.serviceGroup.findMany({where:{isActive:true}, orderBy:{sortOrder:"asc"}});
  const pets=await prisma.pet.findMany({where:{deletedAt:null}, take:100, include:{owner:{select:{firstName:true,lastName:true,phone:true,email:true}}, policies:{where:{deletedAt:null, status:"ACTIVE"}, include:{plan:true}}}});
  // clinic pets? we show all for now, validation will catch mismatch
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-4">ثبت صورتحساب / درخواست درمان</h1>
      <p className="text-sm text-slate-500 mb-4">ابتدا حیوان و بیمه‌نامه را تطبیق دهید (بیمه‌نامه باید در تاریخ مراجعه معتبر باشد). جمع ردیف‌ها به‌صورت خودکار محاسبه می‌شود.</p>
      <NewRequestForm serviceGroups={serviceGroups} pets={pets} />
    </div>
  );
}
