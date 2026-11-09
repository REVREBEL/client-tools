import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@revrebel/ui", "@revrebel/tokens"],
};

export default nextConfig;
