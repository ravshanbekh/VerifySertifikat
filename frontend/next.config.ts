import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep the server origin intact for internal, host-based Career rewrites.
  skipProxyUrlNormalize: true,
  async rewrites() {
    const backend = process.env.CAREER_BACKEND_URL || "http://127.0.0.1:4000";
    return [
      {
        source: "/api/career/:path*",
        destination: `${backend}/api/career/:path*`,
      },
      {
        source: "/uploads/career-avatars/:path*",
        destination: `${backend}/uploads/career-avatars/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "verify.itlive.uz" },
    ],
  },
};

export default nextConfig;
