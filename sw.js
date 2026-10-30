// 京都めぐり帖 service worker: アプリ本体はキャッシュ優先、フォントは取得時にキャッシュ
const VERSION = "v18";
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192-v2.png", "icons/icon-512-v2.png", "icons/apple-touch-icon-v2.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" || url.hostname === "upload.wikimedia.org" || url.hostname === "cyberjapandata.gsi.go.jp" || (url.hostname === "commons.wikimedia.org" && url.pathname.startsWith("/wiki/Special:FilePath/"));
  if (req.mode === "navigate") {
    // ページは新しい版を優先し、オフラインならキャッシュ
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put("index.html", copy)); return r; }).catch(() => caches.match("index.html")));
    return;
  }
  if (url.origin === location.origin || isFont) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    })));
  }
});
