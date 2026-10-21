import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./src/app/questions/**/*"],
    "/api/**/*": ["./src/app/questions/**/*"],
  },
};

// Service worker is only built for production (`next build`). In dev,
// skip wrapping entirely rather than relying on next-pwa's own `disable`
// flag -- that still attaches a webpack() hook to the config, which
// triggers Next's "webpack is configured while Turbopack is not"
// warning on every `next dev --turbopack` even though nothing in that
// hook actually runs. Not wrapping at all avoids the warning outright,
// since `next dev --turbopack` never touches this file's webpack config
// either way. Default runtime caching only matches same-origin Next.js
// assets/pages -- cross-origin Supabase calls (auth, quiz data, admin
// reads) are a different origin entirely and are never intercepted or
// cached by it.
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

export default process.env.NODE_ENV === "production" ? withPWA(nextConfig) : nextConfig;
