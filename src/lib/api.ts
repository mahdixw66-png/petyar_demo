import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, toAppError } from "@/lib/domain/errors";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiErrorBody = { success: false; error: { code: string; message: string; details?: unknown } };

export function jsonSuccess<T>(data: T, init?: number | ResponseInit): NextResponse<ApiSuccess<T>> {
  const status = typeof init === "number" ? init : (init as ResponseInit)?.status ?? 200;
  const rest = typeof init === "number" ? {} : (init as ResponseInit);
  return NextResponse.json({ success: true, data } as ApiSuccess<T>, { ...rest, status });
}

export function jsonError(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues[0]?.message ?? "داده‌های ارسالی معتبر نیست.",
          details: error.flatten(),
        },
      },
      { status: 422 },
    );
  }
  const appErr = toAppError(error);
  const body: ApiErrorBody = {
    success: false,
    error: { code: appErr.code, message: appErr.userMessage, details: appErr.details ?? undefined },
  };
  // لاگ فقط برای خطاهای سرور
  if (appErr.code === "INTERNAL_ERROR") {
    console.error("[api] internal error", appErr.cause ?? appErr);
  }
  return NextResponse.json(body, { status: appErr.httpStatus });
}

export function parseJson<T>(req: NextRequest): Promise<T> {
  return req.json() as Promise<T>;
}

export function getPagination(req: NextRequest): { page: number; pageSize: number } {
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("pageSize") ?? 12)));
  return { page, pageSize };
}
