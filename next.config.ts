import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
