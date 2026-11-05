import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  webpack(config){config.resolve.modules=[...(config.resolve.modules??[]),process.cwd()+"/.cloud-deps/node_modules"];return config;},
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