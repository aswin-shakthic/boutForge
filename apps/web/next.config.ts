import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@boutforge/shared", "@boutforge/api"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
