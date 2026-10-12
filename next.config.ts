import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only route badge: every corner covers mobile navigation (tab bar or header
  // actions). Build/runtime errors still show up as an overlay without it.
  devIndicators: false,
  experimental: {
    serverActions: {
      // CV/portfolio uploads go through server actions and are capped at 5MB in
      // uploadFileAction; the 1MB default rejected them before that check ran.
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
