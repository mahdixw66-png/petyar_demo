/**
 * ذخیره‌سازی خصوصی فایل‌ها.
 * درایور local: فایل‌ها زیر STORAGE_DIR ذخیره و فقط از طریق API احرازشده قابل دسترسی‌اند.
 * هیچ URL عمومی دائمی تولید نمی‌شود.
 */

import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile, readFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { config } from "@/lib/config";
import { AppError } from "@/lib/domain/errors";

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp", "heic", "heif"]);

export function validateFileMeta(originalName: string, mimeType: string, sizeBytes: number): void {
  if (sizeBytes > config.maxUploadBytes) {
    throw AppError.validation(`حجم فایل بیش از حد مجاز است (حداکثر ${Math.round(config.maxUploadBytes / 1024 / 1024)} مگابایت).`);
  }
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw AppError.validation(`پسوند فایل مجاز نیست. پسوندهای مجاز: ${[...ALLOWED_EXTENSIONS].join("، ")}`);
  }
  // بعضی مرورگرها mime را اشتباه می‌فرستند؛ فقط انواع کاملاً نامعتبر را رد می‌کنیم
  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType) && !mimeType.startsWith("image/")) {
    throw AppError.validation(`نوع فایل مجاز نیست: ${mimeType}`);
  }
}

export function generateStorageKey(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
  const rand = randomBytes(16).toString("hex");
  const date = new Date().toISOString().slice(0, 10);
  return `${date}/${rand}.${ext}`;
}

export function storageAbsolutePath(storageKey: string): string {
  const base = path.resolve(config.storageDir);
  const full = path.resolve(base, storageKey);
  if (!full.startsWith(base + path.sep) && full !== base) {
    throw AppError.validation("کلید ذخیره‌سازی نامعتبر است.");
  }
  return full;
}

export async function saveFile(storageKey: string, buffer: Buffer): Promise<{ sizeBytes: number; checksum: string }> {
  const full = storageAbsolutePath(storageKey);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);
  const checksum = createHash("sha256").update(buffer).digest("hex");
  return { sizeBytes: buffer.length, checksum };
}

export async function readPrivateFile(storageKey: string): Promise<Buffer> {
  const full = storageAbsolutePath(storageKey);
  try {
    return await readFile(full);
  } catch {
    throw AppError.notFound("فایل درخواستی یافت نشد.");
  }
}

export async function fileExists(storageKey: string): Promise<boolean> {
  try {
    await stat(storageAbsolutePath(storageKey));
    return true;
  } catch {
    return false;
  }
}

export async function deletePrivateFile(storageKey: string): Promise<void> {
  try {
    await unlink(storageAbsolutePath(storageKey));
  } catch {
    // نادیده بگیر
  }
}
