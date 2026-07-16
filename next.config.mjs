/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./src/app/questions/**/*"],
    "/api/**/*": ["./src/app/questions/**/*"],
  },
};

export default nextConfig;
