"use strict";

/**
 * @author cmvb
 **/

class ServiceWorker {
  constructor() {
    this.cacheName = "Task cache";
    this.cachedRessourcesURL = [
      "./script.js",
      "../css/style.css",
      "../data/webmanifest/webmanifest",
      "../font/Variable_Wix-made-for-text.ttf",
    ];
    this.initializeServiceWorker();
  }

  /** @description Initializes the service worker */
  initializeServiceWorker() {
    self.addEventListener("install", this.onInstall.bind(this));
    self.addEventListener("activate", this.onActivate.bind(this));
    self.addEventListener("fetch", this.onFetch.bind(this));

    navigator.serviceWorker
      .register("./service-worker.js", { scope: "../../" })
      .then((registration) => {
        console.log("Service worker registered !");
        registration.update();
      })
      .catch((error) => {
        console.error(`Error registering service worker : ${error}`);
      });
  }

  /** @description Ran when the browser first reads / installs the service worker */
  onInstall(event) {
    event.waitUntil(
      caches.open(this.cacheName).then((cache) => cache.addAll(this.cachedRessourcesURL))
    );
  }

  /** @description Ran when the service worker passes from an idle to active state*/
  onActivate(event) {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== this.cacheName) return caches.delete(cache);
          })
        );
      })
    );
  }

  /** @description Ran whenever a network request is made from the active page*/
  onFetch(event) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) return response;
        return fetch(event.request);
      })
    );
  }
}

if ("serviceWorker" in navigator) {
  new ServiceWorker();
}
