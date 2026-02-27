import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:5000"}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
