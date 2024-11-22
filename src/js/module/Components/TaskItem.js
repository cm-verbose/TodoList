/**
 * @description Represents a task in a given task list
 */
export default class TaskItem {
  content = "";

  constructor(content = "") {
    this.content = content;
  }

  /** @description Creates the task list element */
  createTask() {
    const task = new document.createElement("li"); 
    task.innerText = this.content; 

    return task; 
  }
}
