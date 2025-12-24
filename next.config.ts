import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configuración para trabajar con subdominios locales
  async rewrites() {
    return [];
  },
};

export default nextConfig;
