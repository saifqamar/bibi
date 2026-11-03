import type { NextConfig } from "next";

const config: NextConfig = {
  // The shared API client is TypeScript source in the workspace.
  transpilePackages: ["@bibi/api-client"],
  poweredByHeader: false,
};

export default config;
