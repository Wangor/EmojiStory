/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/export': ['./node_modules/ffmpeg-static/**'],
    },
  },
};

module.exports = nextConfig;
