import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para trabajar con subdominios locales (solo en desarrollo)
  async rewrites() {
    // Solo aplicar rewrites en desarrollo
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: "/api/:path*",
          destination: "https://api-condominio-las-flores.vekino.site/api/:path*",
        },
      ];
    }
    // En producción, no aplicar rewrites
    return [];
  },
  output: 'standalone',
};

export default nextConfig;
