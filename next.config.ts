import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides the floating "N" dev-mode indicator badge. It's meant to only
  // appear in development, but this is a safety net in case the server
  // ever gets started the wrong way (e.g. "next dev" instead of
  // "next start") in a hosting environment.
  devIndicators: false,
};

export default nextConfig;
