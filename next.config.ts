import type { NextConfig } from "next";

/**
 * The prototype runs entirely on static data, so it is exported as plain
 * HTML/JS (`out/`). That makes it deployable to any static host (Netlify,
 * Vercel, GitHub Pages, S3) without a Node runtime. Remove `output: "export"`
 * once server features (API routes, middleware, Keycloak callbacks) are needed.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
