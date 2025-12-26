import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para trabajar con subdominios locales
  // Solo se aplican rewrites si ENABLE_API_REWRITE=true está definido
  async rewrites() {
    // Solo aplicar rewrites si la variable de entorno está habilitada
    if (process.env.ENABLE_API_REWRITE === 'true') {
      return [
        {
          source: "/api/:path*",
          destination: "https://api-condominio-las-flores.vekino.site/api/:path*",
        },
      ];
    }
    // Por defecto (sin variable de entorno), no aplicar rewrites
    return [];
  },
  output: 'standalone',
};

export default nextConfig;
