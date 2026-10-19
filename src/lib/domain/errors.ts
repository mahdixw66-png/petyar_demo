/**
 * خطاهای حوزهٔ برنامه.
 *
 * قاعده: هیچ stack trace یا پیام فنی به کاربر نمایش داده نمی‌شود؛
 * لایهٔ API این خطاها را به پاسخ JSON فارسی با `code` پایدار تبدیل می‌کند
 * و جزئیات فنی فقط در لاگ سرور ثبت می‌شود.
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_STATE_TRANSITION"
  | "INVARIANT_VIOLATION"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "INTERNAL_ERROR";

const HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INVALID_STATE_TRANSITION: 409,
  INVARIANT_VIOLATION: 422,
  RATE_LIMITED: 429,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly details?: unknown;
  /** پیام فارسیِ مناسب نمایش به کاربر */
  readonly userMessage: string;

  constructor(
    code: ErrorCode,
    userMessage: string,
    options?: { details?: unknown; cause?: unknown },
  ) {
    super(userMessage, options?.cause ? { cause: options.cause } : undefined);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = HTTP_STATUS[code];
    this.userMessage = userMessage;
    this.details = options?.details;
  }

  static validation(userMessage = "داده‌های ارسالی معتبر نیست.", details?: unknown) {
    return new AppError("VALIDATION_ERROR", userMessage, { details });
  }

  static unauthenticated(userMessage = "ابتدا وارد حساب خود شوید.") {
    return new AppError("UNAUTHENTICATED", userMessage);
  }

  static forbidden(userMessage = "شما مجوز انجام این عملیات را ندارید.") {
    return new AppError("FORBIDDEN", userMessage);
  }

  static notFound(userMessage = "مورد درخواستی یافت نشد.") {
    return new AppError("NOT_FOUND", userMessage);
  }

  static conflict(userMessage: string, details?: unknown) {
    return new AppError("CONFLICT", userMessage, { details });
  }

  static badState(userMessage: string, details?: unknown) {
    return new AppError("INVALID_STATE_TRANSITION", userMessage, { details });
  }

  static invariant(userMessage: string, details?: unknown) {
    return new AppError("INVARIANT_VIOLATION", userMessage, { details });
  }

  static rateLimited(userMessage = "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.") {
    return new AppError("RATE_LIMITED", userMessage);
  }
}

export function httpStatusFor(code: ErrorCode): number {
  return HTTP_STATUS[code] ?? 500;
}

/** تبدیل هر خطای ناشناخته به AppError — هرگز جزئیات داخلی به کلاینت درز نمی‌کند */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError("INTERNAL_ERROR", "خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.", {
    cause: error,
  });
}

/** آیا این خطا ارزش ثبت در لاگ با جزئیات کامل را دارد؟ */
export function isServerFault(error: AppError): boolean {
  return error.code === "INTERNAL_ERROR";
}
