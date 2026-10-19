/**
 * پیکربندی متمرکز — همهٔ متغیرهای محیطی از این ماژول خوانده می‌شوند.
 * هر دسترسی مستقیم به process.env خارج از این فایل، خطای معماری محسوب می‌شود.
 */

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v || v.trim() === "") throw new Error(`متغیر محیطی ${name} تنظیم نشده است.`);
  return v;
}

function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`مقدار ${name} باید عدد باشد.`);
  return Math.trunc(n);
}

export const config = {
  databaseUrl: required("DATABASE_URL"),
  testDatabaseUrl: optional("TEST_DATABASE_URL", required("DATABASE_URL")),
  authSecret: required("AUTH_SECRET"),
  fileSigningSecret: optional("FILE_SIGNING_SECRET", required("AUTH_SECRET")),
  fileLinkTtlSeconds: intEnv("FILE_LINK_TTL_SECONDS", 300),
  sessionTtlSeconds: intEnv("SESSION_TTL_SECONDS", 60 * 60 * 24 * 7),
  nodeEnv: optional("NODE_ENV", "development") as "development" | "test" | "production",
  appUrl: optional("APP_URL", "http://localhost:3000"),
  port: intEnv("PORT", 3000),
  logQueries: optional("LOG_QUERIES", "false") === "true",
  storageDriver: optional("STORAGE_DRIVER", "local") as "local" | "s3",
  storageDir: optional("STORAGE_DIR", "./storage/uploads"),
  maxUploadBytes: intEnv("MAX_UPLOAD_BYTES", 10 * 1024 * 1024),
  seedDemoAccounts: optional("SEED_DEMO_ACCOUNTS", "true") === "true",
  demoPassword: optional("DEMO_PASSWORD", "Demo@12345"),
  isDemoMode: optional("NEXT_PUBLIC_DEMO_MODE", "true") === "true",
  rateLimitLoginPerMinute: intEnv("RATE_LIMIT_LOGIN_PER_MINUTE", 5),
  rateLimitSensitivePerMinute: intEnv("RATE_LIMIT_SENSITIVE_PER_MINUTE", 20),
  s3: {
    endpoint: optional("S3_ENDPOINT", ""),
    bucket: optional("S3_BUCKET", ""),
    accessKeyId: optional("S3_ACCESS_KEY_ID", ""),
    secretAccessKey: optional("S3_SECRET_ACCESS_KEY", ""),
    region: optional("S3_REGION", ""),
  },
} as const;

export const isProduction = config.nodeEnv === "production";
export const isDevelopment = config.nodeEnv === "development";
export const isTest = config.nodeEnv === "test";
