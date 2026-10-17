import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Order proofs and quote attachments are served from Cloudinary.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  experimental: {
    // Quote requests and order proofs carry a file (validated to 8–9 MB server-side).
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
