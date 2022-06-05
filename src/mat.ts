import { MatrixAtom } from "euler-tex/src/lib";
import { Builder } from "./util";

export class MatBuilderView {
  elem: HTMLDivElement = document.createElement("div");
  left: HTMLDivElement = document.createElement("div");
  right: HTMLDivElement = document.createElement("div");
  bottom: HTMLDivElement = document.createElement("div");
  top: HTMLDivElement = document.createElement("div");
  direction: "left" | "top" | "right" | "bottom" = "bottom";
  pos = 0;
  constructor() {
    this.elem.className = "mat-builder";
    this.bottom.innerText = "Add row below";
    this.top.innerText = "Add row Above";
    this.right.innerText = "Add Column Right";
    this.left.innerText = "Add Column Left";
    this.elem.style.visibility = "hidden";
    this.elem.append(this.left, this.top, this.right, this.bottom);
    this.elem.addEventListener("pointerdown", (ev) => ev.stopPropagation());
    this.select("bottom");
  }

  isOpen = () => this.elem.style.visibility !== "hidden";

  open(left: number, top: number) {
    this.elem.style.visibility = "unset";
    this.elem.style.transform = `translate(${left}px,${top}px)`;
  }

  close() {
    this.elem.style.visibility = "hidden";
  }

  select(direction: "left" | "right" | "top" | "bottom") {
    this[this.direction].className = "";
    this.direction = direction;
    this[direction].className = "focus";
  }
}

export module MatrixBuilder {
  export const view = new MatBuilderView();

  export const reset = () => {
    view.select("bottom");
    view.close();
  };

  export const set = (left: number, top: number) => {
    view.open(left, top);
  };

  export const add = (mat: MatrixAtom, row: number, col: number) => {
    switch (view.direction) {
      case "top":
        Builder.addRow(mat, row);
        return [row, col];
      case "bottom":
        Builder.addRow(mat, row + 1);
        return [row + 1, col];
      case "left":
        Builder.addColumn(mat, col);
        return [row, col];
      case "right":
        Builder.addColumn(mat, col + 1);
        return [row, col + 1];
    }
  };
}
