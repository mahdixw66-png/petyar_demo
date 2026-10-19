/**
 * احراز هویت مبتنی بر JWT در کوکی HttpOnly.
 * از `jose` (HS256) استفاده می‌کنیم؛ secret از متغیر محیطی.
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { config } from "@/lib/config";
import { prisma } from "@/server/db";
import { AppError } from "@/lib/domain/errors";
import type { Role } from "@prisma/client";

const COOKIE_NAME = "session";

export type SessionPayload = {
  sub: string; // user id
  role: Role;
  tv: number; // tokenVersion — برای ابطال همهٔ نشست‌ها
  clinicId?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
};

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(config.authSecret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({ ...payload } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${config.sessionTtlSeconds}s`)
    .setSubject(payload.sub)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload> {
  const secret = getSecretKey();
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  // اعتبارسنجی حداقلی
  if (typeof payload.sub !== "string" || typeof payload.role !== "string") {
    throw new Error("Invalid session payload");
  }
  return {
    sub: payload.sub as string,
    role: payload.role as Role,
    tv: Number(payload.tv ?? 0),
    clinicId: (payload.clinicId as string | null) ?? null,
    firstName: String(payload.firstName ?? ""),
    lastName: String(payload.lastName ?? ""),
    email: (payload.email as string | null) ?? null,
    phone: (payload.phone as string | null) ?? null,
  };
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: config.sessionTtlSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = await verifySessionToken(token);
    // بررسی tokenVersion (ابطال نشست)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { tokenVersion: true, status: true },
    });
    if (!user || user.status !== "ACTIVE") return null;
    if (user.tokenVersion !== payload.tv) return null;
    return payload;
  } catch {
    return null;
  }
}

// نسخهٔ cacheشده برای استفاده در Server Components (هر درخواست یک بار)
export const getCurrentSession = cache(async (): Promise<SessionPayload | null> => {
  return getSessionFromCookie();
});

export async function requireSession(): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) throw AppError.unauthenticated();
  return session;
}

export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) throw AppError.forbidden("شما مجوز دسترسی به این بخش را ندارید.");
  return session;
}

export function getClientIp(): string | null {
  try {
    const h = headers();
    // در Next.js 15 headers() هم promise است، ولی در برخی contexts sync است
    // برای سازگاری هر دو را پوشش می‌دهیم
    const headerList = h as unknown as { get: (k: string) => string | null } | Promise<{ get: (k: string) => string | null }>;
    if (headerList instanceof Promise) return null;
    return (
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerList.get("x-real-ip") ??
      null
    );
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request: Request): Promise<SessionPayload | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = /(?:^|;\s*)session=([^;]+)/.exec(cookieHeader);
  const token = match?.[1];
  if (!token) return null;
  try {
    const payload = await verifySessionToken(decodeURIComponent(token));
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { tokenVersion: true, status: true },
    });
    if (!user || user.status !== "ACTIVE") return null;
    if (user.tokenVersion !== payload.tv) return null;
    return payload;
  } catch {
    return null;
  }
}
