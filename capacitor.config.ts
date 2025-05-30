import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tradespot.authenticator',
  appName: 'TSauth',
  webDir: 'build',
  server: {
    url: 'https://tradespot.online/authenticator',
    cleartext: true
  }
};

export default config;