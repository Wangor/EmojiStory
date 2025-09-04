/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      'app/api/export/route.ts': ['./node_modules/ffmpeg-static/ffmpeg']
    }
  }
};

module.exports = nextConfig;
