import ListItem from "./Components/ListItem.js";
import TaskStorage from "./Storage/TaskStorage.js";
import TaskItem from "./Components/TaskItem.js";

/**
 * @description Handles events relative to interacting with the app
 */
export default class TaskEvents {
  listCreatePopupButton = document.querySelector("#create-list-popup-button");
  listCreatePopup = document.querySelector("#list-creation-popup");
  listCreateInput = document.querySelector("#list-name-input");
  listCreateButton = document.querySelector("#create-list-button");
  taskListsList = document.querySelector("#task-lists");
  taskListTitleInput = document.querySelector("#task-list-name");
  taskList = document.querySelector("#task-list");
  taskCreateInput = document.querySelector("#task-input");
  taskCreateButton = document.querySelector("#task-create-button");

  popupBackground = document.querySelector("#popup-background");

  viewChangeButtons = document.querySelectorAll("[data-view-target]");
  viewList = document.querySelector("#view-list");
  viewTasks = document.querySelector("#view-task-list");

  isTransitioning = false;
  storage = new TaskStorage();

  ACTIVE_POPUP_ATTRIBUTE = "data-active-popup";
  ACTIVE_VIEW_ATTRIBUTE = "data-active-view";
  TRANSITION_DURATION = 500;

  constructor() {
    this.ini();
  }

  ini() {
    this.setListCreationEvents();
    this.setInitialLists();
    this.handleViewTransitions();
    this.handleTaskCreation();
  }

  /** @description Handles events for creating task lists */
  setListCreationEvents() {
    this.listCreatePopupButton.addEventListener("click", () => {
      this.showPopup(this.listCreatePopup);
    });
    this.popupBackground.addEventListener("click", () => {
      this.hidePopup();
    });
    this.listCreateInput.addEventListener("keydown", (event = new KeyboardEvent()) => {
      if (event.key !== "Enter") return;
      this.addList();
    });

    this.listCreateButton.addEventListener("click", () => {
      this.addList();
    });
  }

  /** @description Creates a task in the task list */
  addList() {
    const listName = this.listCreateInput.value;
    if (listName.trim().length === 0) return;
    this.hidePopup();

    this.storage.addList(listName);

    setTimeout(() => {
      this.listCreateInput.value = "";
    }, this.TRANSITION_DURATION);
    this.updateListView();
  }

  /** @description Handles updating a list */
  updateListView() {
    this.taskListsList.innerHTML = "";
    this.storage.getLists().then((lists) => {
      for (const list of lists) {
        const listElement = new ListItem(list.listName).createItem();
        this.taskListsList.appendChild(listElement);
      }
    });
  }

  /** @description Handles setting initial data because of initialisation issues with storage */
  setInitialLists() {
    document.addEventListener("DOMContentLoaded", () => {
      if ("indexedDB" in window) {
        this.handleIDB();
      }
    });
  }

  /** @description Handles opening the database */
  handleIDB() {
    const openingRequest = window.indexedDB.open(this.storage.STORAGE_NAME, 1);

    openingRequest.onsuccess = () => {
      const database = openingRequest.result;
      database.onblocked = () => {
        alert("Database updated, please reload your page");
      };

      const transaction = database.transaction("Todos", "readwrite");
      const taskStore = transaction.objectStore("Todos");
      const request = taskStore.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const list = cursor.value;
          const listElement = new ListItem(list.listName).createItem();

          this.taskListsList.appendChild(listElement);
          cursor.continue();
        }
        database.close();
      };

      request.onerror = (event) => {
        console.error(`[IndexedDB error]: ${event.target.error}`);
      };
    };

    openingRequest.onerror = (event) => {
      console.error(`[IndexedDB error]: ${event.target.error}`);
    };
  }

  /** @description Handles changing views  */
  handleViewTransitions() {
    this.taskListsList.addEventListener("click", (event) => {
      this.taskList.innerHTML = "";
      const target = event.target;
      if (this.taskListsList.isEqualNode(target) || target === null) return;
      this.changeView(this.viewTasks);

      const targetList = target.textContent;
      this.storage.getLists().then((lists) => {
        for (const list of lists) {
          if (targetList === list.listName) {
            this.taskListTitleInput.value = targetList;
          }
          for (const value of list.tasks) {
            const taskElement = new TaskItem(value).createTask();
            this.taskList.appendChild(taskElement);
          }
        }
      });
    });

    for (const button of this.viewChangeButtons) {
      const targetView = button.getAttribute("data-view-target");
      if (!targetView) continue;

      const targetElement = document.querySelector(`#${targetView}`);
      button.addEventListener("click", () => {
        this.changeView(targetElement);
      });
    }
  }

  /** @description Changes views */
  changeView(toView) {
    const activeView = document.querySelector(`[${this.ACTIVE_VIEW_ATTRIBUTE}]`);
    if (activeView === null) return;
    activeView.removeAttribute(this.ACTIVE_VIEW_ATTRIBUTE);
    this.hide(activeView);

    setTimeout(() => {
      toView.setAttribute(this.ACTIVE_VIEW_ATTRIBUTE, "");
      this.show(toView);
    }, this.TRANSITION_DURATION * 2);
  }

  /** @description Handles the creation of tasks and such */
  handleTaskCreation() {
    this.taskCreateInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const taskContent = this.taskCreateInput.value;
      this.createTask(taskContent);
    });

    this.taskCreateButton.addEventListener("click", () => {
      const taskContent = this.taskCreateButton.value;
      this.createTask(taskContent);
    });
  }

  /** @description Creates a new task */
  createTask(content = "") {
    if (content.trim().length === 0) return;
    this.storage.addTask(content).then(result => {
      console.log(result); 
    })
    this.taskCreateInput.value = "";
  }

  /** @description Shows a popup */
  showPopup(popupElement = new Element()) {
    popupElement.setAttribute(this.ACTIVE_POPUP_ATTRIBUTE, "");
    this.show(popupElement, this.popupBackground);
  }

  /** @description Hides a popup (the last one that was opened) */
  hidePopup() {
    const activePopup = document.querySelector(`[${this.ACTIVE_POPUP_ATTRIBUTE}]`);
    const elements = [this.popupBackground];
    if (activePopup !== null) {
      elements.push(activePopup);
    }
    this.hide(...elements);
  }

  /** @description Shows elements */
  show(...elements) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    for (const element of elements) {
      element.style.display = "block";
    }
    setTimeout(() => {
      for (const element of elements) {
        element.style.opacity = "1";
      }
      this.isTransitioning = false;
    }, 25);
  }

  /** @description Hides elements */
  hide(...elements) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    for (const element of elements) {
      element.style.opacity = "0";
    }
    setTimeout(() => {
      for (const element of elements) {
        element.style.display = "none";
      }
      this.isTransitioning = false;
    }, this.TRANSITION_DURATION);
  }
}
