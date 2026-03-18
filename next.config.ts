import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/exp/index.html",
        destination: "/exp",
      },
    ];
  },
};

export default nextConfig;
