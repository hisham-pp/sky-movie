/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  serverExternalPackages: ['better-sqlite3', 'webtorrent'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
