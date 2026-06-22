// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.weather.gov" },
      { protocol: "https", hostname: "mesonet.agron.iastate.edu" },
      { protocol: "https", hostname: "unpkg.com" },
    ],
  },
};

module.exports = nextConfig;
