const CACHE = "rcp-v1";
const ARCHIVOS = ["./", "./index.html", "./manifest.json", "./logo.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(ARCHIVOS.map((a) => c.add(a).catch(() => {}))))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((r) => {
        const copia = r.clone();
        caches.open(CACHE).then((c) => c.put(req, copia));
        return r;
      })
      .catch(() => caches.match(req).then((m) => m || caches.match("./index.html")))
  );
});
