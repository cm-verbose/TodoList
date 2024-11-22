import TaskIDB from "./TaskIDB.js";

export default class TaskStorage {
  storage = undefined;
  STORAGE_NAME = "TodoStorage";

  constructor() {
    this.ini();
  }

  ini() {
    if ("indexedDB" in window) {
      this.storage = new TaskIDB(this.STORAGE_NAME);
    }
  }

  /** @description Adds a list to the storage unit */
  addList(listName = "") {
    if (this.storage instanceof TaskIDB) {
      return this.storage.addList(listName);
    }
  }

  /** @description Adds a task to the task list */
  addTask(taskContent = "") {
    if (this.storage instanceof TaskIDB) {
      return this.storage.addTask(taskContent);
    }
  }

  /** @description Gets lists from the storage unit */
  getLists() {
    if (this.storage instanceof TaskIDB) {
      return this.storage.getLists();
    }
  }
}
