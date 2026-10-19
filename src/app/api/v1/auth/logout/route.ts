import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/server/auth";

export async function POST(req: NextRequest) {
  await clearSessionCookie();
  const accept = req.headers.get("accept") ?? "";
  // اگر درخواست از فرم HTML است، به صفحه اصلی هدایت کن
  if (accept.includes("text/html") || req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  // در غیر این صورت JSON
  const res = NextResponse.json({ success: true, data: { ok: true } });
  // حذف کوکی در پاسخ JSON هم
  res.cookies.delete("session");
  return res;
}

export async function GET(req: NextRequest) {
  return POST(req);
}
