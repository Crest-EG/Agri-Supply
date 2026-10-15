import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
    serverActions: { bodySizeLimit: "10mb" },
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision: "offline-shell-v1" }],
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
