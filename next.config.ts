import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configuración para trabajar con subdominios locales
  async rewrites() {
    return [];
  },
  // Habilitar modo standalone para Docker
  output: 'standalone',
  // Desactivar Turbopack para builds más estables en EC2
  experimental: {
    turbo: false,
  },
  // Optimizaciones para producción
  swcMinify: true,
  compress: true,
};

export default nextConfig;
