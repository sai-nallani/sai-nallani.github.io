import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // enable fully static export (no Node.js server needed)
};

export default nextConfig;
