import type { NextConfig } from "next";
import os from "os";

// Detect all local IPv4 network interface addresses so phones/tablets in the arena can access Next.js dev server
const getNetworkDevOrigins = (): string[] => {
  const origins = new Set<string>([
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "localhost:3000",
    "127.0.0.1:3000",
  ]);
  try {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      if (iface) {
        for (const alias of iface) {
          if (alias.family === "IPv4") {
            origins.add(alias.address);
            origins.add(`${alias.address}:3000`);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error gathering network dev origins:", err);
  }
  return Array.from(origins);
};

const nextConfig: NextConfig = {
  allowedDevOrigins: getNetworkDevOrigins(),
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
