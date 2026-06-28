import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/plan", destination: "/plans", permanent: true },
      { source: "/pricing", destination: "/plans", permanent: true },
      { source: "/plans.html", destination: "/plans", permanent: true },
      { source: "/features", destination: "/#features", permanent: true },
      { source: "/roles", destination: "/#roles", permanent: true },
      { source: "/setup", destination: "/#setup", permanent: true },
      { source: "/demo", destination: "/#demo", permanent: true },
    ];
  },
};

export default nextConfig;
