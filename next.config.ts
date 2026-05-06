import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb", // candidates can upload PDFs / DOCX up to ~10MB
    },
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
