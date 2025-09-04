/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/export': ['node_modules/ffmpeg-static/ffmpeg'],
    },
  },
};

module.exports = nextConfig;
