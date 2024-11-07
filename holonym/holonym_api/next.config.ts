import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Aquí puedes incluir otras opciones de configuración si las tienes

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Evita errores al importar módulos de Node.js en el cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    return config;
  },
};

export default nextConfig;
