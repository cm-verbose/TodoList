import voidLikeRegex from "./regex.js";
import Task from "./task.js";

class Main {
  databaseName = "TaskList";

  constructor() {
    this.taskCount = document.querySelector("#task-count");
    this.taskCompletedCount = document.querySelector("#task-completion");
    this.taskForm = document.querySelector("#task-form");
    this.taskInput = document.querySelector("#task-submit-input");
    this.taskList = document.querySelector("#task-container");
    this.taskPromptDeleteButton = document.querySelector("#task-delete-button");
    this.taskPromptDeleteWindow = document.querySelector("#prompt-delete-window");
    this.taskPromptDeleteCloser = document.querySelector("#prompt-closer");
    this.taskDeleteAllButton = document.querySelector("#delete-all-tasks-button");

    this.db = null;
    this.ini();
  }

  ini() {
    this.setTaskEvents();
    this.setupIndexedDB();
  }

  /** @description set events related to creating, editing and interacting with tasks */
  setTaskEvents() {
    this.taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.createTask();
    });
    this.taskPromptDeleteButton.addEventListener("click", () => this.openDeleteView());
    this.taskPromptDeleteCloser.addEventListener("click", () => this.closeDeleteView());
    this.taskDeleteAllButton.addEventListener("click", () => {
      this.taskList.innerHTML = "";
      this.closeDeleteView();
    });
    this.setTaskCount();
  }

  /** @description creates a task in the todolist */
  createTask() {
    const voidLikeSource = voidLikeRegex.source;
    const specialTrim = new RegExp(`^(${voidLikeSource})|(${voidLikeSource})$`, "g");
    const taskValue = this.taskInput.value.trim().replace(specialTrim, "");
    if (!taskValue || taskValue.replace(voidLikeRegex, "").length === 0) return;

    const tasks = this.taskList.querySelectorAll("p");
    for (const task of tasks) {
      const containsTaskValue = task.textContent === taskValue;
      if (containsTaskValue) {
        const parentTask = task.parentElement.parentElement;
        this.taskInput.disabled = "true";
        this.taskInput.setAttribute("placeholder", "Scrolling...");
        this.handleScrollRevert(parentTask);
        return;
      }
    }

    const task = new Task(taskValue, this.db);
    const taskElement = task.createTaskElement();
    this.taskList.appendChild(taskElement);
  }

  /** @description reverts the ability to scroll  */
  async handleScrollRevert(target) {
    const intersectionObserver = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        this.taskInput.disabled = "";
        this.taskInput.setAttribute("placeholder", "Create task");
        this.taskInput.focus();
      }
    });

    intersectionObserver.observe(target);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** @description sets a counter for the number of tasks when the list mutates and computes statistics */
  setTaskCount() {
    const callback = (mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type !== "childList" && mutation.type !== "attributes") continue;
        this.handleUpdateComputations();
      }
    };
    const mutationObserverOptions = {
      attributes: true,
      childList: true,
      subtree: true,
    };
    const observer = new MutationObserver(callback);
    observer.observe(this.taskList, mutationObserverOptions);
  }

  /** @description handles computations when the list mutates */
  handleUpdateComputations() {
    const count = this.taskList.childElementCount;
    if (count === 0) {
      this.taskCount.textContent = "No tasks";
    } else if (count === 1) {
      this.taskCount.textContent = `1 task`;
    } else {
      this.taskCount.textContent = `${count} tasks`;
    }

    const checkedTasks = document.querySelectorAll("[data-checked='checked']");
    const completedTasks = checkedTasks.length;

    if (completedTasks === 0) {
      this.taskCompletedCount.textContent = "No tasks accomplished";
      return;
    }

    const completedPercent = Math.round((completedTasks / count) * 100);
    if (completedTasks === 1 && completedPercent !== 100) {
      this.taskCompletedCount.textContent = `1 completed task (${Math.round((1 / count) * 100)}%)`;
    } else if (completedPercent === 100) {
      this.taskCompletedCount.textContent = "All tasks completed";
    } else {
      this.taskCompletedCount.textContent = `${completedTasks} completed tasks (${completedPercent}%)`;
    }
  }

  /** @description Opens the view to delete all tasks */
  openDeleteView() {
    this.taskPromptDeleteWindow.style.display = "block";
    this.taskPromptDeleteCloser.style.display = "block";
  }

  closeDeleteView() {
    this.taskPromptDeleteWindow.style.display = "none";
    this.taskPromptDeleteCloser.style.display = "none";
  }

  /** @description sets up a database to persist content through reloads */
  setupIndexedDB() {
    const openRequest = indexedDB.open(this.databaseName, 1);
    openRequest.onerror = () => {
      console.error(`Failed opening indexedDB : ${openRequest.error}`);
    };

    openRequest.onupgradeneeded = () => {
      const db = openRequest.result;
      if (!db.objectStoreNames.contains("tasks")) {
        const objectStore = db.createObjectStore("tasks", { autoIncrement: true, keyPath: "id" });
        objectStore.createIndex("content", "content", { unique: false });
      }
    };

    openRequest.onsuccess = () => {
      const db = openRequest.result;

      if (this.db === null) {
        this.db = db;
      }

      const transaction = db.transaction("tasks", "readwrite");
      const tasks = transaction.objectStore("tasks");
      const index = tasks.index("content");

      index.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const contentObject = cursor.value;
          const taskValue = contentObject.content;

          const task = new Task(taskValue, this.db);
          const taskElement = task.createTaskElement();
          this.taskList.appendChild(taskElement);
          cursor.continue();
        }
      };

      this.taskForm.addEventListener("submit", () => {
        const voidLikeSource = voidLikeRegex.source;
        const specialTrim = new RegExp(`^(${voidLikeSource})|(${voidLikeSource})$`, "g");
        const taskValue = this.taskInput.value.replace(specialTrim).trim();

        if (!taskValue || taskValue.replace(voidLikeRegex, "").length === 0) return;

        const transaction = db.transaction("tasks", "readwrite");
        const tasks = transaction.objectStore("tasks");
        const request = tasks.add({ content: taskValue });

        this.taskInput.value = "";
        request.onerror = () => {
          console.error(`IDB : Failed adding task ${request.error}`);
        };
      });
    };
  }
}

new Main();
