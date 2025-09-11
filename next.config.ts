import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },      // ignora ESLint en build
  typescript: { ignoreBuildErrors: true },   // (opcional) ignora errores TS en build
  /* agrega aquí cualquier otra opción que tuvieras si aplica */
};

export default nextConfig;
