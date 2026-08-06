import type { NextConfig } from "next";
import path from "path";

const missingSupabaseEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
].filter((key) => !process.env[key]?.trim());

if (missingSupabaseEnv.length > 0) {
  console.warn(
    `[boutforge] Missing env: ${missingSupabaseEnv.join(", ")}. ` +
      "Auth will not work until these are set in Vercel → Settings → Environment Variables."
  );
}

const nextConfig: NextConfig = {
  transpilePackages: ["@boutforge/shared", "@boutforge/api"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
