const config = {
  appId: 'com.habify.app',
  appName: 'Habify',
  webDir: 'out', // For static export, or '.next' for development
  server: {
    // IMPORTANT: Replace 'https://your-app.vercel.app' with your actual Vercel URL
    // This makes the app load your web app from the server (hybrid approach)
    // For local development: url: 'http://localhost:3000'
    // For production: url: 'https://your-actual-app.vercel.app'
    url: process.env.CAPACITOR_SERVER_URL || 'https://habit-tracker-eight-omega.vercel.app/',
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    allowMixedContent: true
  }
};

module.exports = config;

