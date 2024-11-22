import TaskEvents from "./module/TaskEvents.js";

class Main {
  // Relative to root
  SERVICE_WORKER_PATH = "./sw.js";
  constructor() {
    this.ini();
  }

  ini() {
    this.initialiseServiceWorker();
    new TaskEvents();
  }

  /** @description initialises the page's service worker */
  initialiseServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register(this.SERVICE_WORKER_PATH, { scope: "./" });
      });
    }
  }
}

new Main();
