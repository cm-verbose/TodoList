/**
 * @description Represents an item in the list view
 */
export default class ListItem {
  name = "";

  constructor(name = "") {
    this.name = name;
  }

  /** @description Creates the element */
  createItem() {
    const item = document.createElement("li");
    item.innerText = this.name;

    return item;
  }
}
