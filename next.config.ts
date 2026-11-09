import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";
/** Caminho do site: oficial em /evolution-lab-next, cópia de teste em /lovelace-teste. */
const basePath = process.env.PAGES_BASE_PATH ?? (isPages ? "/evolution-lab-next" : "");

const nextConfig: NextConfig = {
  webpack(config){config.resolve.modules=[...(config.resolve.modules??[]),process.cwd()+"/.cloud-deps/node_modules"];return config;},
  env:{NEXT_PUBLIC_GITHUB_PAGES:isPages?'true':'false',NEXT_PUBLIC_BASE_PATH:basePath,NEXT_PUBLIC_TEST_NAMESPACE:process.env.TEST_NAMESPACE??''},
  ...(isPages
    ? {
        output: "export" as const,
        ...(basePath ? { basePath, assetPrefix: basePath + "/" } : {}),
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
