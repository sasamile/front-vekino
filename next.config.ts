import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El proxy ahora se maneja mediante API routes en app/api/[...path]/route.ts
  // y app/superadmin/[...path]/route.ts
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vekino.s3.us-east-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
