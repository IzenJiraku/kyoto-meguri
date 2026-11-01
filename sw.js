// AGARU service worker: アプリ本体とフォントだけをキャッシュする
// 掲載写真（Wikimedia）と地図（国土地理院）はキャッシュしない。他サイトの画像を入れると、
// ブラウザが1枚あたり数MBとして容量を数えてしまい、端末の保存容量を大きく使うため
const VERSION = "v67";
const CORE = ["./", "index.html", "manifest.webmanifest", "vendor/leaflet.js", "vendor/leaflet.css", "icons/icon-192-v3.png", "icons/icon-512-v3.png", "icons/apple-touch-icon-v3.png"];
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
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (req.mode === "navigate") {
    // ページは新しい版を優先し、オフラインならキャッシュ
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put("index.html", copy)); return r; }).catch(() => caches.match("index.html")));
    return;
  }
  if (url.origin === location.origin || isFont) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok && r.type !== "opaque") { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    })));
  }
});
