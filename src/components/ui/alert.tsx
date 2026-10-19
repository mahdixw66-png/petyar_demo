import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "info" | "warning" | "success" | "danger";

const styles: Record<Variant, string> = {
  info: "bg-sky-50 border-sky-200 text-sky-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  danger: "bg-red-50 border-red-200 text-red-900",
};

export function Alert({ variant = "info", className, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  return <div role="alert" className={cn("rounded-xl border p-4 text-sm leading-6", styles[variant], className)} {...props} />;
}
