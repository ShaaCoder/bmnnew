/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ikozwzbocdcsazqdjjif.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
