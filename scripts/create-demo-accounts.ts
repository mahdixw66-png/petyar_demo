/**
 * اسکریپت کمکی برای ایجاد/به‌روزرسانی حساب‌های دمو به‌صورت جداگانه
 * استفاده: npx tsx scripts/create-demo-accounts.ts
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/server/crypto";

const prisma = new PrismaClient();
async function main(){
  const pw = process.env.DEMO_PASSWORD ?? "Demo@12345";
  const hash = await hashPassword(pw);
  const users = [
    { email:"owner@demo.local", firstName:"علی", lastName:"دمو", role:"OWNER" as const },
    { email:"clinic@demo.local", firstName:"کاربر", lastName:"کلینیک", role:"CLINIC" as const },
    { email:"reviewer@demo.local", firstName:"کارشناس", lastName:"بیمه", role:"REVIEWER" as const },
    { email:"admin@demo.local", firstName:"مدیر", lastName:"سامانه", role:"ADMIN" as const },
  ];
  for(const u of users){
    const existing = await prisma.user.findUnique({where:{email:u.email}});
    if(!existing) await prisma.user.create({data:{email:u.email, firstName:u.firstName, lastName:u.lastName, passwordHash: hash, role:u.role as never, isDemo:true}});
    else await prisma.user.update({where:{id:existing.id}, data:{passwordHash:hash}});
    console.log(`✓ ${u.email}`);
  }
  console.log("Done");
}
main().finally(()=>prisma.$disconnect());
