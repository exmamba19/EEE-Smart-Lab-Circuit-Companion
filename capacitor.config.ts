import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.prachurzo.eeesmartlab",
  appName: "EEE Smart Lab",
  // Output of `next build` with `output: "export"`.
  webDir: "out",
  android: {
    // Keep the WebView content in sync with the app's dark/light surfaces while loading.
    backgroundColor: "#0f172a",
  },
  plugins: {
    SystemBars: {
      // Edge-to-edge: the web app pads itself with env(safe-area-inset-*) (viewport-fit=cover).
      insetsHandling: "native",
      initialViewportFitValueHint: "cover",
    },
  },
};

export default config;
