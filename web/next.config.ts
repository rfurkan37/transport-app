import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname || process.cwd()),
  },
  experimental: {
    disableBaselineBrowserMappingWarning: true,
  },
};

export default nextConfig;
