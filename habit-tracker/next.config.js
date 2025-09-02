// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    runtimeCaching: [
      // Don't cache HTML navigations (critical for auth state)
      {
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkOnly",
      },
      // Static assets can still be cached:
      {
        urlPattern: ({ request }) =>
          ["style", "script", "image", "font"].includes(request.destination),
        handler: "StaleWhileRevalidate",
      },
    ],
  },
});
