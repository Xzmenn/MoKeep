import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.finkaya.app",
  appName: "FinKaya",
  webDir: "public",
  server: {
    url: "http://192.168.1.19:3000",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
