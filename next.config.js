/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow existing static HTML files to be served
  // API routes live in /pages/api
  reactStrictMode: true,
  // Increase API timeout for AI calls
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
  },
};

module.exports = nextConfig;
