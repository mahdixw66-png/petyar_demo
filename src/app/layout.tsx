import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: { default: "پت‌یار — بیمه دامپزشکی سگ و گربه", template: "%s | پت‌یار" },
  description: "پلتفرم بیمهٔ دامپزشکی سگ و گربه — مدیریت حیوانات، بیمه‌نامه، کلینیک‌ها و تسویهٔ شبیه‌سازی‌شده. نسخهٔ دمو.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-dvh flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
