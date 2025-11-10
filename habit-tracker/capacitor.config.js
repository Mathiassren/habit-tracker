const config = {
  appId: 'com.rytmo.app',
  appName: 'Rytmo',
  webDir: 'out', // For static export, or '.next' for development
  server: {
    // IMPORTANT: Replace 'https://your-app.vercel.app' with your actual Vercel URL
    // This makes the app load your web app from the server (hybrid approach)
    // For local development: url: 'http://localhost:3000'
    // For production: url: 'https://your-actual-app.vercel.app'
   url: process.env.CAPACITOR_SERVER_URL || 'https://habify1-5lwwsyfgu-mathiassrens-projects.vercel.app/',
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    allowMixedContent: true,
    // Enable deep links for OAuth callbacks
    allowNavigation: [
      'https://habify1-5lwwsyfgu-mathiassrens-projects.vercel.app',
      'https://*.supabase.co',
      'https://accounts.google.com'
    ]
  }
};

module.exports = config;

