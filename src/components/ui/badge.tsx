import * as React from "react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/constants";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  info: "bg-sky-50 text-sky-800 border-sky-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-800 border-red-200",
  accent: "bg-violet-50 text-violet-800 border-violet-200",
};

export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: StatusTone }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", toneClasses[tone], className)} {...props} />;
}

export function IllustrativeBadge({ className }: { className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 text-xs font-semibold", className)}>نمونهٔ آموزشی — پیشنهاد بیمه‌ای نیست</span>;
}
