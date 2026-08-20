const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // There's a stray package-lock.json in the home dir; pin the root so Next
  // doesn't walk up and pick it instead of this project.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    // Next 16 requires every quality used by next/image to be declared here.
    qualities: [75, 82],
  },
};

module.exports = nextConfig;
