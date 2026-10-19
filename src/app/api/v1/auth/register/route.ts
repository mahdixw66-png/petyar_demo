import { NextRequest } from "next/server";
import { jsonSuccess, jsonError } from "@/lib/api";
import { registerSchema } from "@/lib/validators";
import { createOwner } from "@/server/services/user-service";
import { createSessionToken, setSessionCookie } from "@/server/auth";
import { checkRateLimit, rateLimitKey } from "@/server/rate-limit";
import { config } from "@/lib/config";
import { audit } from "@/server/audit";
import { normalizeEmail, normalizePhone } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
    const rl = checkRateLimit(rateLimitKey(ip, "register"), config.rateLimitSensitivePerMinute, 60_000);
    if (!rl.allowed) return jsonError(new (await import("@/lib/domain/errors")).AppError("RATE_LIMITED", "تعداد درخواست‌ها بیش از حد مجاز است."));

    const body = await req.json();
    const data = registerSchema.parse(body);

    const email = data.email && data.email.trim() ? normalizeEmail(data.email) : null;
    const phone = data.phone && data.phone.trim() ? normalizePhone(data.phone) : null;

    const user = await createOwner({
      firstName: data.firstName,
      lastName: data.lastName,
      email,
      phone,
      password: data.password,
    });

    // نشست خودکار پس از ثبت‌نام (هدایت به افزودن حیوان)
    const token = await createSessionToken({
      sub: user.id,
      role: user.role,
      tv: 0,
      clinicId: null,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    });
    await setSessionCookie(token);
    await audit({ action: "USER_REGISTER", entityType: "User", entityId: user.id, result: "SUCCESS", summary: `کاربر ${user.id} ثبت‌نام کرد.`, ip });
    return jsonSuccess({ id: user.id }, 201);
  } catch (e) {
    return jsonError(e);
  }
}
