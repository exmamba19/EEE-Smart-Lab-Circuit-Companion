/// <reference lib="webworker" />
/// <reference types="@serwist/next/typings" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, Serwist } from "serwist";

// `self.__SW_MANIFEST` is replaced at build time with the list of files to precache:
// all `_next/static` JS/CSS chunks, icons, the manifest, and — from next.config.ts — every
// exported page (`route/`) plus its RSC payload (`route/index.txt`) used by client-side navigation.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    // `_rsc` is a cache-busting hash on RSC payload requests (`route/index.txt?_rsc=…`);
    // `source` comes from the manifest's start_url / shortcuts. Both map to the same precached file.
    ignoreURLParametersMatching: [/^_rsc$/, /^source$/, /^utm_/, /^fbclid$/],
    cleanupOutdatedCaches: true,
    // Pages are exported as `route/index.html`; also match `/route` (no trailing slash).
    urlManipulation: ({ url }) => {
      if (url.pathname.endsWith("/") || /\.[a-z0-9]+$/i.test(url.pathname)) return [];
      const withSlash = new URL(url.href);
      withSlash.pathname += "/";
      return [withSlash];
    },
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // App icons and screenshots rarely change: serve them straight from the cache.
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && /^\/(icons|screenshots)\//.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "pwa-icons",
        plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 365 })],
      }),
    },
    // Serwist's recommended Next.js strategies (static JS/CSS, fonts, images, pages…).
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline/",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
