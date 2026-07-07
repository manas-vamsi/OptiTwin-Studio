/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // proxy API calls to the FastAPI backend during dev
    return [{ source: "/api/:path*", destination: "http://localhost:8000/api/:path*" }];
  },
};
export default nextConfig;
