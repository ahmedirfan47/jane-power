import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Compile the raw-TS shared package instead of expecting a prebuilt dist.
  transpilePackages: ["@jane-power/shared"],
};

export default nextConfig;