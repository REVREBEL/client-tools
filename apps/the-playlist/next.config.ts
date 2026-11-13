import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appDir, "../..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@revrebel/ui", "@revrebel/tokens"],
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
