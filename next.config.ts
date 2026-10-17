import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Quote requests can carry an artwork file (validated to 8 MB server-side).
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
