import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zupobcfxflxbmykehhxj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb', // Sınırı 10 MB'a çıkardık. (İstersen '50mb' yap)
    },
  },
};

export default nextConfig;