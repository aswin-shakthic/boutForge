import type { NextConfig } from "next";
import path from "path";

const missingSupabaseEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
].filter((key) => !process.env[key]?.trim());

if (missingSupabaseEnv.length > 0) {
  console.warn(
    `[boutforge] Missing env: ${missingSupabaseEnv.join(", ")}. ` +
      "Set them in Vercel → Settings → Environment Variables."
  );
}

if (process.env.VERCEL_ENV === "production") {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (
    appUrl &&
    (appUrl.includes("localhost") || appUrl.includes("127.0.0.1"))
  ) {
    console.warn(
      "[boutforge] NEXT_PUBLIC_APP_URL is set to localhost in production. " +
        "Remove it or set it to your Vercel domain (e.g. https://bout-forge-web-owh5.vercel.app). " +
        "Also update Supabase → Authentication → Site URL to the same production domain."
    );
  }
}

const nextConfig: NextConfig = {
  transpilePackages: ["@boutforge/shared", "@boutforge/api"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  experimental: {
    optimizePackageImports: ["lucide-react", "@boutforge/shared", "@boutforge/api"],
  },
};

export default nextConfig;
