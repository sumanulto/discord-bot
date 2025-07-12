import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com", // YouTube CDN
        port: "",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "i9.ytimg.com", // YouTube alternate CDN
        port: "",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com", // YouTube legacy hostname
        port: "",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "cdn.example.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "your-thumbnail-domain.com",
        port: "",
        pathname: "/**",
      },
    ],
    domains: ['i.ytimg.com', 'i9.ytimg.com', 'img.youtube.com', 'cdn.example.com', 'your-thumbnail-domain.com'],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'bufferutil': 'bufferutil',
        'utf-8-validate': 'utf-8-validate',
        'zlib-sync': 'zlib-sync',
      });
    }

    return config;
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;