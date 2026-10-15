import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/best", destination: "/hall-of-fame", permanent: false },
      { source: "/create", destination: "/post", permanent: false },
    ];
  },
};

export default nextConfig;
