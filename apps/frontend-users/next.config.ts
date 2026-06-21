import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @workarmy/ui ships TypeScript source — let Next transpile it.
  transpilePackages: ['@workarmy/ui'],
};

export default nextConfig;
