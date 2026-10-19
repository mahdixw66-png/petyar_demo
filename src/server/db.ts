import { PrismaClient } from "@prisma/client";
import { config } from "@/lib/config";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  return new PrismaClient({
    log: config.logQueries ? ["query", "warn", "error"] : ["warn", "error"],
  });
}

// در توسعه، از global برای جلوگیری از اتصال‌های متعدد در HMR استفاده می‌کنیم
export const prisma: PrismaClient = globalThis.__prisma ?? createClient();

if (config.nodeEnv !== "production") {
  globalThis.__prisma = prisma;
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

// Helper برای تراکنش با تایپ درست
export { Prisma } from "@prisma/client";
