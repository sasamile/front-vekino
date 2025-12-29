import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El proxy ahora se maneja mediante API routes en app/api/[...path]/route.ts
  // y app/superadmin/[...path]/route.ts
  output: 'standalone',
};

export default nextConfig;
