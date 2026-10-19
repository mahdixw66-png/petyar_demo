/**
 * هش و تأیید رمز عبور + امضای توکن‌ها
 * از scrypt (Node crypto) استفاده می‌کنیم — بدون وابستگی خارجی، قابل ممیزی،
 * مقاوم در برابر حملهٔ زمان‌ثابت با timingSafeEqual.
 */

import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 8) throw new Error("رمز عبور باید حداقل ۸ کاراکتر باشد.");
  const salt = randomBytes(SALT_BYTES);
  const derived = (await new Promise<Buffer>((resolve, reject) => {
    _scrypt(plain, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 32 * 1024 * 1024 }, (err, key) => {
      if (err) reject(err);
      else resolve(key as Buffer);
    });
  })) as Buffer;
  // قالب: scrypt$N$r$p$saltHex$hashHex
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  if (!nStr || !rStr || !pStr || !saltHex || !hashHex) return false;
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  try {
    const derived = (await new Promise<Buffer>((resolve, reject) => {
      _scrypt(plain, salt, expected.length, { N, r, p, maxmem: 32 * 1024 * 1024 }, (err, key) => {
        if (err) reject(err);
        else resolve(key as Buffer);
      });
    })) as Buffer;
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function generateRandomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  // هش سادهٔ SHA256 برای ذخیرهٔ توکن‌های بازیابی رمز (نه برای رمز عبور)
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}
