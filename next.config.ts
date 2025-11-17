import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Opt-out these dependencies from Server Components bundling
  // This allows native Node.js require for ESM packages with native modules
  serverExternalPackages: [
    '@helia/http',
    '@helia/verified-fetch',
    'helia',
    'datastore-fs',
    'blockstore-fs',
  ],
};

export default nextConfig;
