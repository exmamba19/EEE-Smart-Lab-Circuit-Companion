import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

/**
 * Revision used for the precached HTML pages. Using the git commit hash means
 * installed clients re-download pages whenever a new version is deployed.
 */
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() || randomUUID();

/** Every route is statically rendered, so precache all of them for full offline use. */
const APP_ROUTES = [
  "/",
  "/calculators/ohms-law",
  "/calculators/rc-rlc",
  "/calculators/op-amp",
  "/tools/resistor-decoder",
  "/tools/pinouts",
  "/tools/lab-plotter",
  "/~offline",
];

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Service workers make local development confusing (stale assets), so only enable them in production builds.
  disable: process.env.NODE_ENV === "development",
  // Precache icons and the manifest; install-dialog screenshots are fetched on demand only.
  globPublicPatterns: ["icons/**/*", "manifest.json"],
  // Every route is precached at install time, so per-navigation caching is unnecessary.
  cacheOnNavigation: false,
  reloadOnOnline: true,
  additionalPrecacheEntries: APP_ROUTES.map((url) => ({ url, revision })),
});

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
