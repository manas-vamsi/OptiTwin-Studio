/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // proxy API calls to the FastAPI backend (BACKEND_URL set in docker-compose)
    const backend = process.env.BACKEND_URL ?? "http://localhost:8000";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};
export default nextConfig;
