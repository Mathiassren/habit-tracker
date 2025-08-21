// next.config.js
const withPWA = require("next-pwa")({
  dest: "public", // Service worker goes into /public
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // only enable in prod
});

module.exports = withPWA({
  reactStrictMode: true,
});
