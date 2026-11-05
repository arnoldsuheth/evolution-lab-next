import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  env:{NEXT_PUBLIC_GITHUB_PAGES:isPages?'true':'false'},
  ...(isPages
    ? {
        output: "export" as const,
        basePath: "/evolution-lab-next",
        assetPrefix: "/evolution-lab-next/",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;