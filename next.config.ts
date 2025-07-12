import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
        port: "",
        pathname: "/vi/**",
      },
    ],
    
    domains: ['i.ytimg.com', 'cdn.example.com', 'your-thumbnail-domain.com'],
  },
};

export default nextConfig;
