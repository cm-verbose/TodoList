"use strict";

/**
 * @author cmvb
 **/

class Main {
  constructor() {
    this.formCreate = document.querySelector("#task-create");
    this.taskInput = document.querySelector("#task-input");
    this.taskButton = document.querySelector("#task-submit-button");
    this.taskTemplate = document.querySelector("#task-template");
    this.taskList = document.querySelector("#task-container");
    this.taskEditTemplate = document.querySelector("#task-content-edit");
    this.taskCount = document.querySelector("#task-count");
    this.taskDeleteAllButton = document.querySelector("#task-delete-all");
    this.taskDialog = document.querySelector("#modal");
    this.taskDialogClose = document.querySelector("#closeModal");
    this.taskDialogButtons = document.querySelectorAll("#dialogBox > button");
    this.taskSortButton = document.querySelector("#task-sort-button");
    this.taskSearchInput = document.querySelector("#task-search-input");
    this.taskDB = null;
    this.checkStoredData();
  }

  /** @description Invokes other functions to start the app */
  instantiate_todo() {
    this.formCreate.addEventListener("submit", (submitEvent) => {
      submitEvent.preventDefault();
    });

    this.taskInput.addEventListener("blur", () => {
      const task_content = this.taskInput.innerText;
      if (task_content.replace(/\s|\n/g, "") === "") this.taskInput.innerHTML = "";
    });

    this.taskInput.addEventListener("keydown", (keyboardEvent) => {
      if (keyboardEvent.key === "Enter" && !keyboardEvent.shiftKey) {
        this.createTask();
        keyboardEvent.preventDefault();
      }
    });

    this.taskInput.addEventListener("paste", (clipboardEvent) => {
      clipboardEvent.preventDefault();
      const data = (clipboardEvent.originalEvent || clipboardEvent).clipboardData.getData(
        "text/plain"
      );
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);

      range.deleteContents();
      range.insertNode(document.createTextNode(data));
      range.collapse(false);

      selection.removeAllRanges();
      selection.addRange(range);
    });

    this.taskButton.addEventListener("click", () => this.createTask());

