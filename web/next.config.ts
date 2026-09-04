import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/dhasboard',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/dashbaord',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/dashbord',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
