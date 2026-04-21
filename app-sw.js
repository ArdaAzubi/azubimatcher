const AZUBIMATCH_APP_CACHE = "azubimatch-mobile-__AZUBIMATCH_SW_VERSION__";
const APP_FALLBACKS = ["/app/", "/app.html", "/"];

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith("azubimatch-mobile-") && name !== AZUBIMATCH_APP_CACHE)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

async function fromCacheFallback() {
  for (const candidate of APP_FALLBACKS) {
    const cached = await caches.match(candidate);
    if (cached) return cached;
  }
  return new Response("AzubiMatcher ist gerade offline.", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

// Only intercept requests that belong to the /app/ PWA.
// All WordPress portal pages (/bewerber/, /firma/, etc.) must pass through
// to the network directly so they always receive the latest server content.
function isAppRoute(url) {
  const p = url.pathname;
  return (
    p === "/app/" ||
    p === "/app" ||
    p === "/app.html" ||
    p.startsWith("/app/") ||
    p === "/" ||
    p === "/index.html"
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!request || request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // Non-app routes: let the browser handle normally (no SW interception).
  if (!isAppRoute(requestUrl)) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(AZUBIMATCH_APP_CACHE);
        cache.put(request, response.clone());
        return response;
      } catch (_error) {
        const cached = await caches.match(request);
        return cached || fromCacheFallback();
      }
    })());
    return;
  }

  if (["script", "style", "image", "font"].includes(request.destination)) {
    event.respondWith((async () => {
      const cache = await caches.open(AZUBIMATCH_APP_CACHE);
      const cached = await cache.match(request);
      const networkRequest = fetch(request)
        .then((response) => {
          cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached || Response.error());

      return cached || networkRequest;
    })());
  }
});
