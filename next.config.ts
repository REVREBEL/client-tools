import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // If your Webflow Cloud app is mounted to a subpath (e.g., /app)
  basePath: "/portal",
  assetPrefix: "/portal",
  reactStrictMode: true,
};

export default nextConfig;
