import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Le défaut (1 Mo) est trop juste pour un import CSV d'un portefeuille de plusieurs
    // centaines/milliers de contacts.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
