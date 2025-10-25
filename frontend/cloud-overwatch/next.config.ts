import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false, // true = 308 redirect (SEO permanent), false = 307 temporary
      },
    ];
  },
};

export default nextConfig;
