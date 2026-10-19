import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // تصاویر در این پروژه محلی (SVG/PNG سبک) هستند و از CDN خارجی استفاده نمی‌شود.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },
  // اندازهٔ بدنه برای مسیرهای API محدود است؛ آپلود فایل از طریق multipart انجام می‌شود.
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
