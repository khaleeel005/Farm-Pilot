const version = new URL(self.location.href).searchParams.get("v") || "v1";
const shellCache = `farm-manager-shell-${version}`;
const runtimeCache = `farm-manager-runtime-${version}`;
const shellFiles = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/brand-logo.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(shellCache)
      .then((cache) => cache.addAll(shellFiles))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("farm-manager-") &&
                key !== shellCache &&
                key !== runtimeCache,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches
            .open(runtimeCache)
            .then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match("/")) ||
            (await caches.match("/index.html"))
          );
        }),
    );
    return;
  }

  const isStaticAsset =
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.startsWith("/static/");

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches
            .open(runtimeCache)
            .then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkResponse;
    }),
  );
});
