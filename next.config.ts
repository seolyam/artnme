import type { NextConfig } from "next";

// Low-risk hardening only (no CSP, so it can't break login or the 3D Studio).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    // Order proofs and quote attachments are served from Cloudinary.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // The staff video guide is read from disk and served to signed-in staff only.
  outputFileTracingIncludes: {
    "/api/staff-guide/[file]": ["./private/videos/**"],
  },
  experimental: {
    // Quote requests and order proofs carry a file (validated to 8–9 MB server-side).
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
