import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

/**
 * Revision used for the precached pages. Using the git commit hash means
 * installed clients re-download pages whenever a new version is deployed.
 */
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() || randomUUID();

/**
 * Every route (statically exported). Keep in sync with `src/data/tools.ts`.
 * With `trailingSlash: true` each route is exported as `<route>/index.html`, and the
 * React Server Component payload used for client-side navigation as `<route>/index.txt`.
 */
const APP_ROUTES = [
  "/",
  "/calculators/ohms-law/",
  "/calculators/rc-rlc/",
  "/calculators/op-amp/",
  "/calculators/power-machines/",
  "/tools/resistor-decoder/",
  "/tools/component-decoders/",
  "/tools/digital-logic/",
  "/tools/pinouts/",
  "/tools/lab-plotter/",
  "/~offline/",
];

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Service workers make local development confusing (stale assets), so only enable them in production builds.
  disable: process.env.NODE_ENV === "development",
  // Registered manually (see PwaRegistrar) so it can be skipped inside the native Capacitor app.
  register: false,
  // Precache icons and the manifest; install-dialog screenshots are fetched on demand only.
  globPublicPatterns: ["icons/**/*", "manifest.json"],
  // Every route is precached at install time, so per-navigation caching is unnecessary.
  cacheOnNavigation: false,
  reloadOnOnline: false,
  additionalPrecacheEntries: APP_ROUTES.flatMap((route) => [
    { url: route, revision },
    { url: `${route}index.txt`, revision },
  ]),
});

const nextConfig: NextConfig = {
  // Fully static bundle in `out/`: deployable to any static host and loadable from the
  // device filesystem by Capacitor (webDir: "out"), so the Android app runs 100% offline.
  output: "export",
  // Emit `route/index.html` so static hosts and the Capacitor WebView resolve clean URLs.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default withSerwist(nextConfig);
