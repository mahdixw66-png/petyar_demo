import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PREFIXES = ["/dashboard", "/api/v1/pets", "/api/v1/requests", "/api/v1/policies", "/api/v1/search", "/api/v1/files", "/api/v1/pricing"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  // صفحه‌ی لاگین/ثبت‌نام اگر نشست دارد به داشبورد هدایت شود (اختیاری)
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("session")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "ابتدا وارد شوید." } }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "نشست نامعتبر است." } }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", encodeURIComponent("نشست شما منقضی شده است. دوباره وارد شوید."));
    const res = NextResponse.redirect(url);
    res.cookies.delete("session");
    return res;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/v1/:path*"],
};
