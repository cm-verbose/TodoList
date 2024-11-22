export default class TaskIDB {
  database = null;

  TASK_STORE_NAME = "Todos";

  constructor(databaseName = "") {
    this.DATABASE_NAME = databaseName;
    this.ini();
  }

  ini() {
    const openingRequest = window.indexedDB.open(this.DATABASE_NAME, 1);
    this.handleError(openingRequest);
    this.handleSucess(openingRequest);
    this.handleUpgradeneeded(openingRequest);
  }

  /** @description Handles error when opening the database */
  handleError(request = new IDBOpenDBRequest()) {
    request.onerror = () => {
      this.err("Failed opening database");
    };
  }

  /** @description Handles database opening */
  handleSucess(request = new IDBOpenDBRequest()) {
    request.onsuccess = () => {
      const database = request.result;
      this.database = database;

      this.database.onblocked = () => {
        alert("Database updated, please refresh the page");
      };
    };
  }

  /** @description Handles database upgrades */
  handleUpgradeneeded(request = new IDBOpenDBRequest()) {
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore(this.TASK_STORE_NAME, { autoIncrement: true });
    };
  }

  /** @description Adds an element to the list */
  addList(listName) {
    const database = this.database;

    if (!(database instanceof IDBDatabase)) return;
    const transaction = database.transaction(this.TASK_STORE_NAME, "readwrite");
    const taskStore = transaction.objectStore(this.TASK_STORE_NAME);

    return new Promise((resolve, reject) => {
      const taskList = { listName: listName, tasks: new Map() };
      const request = taskStore.add(taskList);
      request.onsuccess = () => {
        resolve(taskList);
      };

      request.onerror = (event) => {
        reject(`Failed adding list: ${event.target.error}`);
      };
    });
  }

  /** @description Adds a task to a specified list */
  addTask(listName = "") {
    const database = this.database;
    if (!(database instanceof IDBDatabase)) return;
    const transaction = database.transaction(this.TASK_STORE_NAME, "readwrite");
    const taskStore = transaction.objectStore(this.TASK_STORE_NAME);

    console.log(taskStore.keyPath); 

    return new Promise((resolve, reject) => {
      const request = taskStore.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        let targetListName = ""; 

        if (cursor) {
          const list = cursor.value;
          if(list.listName === listName){
            targetListName = listName; 
          }
          cursor.continue();
        }

        console.log(targetListName); 
      };
      request.onerror = (event) => {
        reject(`Failed adding task: ${event.target.error}`);
      };
    });
  }

  /** @description Gets lists from the database */
  getLists() {
    const database = this.database;
    if (!(database instanceof IDBDatabase)) return;
    const transaction = database.transaction(this.TASK_STORE_NAME, "readwrite");
    const taskStore = transaction.objectStore(this.TASK_STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = taskStore.openCursor();
      const lists = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const list = cursor.value;
          lists.push(list);
          cursor.continue();
        } else {
          resolve(lists);
        }
      };

      request.onerror = (event) => {
        reject(`Failed getting lists: ${event.target.error}`);
      };
    });
  }

  /** @description Reports an error with indexedDB */
  err(message = "") {
    console.error(`[IndexedDB error]: ${message}`);
  }
}