    /* Avoids implementing logic for counting tasks */
    const countObserver = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type !== "childList") continue;
        const count = this.taskList.children.length;
        this.taskCount.innerHTML = `${count}`;
      }
    });
    countObserver.observe(this.taskList, { childList: true });
    this.taskSortButton.addEventListener("click", () => this.sortList());
    this.taskSearchInput.addEventListener("keydown", () => this.searchTask());
    this.setDialogEvents();
  }

  /** @description creates a new task */
  createTask() {
    if (this.isEmpty(this.taskInput.innerText)) return;
    const content = this.taskInput.innerHTML.normalize();
    this.createTaskNode(content);

    this.taskInput.innerHTML = "";
  }

  /** @description creates the task node with the template, or without, if it is not supported */
  createTaskNode(task = "") {
    if (this.taskDB) this.addToIndexedDB(task);
    let hasDuplicates = this.checkDuplicates(task);
    if (hasDuplicates) return;
    if ("content" in document.createElement("template")) {
      this.createTaskTemplate(task);
    } else {
      this.createTaskNoTemplate(task);
    }
  }

  /** @description creates a task if templates are supported */
  createTaskTemplate(taskText = "") {
    const clone = this.taskTemplate.content.firstElementChild.cloneNode(true);
    const taskContent = clone.querySelector("span");
    taskContent.innerHTML = taskText;

    const removeButton = clone.querySelector("#close");
    removeButton.addEventListener("click", (mouseEvent) => {
      if (this.taskDB) {
        const span =
          mouseEvent.target.parentElement.parentElement.parentElement.querySelector("span");
        this.removeFromIndexedDB(span.innerText);
      }
      clone.remove();
    });

    const editButton = clone.querySelector("#edit");

    const editTemplate = () => {
      const taskSpan = clone.querySelector("span");
      const editClone = this.taskEditTemplate.content.firstElementChild.cloneNode(true);
      const cloneContent = taskSpan.innerHTML;

      taskSpan.replaceWith(editClone);
      editClone.innerHTML = cloneContent;
      editClone.focus();

      const finalizeEdit = () => {
        editClone.removeEventListener("blur", finalizeEdit);
        const content = editClone.innerHTML;
        const span = document.createElement("span");

        if (!this.isEmpty(content)) {
          if (this.taskDB) this.editTaskContentFromIndexedDB(cloneContent, content);
          span.innerHTML = content;
        } else {
          span.innerHTML = cloneContent;
        }
        editClone.replaceWith(span);
      };

      editClone.addEventListener("blur", finalizeEdit);
      editClone.addEventListener("keydown", (keyboardEvent) => {
        if (keyboardEvent.key === "Enter" && !keyboardEvent.shiftKey) {
          finalizeEdit();
          keyboardEvent.preventDefault();
        }
      });
      editButton.addEventListener("click", editTemplate);
    };

    editButton.addEventListener("click", editTemplate);
    this.taskList.appendChild(clone);
  }

  /** @description creates a task if templates are not supported */
  createTaskNoTemplate(taskText = "") {
    const taskNode = document.createElement("div");
    const taskContent = document.createElement("span");
    taskContent.innerHTML = taskText;

    const hgroup = document.createElement("hgroup");
    const div = document.createElement("div");

    const editButton = document.createElement("button");

    const editTask = () => {
      const taskContents =
        editButton.parentElement.parentElement.parentElement.querySelector("span");
      editButton.removeEventListener("click", editTask);

      const content = taskContents.innerHTML;
      const editPrompt = document.createElement("div");

      editPrompt.setAttribute("contenteditable", "true");
      taskContents.replaceWith(editPrompt);
      editPrompt.innerHTML = content;
      editPrompt.focus();

      const finalizeEdit = () => {
        const editedContent = editPrompt.innerHTML;

        editPrompt.removeEventListener("blur", finalizeEdit);
        const span = document.createElement("span");

        if (!this.isEmpty(editedContent)) {
          if (this.taskDB) this.editTaskContentFromIndexedDB(editedContent, content);
          span.innerHTML = editedContent;
        } else {
          span.innerHTML = content;
        }

        editPrompt.replaceWith(span);
        editButton.addEventListener("click", editTask);
      };

      editPrompt.addEventListener("blur", finalizeEdit);

      editPrompt.addEventListener("keydown", (keyboardEvent) => {
        if (keyboardEvent.key === "Enter" && !keyboardEvent.shiftKey) {
          finalizeEdit();
          keyboardEvent.preventDefault();
        }
      });
    };
    editButton.addEventListener("click", editTask);

    const removeButton = document.createElement("button");
    removeButton.addEventListener("click", (mouseEvent) => {
      const span =
        mouseEvent.target.parentElement.parentElement.parentElement.querySelector("span");
      this.removeFromIndexedDB(span.innerText);
      taskNode.remove();
    });

    const image_data = [
      { src: "./src/svg/edit.svg", alt: "edit" },
      { src: "./src/svg/close.svg", alt: "close" },
    ];

    [editButton, removeButton].forEach((button, index) => {
      const img = document.createElement("img");
      img.src = image_data[index].src;
      img.alt = image_data[index].alt;
      img.setAttribute("width", "20");
      img.setAttribute("height", "20");
      button.appendChild(img);
    });

    div.append(editButton, removeButton);
    hgroup.appendChild(div);
    taskNode.append(hgroup, taskContent);
    this.taskList.appendChild(taskNode);
  }

  /**
   * @description checks if a string, content is empty or not,
   * @returns {boolean}
   */
  isEmpty(content = "") {
    const spaceLikeCharacters =
      /\s|\u{3164}|\u{200B}|\u{200D}|\u{200E}|\u{200F}|\u{FEFF}|\u{FFA0}|\u{FFFC}/gu;
    return content.replace(spaceLikeCharacters, "").normalize() === "";
  }

  /**
   * @description Instantiates IndexedDB or localStorage, if IndexedDB is not supported
   */
  checkStoredData() {
    if (!"indexedDB" in window) {
      this.instantiateIndexedDB();
    } else {
      this.instantiate_todo();
      this.instantiateLocalStorage();
    }
  }

  /** @description Instantiates a new IndexedDB database */
  instantiateIndexedDB() {
    const databaseName = "TaskDataBase";
    const request = indexedDB.open(databaseName, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore("Tasks", { keyPath: "content" });
    };

    request.onerror = (event) => {
      console.error(`Error openining IDB : ${event.target.error}`);
      this.instantiateLocalStorage(); // fallback
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      this.taskDB = db;
      this.instantiate_todo();
      this.loadIndexedDBValues();
    };
  }

  /** @description Loads indexedDB values on page load */
  loadIndexedDBValues() {
    const transaction = this.taskDB.transaction(["Tasks"], "readwrite");
    const objectStore = transaction.objectStore("Tasks");

    const request = objectStore.getAll();
    request.onsuccess = (event) => {
      const tasks = event.target.result;
      let addTask;
      if ("content" in document.createElement("template")) {
        addTask = (task) => this.createTaskTemplate(task);
      } else {
        addTask = (task) => this.createTaskNoTemplate(task);
      }
      for (const task of tasks) {
        addTask(task.content);
      }
    };

    request.onerror = (event) => {
      console.error(`Error loading tasks : ${event.target.error}`);
    };
  }

  /** @description Adds a task to the IndexedDB's object store */
  addToIndexedDB(task) {
    const transaction = this.taskDB.transaction(["Tasks"], "readwrite");
    const objectStore = transaction.objectStore("Tasks");

    const taskContent = { content: task };
    const request = objectStore.add(taskContent);

    request.onerror = (event) => {
      console.error(`Error occured while appending to IDB : ${event.target.error}`);
    };
  }

  /** @description Removes a task from the IndexedDB's object store  */
  removeFromIndexedDB(content) {
    const transaction = this.taskDB.transaction(["Tasks"], "readwrite");
    const objectStore = transaction.objectStore("Tasks");

    const request = objectStore.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const task = cursor.value;

        if (this.decodeHTML(task.content) === content) {
          cursor.delete();
          return;
        }
        cursor.continue();
      } else {
        console.log("Value not found");
        console.log(content);
      }
    };
    request.onerror = (event) => {
      console.error(`Error removing from IDB : ${event.target.error}`);
    };
  }

  /** @description Edit a task's content stored in the IndexedDB */
  editTaskContentFromIndexedDB(oldValue, newValue) {
    const transaction = this.taskDB.transaction(["Tasks"], "readwrite");
    const objectStore = transaction.objectStore("Tasks");

    const request = objectStore.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const task = cursor.value;

        if (task.content === oldValue) {
          const deleteRequest = cursor.delete();

          deleteRequest.onsuccess = () => {
            const newTask = { content: newValue };
            const addRequest = objectStore.add(newTask);
            addRequest.onerror = (event) => {
              console.error(`Error occured while adding task, after editing ${event.target.error}`);
            };
          };
          deleteRequest.onerror = (event) => {
            console.error(`Error occured while deleting task ${event.targer.error}`);
          };
          return;
        }
        cursor.continue();
      } else {
        console.log("Provided value not found");
      }
    };

    request.onerror = (event) => {
      console.error(`Error editing from IDB : ${event.target.error}`);
    };
  }

  /** @description Instantiates localStorage */
  instantiateLocalStorage() {
    if (JSON.parse(localStorage.getItem("Tasks"))) {
      const taskCollection = JSON.parse(localStorage.getItem("Tasks"));
      taskCollection.forEach((taskContentObj) => {
        this.createTaskNode(taskContentObj.content);
      });
    }

    window.addEventListener("beforeunload", () => {
      const tasks = [];
      for (let i = 0; i < this.taskList.childElementCount; i++) {
        const task = this.taskList.children[i];
        const content = {
          content: task.querySelector("span").innerHTML,
        };
        tasks.push(content);
      }
      localStorage.setItem("Tasks", JSON.stringify(tasks));
    });
  }

  /** @description Sets click event for dialog box */
  setDialogEvents() {
    const handleClick = (x) => {
      if (x === "show") {
        this.taskDialog.showModal();
        document.body.style.overflowY = "hidden";
      } else {
        if (x === "delete") this.taskList.innerHTML = "";
        this.taskDialog.close();
        document.body.style.overflowY = "auto";
      }
    };
    this.taskDeleteAllButton.addEventListener("click", () => handleClick("show"));
    this.taskDialogClose.addEventListener("click", handleClick);
    this.taskDialogButtons[0].addEventListener("click", () => handleClick("delete"));
    this.taskDialogButtons[1].addEventListener("click", handleClick);
  }

  /** @description sorts list alphabetically */
  sortList() {
    const children = this.taskList.children;
    if (children.length <= 1) return; // nothing to sort

    const childrenArray = Array.from(children);
    childrenArray.sort((a, b) => a.textContent.localeCompare(b.textContent));

    for (const task of childrenArray) {
      this.taskList.appendChild(task);
    }
  }

  /** @description Searches for a task on keydown, matching a certain query */
  searchTask() {
    const query = this.taskSearchInput.value.toLowerCase();
    if (this.isEmpty(query)) return;

    const tasks = this.taskList.children;
    for (const task of tasks) {
      const taskContent = task.children[1].innerText;
      task.style.display = taskContent.includes(query) ? "block" : "none";
    }
  }

  /** 
   * @description Decodes HTML. Changes the &gt; tag to ">" to obtain the actual value 
   * Used with IndexedDB to check the litteral content to delete according to the 
   * task's value ;
   * */
  decodeHTML(value) {
    const parser = new DOMParser();
    const decodedString = parser.parseFromString(value, "text/html");
    return decodedString.documentElement.textContent;
  }

  /**
   * @description Prevents from adding duplicate tasks in the list
   * @returns {true | false} true if a duplicate is found false if not
   * FIXME: this probably sucks performance-wise
   * */
  checkDuplicates(query) {
    const tasks = this.taskList.children;
    for (const task of tasks) {
      if (task.querySelector("span").innerText === query) {
        task.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
    }
    return false;
  }
}

new Main();
