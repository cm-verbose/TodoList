/**
 *
 * @description Represents a task object
 *
 */

import voidLikeRegex from "./regex.js";
export default class Task {
  /**
   * @param {string} content
   */
  constructor(content, database) {
    this.db = database;
    this.taskElement = document.createElement("div");
    this.oldContent = null;
    this.paraNode = null;
    this.content = content;
  }

  /** @description creates the task element */
  createTaskElement() {
    const header = this.createHeader();
    this.taskElement.appendChild(header);
    const body = this.createTaskBody();
    this.taskElement.appendChild(body);
    return this.taskElement;
  }

  /** @description creates the header for the taskElement */
  createHeader() {
    const header = document.createElement("hgroup");
    const wrapperDiv = document.createElement("div");

    const deleteButton = this.createDeleteButton();
    const editButton = this.createEditButton();

    wrapperDiv.appendChild(editButton);
    wrapperDiv.appendChild(deleteButton);
    header.appendChild(wrapperDiv);
    return header;
  }

  /** @description creates the button that deletes the task */
  createDeleteButton() {
    const deleteButton = document.createElement("button");
    const deleteButtonImage = document.createElement("img");
    deleteButtonImage.src = "./svg/close.svg";
    deleteButtonImage.alt = "delete task";
    deleteButton.appendChild(deleteButtonImage);
    deleteButton.addEventListener("click", () => {
      if (this.db !== null) {
        const transaction = this.db.transaction("tasks", "readwrite");
        const tasks = transaction.objectStore("tasks");
        const index = tasks.index("content");

        index.openCursor().onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const contentObject = cursor.value;
            const taskValue = contentObject.content;
            if (taskValue === this.content) {
              cursor.delete();
            }
            cursor.continue();
          }
        };
      }
      this.taskElement.remove();
    });
    return deleteButton;
  }

  createEditButton() {
    const editButton = document.createElement("button");
    const editButtonImage = document.createElement("img");
    editButtonImage.src = "./svg/edit.svg";
    editButton.alt = "edit task";
    editButton.appendChild(editButtonImage);
    editButton.addEventListener("click", () => this.handleTaskEdit(editButton));
    return editButton;
  }

  createTaskBody() {
    const taskbody = document.createElement("div");
    const checkDiv = document.createElement("div");
    const input = document.createElement("input");
    input.type = "checkbox";
    checkDiv.appendChild(input);
    taskbody.appendChild(checkDiv);

    input.onclick = () => {
      const isInputChecked = input.checked;
      if (isInputChecked) {
        this.taskElement.setAttribute("data-checked", "checked");
      } else {
        if (this.taskElement.getAttribute("data-checked") === null) return;
        this.taskElement.removeAttribute("data-checked");
      }
    };

    const p = document.createElement("p");
    p.textContent = this.content.normalize("NFC");
    this.paraNode = p;
    taskbody.appendChild(p);
    return taskbody;
  }

  /** @description handles the task being edited */
  handleTaskEdit(editButton) {
    if (this.paraNode === null || editButton === null) return;
    this.paraNode.setAttribute("contenteditable", "true");
    this.paraNode.focus();
    const selection = document.getSelection();
    selection.selectAllChildren(this.paraNode);
    selection.collapseToEnd();
    this.oldContent = this.paraNode.textContent;
    this.paraNode.addEventListener("blur", this.handleEditBlur());
  }

  /** @description changes the input */
  handleEditBlur() {
    return () => {
      const voidLikeSource = voidLikeRegex.source;
      const specialTrim = new RegExp(`^(${voidLikeSource})|(${voidLikeSource})$`, "g");
      let editedContent = this.paraNode.textContent.replace(specialTrim, "");

      if (editedContent.length === 0) {
        editedContent = this.oldContent;
      } else if (editedContent.length > 1024) {
        editedContent = editedContent.slice(0, 1024);
      }

      if (this.db !== null) {
        const transaction = this.db.transaction("tasks", "readwrite");
        const tasks = transaction.objectStore("tasks");
        const index = tasks.index("content");

        index.openCursor().onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const contentObject = cursor.value;
            const taskValue = contentObject.content;
            if (taskValue === this.oldContent) {
              contentObject.content = editedContent;
              cursor.update(contentObject);
              return;
            }
            cursor.continue();
          }
        };
      }

      this.paraNode.textContent = editedContent;
      this.paraNode.removeAttribute("contenteditable");
      this.paraNode.removeEventListener("blur", this.handleEditBlur());
    };
  }
}
