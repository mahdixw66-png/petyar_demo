import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { getSessionFromRequest } from "@/server/auth";
import { prisma } from "@/server/db";
import { pricingRunSchema } from "@/lib/validators";
import { calculateGrossPremium } from "@/lib/domain/pricing";
import { AppError } from "@/lib/domain/errors";

export async function GET(req: NextRequest){
  try{
    const session=await getSessionFromRequest(req);
    if(!session || !["REVIEWER","ADMIN"].includes(session.role)) throw AppError.forbidden();
    const runs=await prisma.pricingRun.findMany({orderBy:{createdAt:"desc"}, take:30});
    return jsonSuccess(runs);
  } catch(e){ return jsonError(e); }
}

export async function POST(req: NextRequest){
  try{
    const session=await getSessionFromRequest(req);
    if(!session || !["REVIEWER","ADMIN"].includes(session.role)) throw AppError.forbidden();
    const body=await req.json();
    const data=pricingRunSchema.parse(body);
    const outputs=calculateGrossPremium({L:data.L, F:data.F, R:data.R, C:data.C, Vbps:data.Vbps, Qbps:data.Qbps});
    const run=await prisma.pricingRun.create({
      data:{
        name: data.name,
        species: data.species,
        inputs: {L:data.L, F:data.F, R:data.R, C:data.C, Vbps:data.Vbps, Qbps:data.Qbps} as never,
        outputs: outputs as never,
        notes: data.notes || null,
        createdById: session.sub,
      }
    });
    return jsonSuccess(run,201);
  } catch(e){ return jsonError(e); }
}
