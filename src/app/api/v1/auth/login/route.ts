import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { loginSchema } from "@/lib/validators";
import { findUserByIdentifier, verifyUserPassword, incrementFailedLogin, resetFailedLogin } from "@/server/services/user-service";
import { createSessionToken, setSessionCookie } from "@/server/auth";
import { checkRateLimit, rateLimitKey } from "@/server/rate-limit";
import { config } from "@/lib/config";
import { AppError } from "@/lib/domain/errors";
import { audit } from "@/server/audit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
    // ابتدا body را بخوان تا بتوانیم کلید را per-identifier بسازیم (جلوگیری از مسدود شدن همه کاربران از یک IP)
    const rawBody = await req.json();
    const parsedForRateLimit = loginSchema.safeParse(rawBody);
    const identifierForLimit = parsedForRateLimit.success ? parsedForRateLimit.data.identifier.slice(0, 40).toLowerCase() : "unknown";
    const rl = checkRateLimit(rateLimitKey(ip, "login", identifierForLimit), config.rateLimitLoginPerMinute, 60_000);
    if (!rl.allowed) return jsonError(AppError.rateLimited());

    const body = rawBody;
    const { identifier, password } = loginSchema.parse(body);

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      await audit({ action: "LOGIN_FAILED", entityType: "User", result: "DENIED", summary: `ورود ناموفق برای ${identifier} — کاربر یافت نشد.`, ip });
      throw AppError.unauthenticated("ایمیل/موبایل یا رمز عبور نادرست است.");
    }
    if (user.status !== "ACTIVE") throw AppError.unauthenticated("حساب شما فعال نیست.");
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw AppError.rateLimited("حساب به‌دلیل تلاش‌های ناموفق موقتاً قفل شده است. چند دقیقه بعد دوباره تلاش کنید.");
    }

    const ok = await verifyUserPassword(user, password);
    if (!ok) {
      await incrementFailedLogin(user.id);
      await audit({ action: "LOGIN_FAILED", entityType: "User", entityId: user.id, result: "DENIED", summary: "رمز نادرست.", ip });
      throw AppError.unauthenticated("ایمیل/موبایل یا رمز عبور نادرست است.");
    }

    await resetFailedLogin(user.id);
    const token = await createSessionToken({
      sub: user.id,
      role: user.role,
      tv: user.tokenVersion,
      clinicId: user.clinicId ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    });
    await setSessionCookie(token);
    await audit({ actor: { sub: user.id, role: user.role, tv: user.tokenVersion, clinicId: user.clinicId ?? null, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone }, action: "LOGIN_SUCCESS", entityType: "User", entityId: user.id, result: "SUCCESS", summary: "ورود موفق.", ip });
    return jsonSuccess({ id: user.id, role: user.role });
  } catch (e) {
    return jsonError(e);
  }
}
