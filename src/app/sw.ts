/// <reference lib="webworker" />

import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist, StaleWhileRevalidate } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  runtimeCaching: [
    {
      matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/_next/static/") && /\.(?:js|css)$/.test(url.pathname),
      handler: new CacheFirst({ cacheName: "crest-app-assets", plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 30 * 24 * 60 * 60 })] }),
    },
    {
      matcher: ({ sameOrigin, request }) => sameOrigin && request.destination === "font",
      handler: new StaleWhileRevalidate({ cacheName: "crest-fonts", plugins: [new ExpirationPlugin({ maxEntries: 12, maxAgeSeconds: 30 * 24 * 60 * 60 })] }),
    },
    { matcher: ({ request }) => request.mode === "navigate", handler: new NetworkOnly() },
    // Never cache API, authenticated data, storage responses, or other dynamic requests.
    { matcher: () => true, handler: new NetworkOnly() },
  ],
  fallbacks: {
    entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

serwist.addEventListeners();
