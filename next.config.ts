import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /** `public/images/**` — omit `search` so `?v=` cache-bust (see `ledStaticImage`) works. */
    localPatterns: [{ pathname: "/images/**" }],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "clear-api.q.antigravity.dev",
      },
    ],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
