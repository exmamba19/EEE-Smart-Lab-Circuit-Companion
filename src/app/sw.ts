/// <reference lib="webworker" />
/// <reference types="@serwist/next/typings" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, Serwist } from "serwist";

// `self.__SW_MANIFEST` is replaced at build time with the list of files to precache
// (all `_next/static` JS/CSS chunks, public assets and the app routes from next.config.ts).
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * App Router pages are precached as HTML, but client-side navigation and <Link> prefetching
 * fetch React Server Component (RSC) payloads (`?_rsc=…` + `RSC: 1` header). Those URLs carry a
 * per-request hash, so they cannot be precached directly. Instead, on install we fetch the *full*
 * RSC payload of every precached route and keep it keyed by pathname. When offline, RSC requests
 * fall back to that payload so in-app navigation keeps working instead of erroring.
 */
const RSC_OFFLINE_CACHE = "rsc-offline-v1";

// The build injects the manifest at exactly one reference, so read it once here.
const precacheEntries = self.__SW_MANIFEST;

const appRoutes = (precacheEntries ?? [])
  .map((entry) => (typeof entry === "string" ? entry : entry.url))
  .filter((url) => url.startsWith("/") && !url.startsWith("/_next/") && !/\.[a-z0-9]+$/i.test(url));

async function warmRscCache() {
  const cache = await caches.open(RSC_OFFLINE_CACHE);
  await Promise.all(
    appRoutes.map(async (route) => {
      try {
        const res = await fetch(route, { headers: { RSC: "1" }, cache: "no-store" });
        if (res.ok && (res.headers.get("content-type") ?? "").includes("text/x-component")) {
          await cache.put(route, res);
        }
      } catch {
        /* offline during install — the HTML precache still covers full page loads */
      }
    }),
  );
}

self.addEventListener("install", (event) => event.waitUntil(warmRscCache()));

const isRscRequest = (request: Request, sameOrigin: boolean) =>
  sameOrigin && request.method === "GET" && request.headers.get("RSC") === "1";

const serwist = new Serwist({
  precacheEntries,
  precacheOptions: {
    // Serve the precached page for tracking / launch parameters (e.g. the manifest's `?source=pwa`).
    // Deliberately NOT a catch-all: `?_rsc=` requests must miss the precache and reach the RSC handler below.
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^source$/],
    cleanupOutdatedCaches: true,
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // RSC payloads: always network first (they depend on the router state), offline fallback to the
    // full payload captured at install time.
    {
      matcher: ({ request, sameOrigin }) => isRscRequest(request, sameOrigin),
      handler: async ({ request, url }) => {
        try {
          return await fetch(request);
        } catch {
          const cached = await caches.open(RSC_OFFLINE_CACHE).then((c) => c.match(url.pathname, { ignoreVary: true }));
          return cached ?? Response.error();
        }
      },
    },
    // App icons and screenshots rarely change: serve them straight from the cache.
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && /^\/(icons|screenshots)\//.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "pwa-icons",
        plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 365 })],
      }),
    },
    // Serwist's recommended Next.js strategies (static JS/CSS, fonts, images, RSC payloads, pages…).
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
