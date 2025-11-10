import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rytmo.app',
  appName: 'Rytmo',
  webDir: '.next',
  server: {
    // Replace with your Vercel deployment URL
    // For local development, use: url: 'http://localhost:3000'
    // For production, use your Vercel URL: url: 'https://your-app.vercel.app'
    url: process.env.CAPACITOR_SERVER_URL || 'https://habify1-5lwwsyfgu-mathiassrens-projects.vercel.app/',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  }
};

export default config;




