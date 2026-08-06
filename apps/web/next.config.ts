import type { NextConfig } from "next";
import path from "path";

if (process.env.VERCEL === "1") {
  const missing = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing Vercel environment variables: ${missing.join(", ")}. ` +
        "Add them under Project Settings → Environment Variables, then redeploy."
    );
  }
}

const nextConfig: NextConfig = {
  transpilePackages: ["@boutforge/shared", "@boutforge/api"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
