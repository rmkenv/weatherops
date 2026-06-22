import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.weather.gov" },
      { protocol: "https", hostname: "mesonet.agron.iastate.edu" },
      { protocol: "https", hostname: "unpkg.com" },
    ],
  },
};

export default nextConfig;
