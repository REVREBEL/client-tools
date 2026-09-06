import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // If your Webflow Cloud app is mounted to a subpath (e.g., /app)
  basePath: "/portal",
  assetPrefix: "/portal",
};

export default nextConfig;
