import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb', // Sınırı 10 MB'a çıkardık. (İstersen '50mb' yap)
    },
  },
};

export default nextConfig;