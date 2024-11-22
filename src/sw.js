class ServiceWorker {
  CACHE_NAME = "Assets";
  ASSETS_PATH = ["./index.html", "./css/style.css", "./js/script.js"];

  constructor() {
    this.ini();
  }

  ini() {
    this.handleInstall();
    this.handleActivation();
    this.handleFetch();
  }

  /** @description Handles installation phase */
  handleInstall() {
    self.addEventListener("install", (event) => {
      this.log("Installing service worker");
      event.waitUntil(
        (async () => {
          const cache = await caches.open(this.CACHE_NAME);
          this.log("Caching ressources...");
          cache.addAll(this.ASSETS_PATH);
        })()
      );
    });
  }

  /** @description Handles activation phase */
  handleActivation() {
    self.addEventListener("activate", (event) => {
      self.clients.claim();
    });
  }

  /** @descriptions Handles fetching phase */
  handleFetch() {
    self.addEventListener("fetch", (event) => {
      const request = event.request;
      if (!request) {
        return;
      }
      if (request.url.startsWith("chrome")) {
        return;
      }

      event.respondWith(
        (async () => {
          const fetchRequest = await caches.match(request);
          // this.log(`Fetching ${request}`);
          if (fetchRequest instanceof Request) {
            return fetchRequest;
          }

          try {
            const response = await fetch(request);
            const assetsCache = await caches.open(this.CACHE_NAME);

            if (request.url.startsWith("chrome-extension://")) {
              return;
            }

            // this.log(`Caching assets at ${request.url}`);
            assetsCache.put(request, response.clone());
            return response;
          } catch (error) {
            return new Response("Network issue occured", {
              status: 408,
              headers: { "Content-Type": "text/plain" },
            });
          }
        })()
      );
    });
  }

  /** @description Logs information about the service worker */
  log(content) {
    console.log(`[Service Worker] ${content}`);
  }
}

new ServiceWorker();
