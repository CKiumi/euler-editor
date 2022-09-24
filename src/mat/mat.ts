import { MatrixAtom } from "euler-tex/src/lib";
import { Builder } from "../suggest/builder";

export class MatBuilderView {
  elem = document.createElement("div");
  left = document.createElement("div");
  right = document.createElement("div");
  bottom = document.createElement("div");
  top = document.createElement("div");
  direction: "left" | "top" | "right" | "bottom" = "bottom";
  pos = 0;
  constructor() {
    this.elem.className = "mat-builder";
    this.bottom.innerText = "Row below";
    this.top.innerText = "Row Above";
    this.right.innerText = "Column Right";
    this.left.innerText = "Column Left";
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
    console.log(direction);
    this[this.direction].className = "";
    this.direction = direction;
    this[direction].className = "focus";
  }
}

export class MatDestructerView {
  elem: HTMLDivElement = document.createElement("div");
  left: HTMLDivElement = document.createElement("div");
  top: HTMLDivElement = document.createElement("div");
  direction: "left" | "top" = "left";
  pos = 0;
  constructor() {
    this.elem.className = "mat-destructor";
    this.top.innerText = "Delete Column";
    this.left.innerText = "Delete Row";
    this.elem.style.visibility = "hidden";
    this.elem.append(this.left, this.top);
    this.elem.addEventListener("pointerdown", (ev) => ev.stopPropagation());
  }

  isOpen = () => this.elem.style.visibility !== "hidden";

  open(left: number, top: number) {
    this.elem.style.visibility = "unset";
    this.elem.style.transform = `translate(${left}px,${top}px)`;
    this.select("left");
  }

  close() {
    this.elem.style.visibility = "hidden";
  }

  select(direction: "left" | "top") {
    this[this.direction].className = "";
    this.direction = direction;
    this[direction].className = "focus";
  }
}

export module MatBuilder {
  export const view = new MatBuilderView();

  export const reset = () => {
    view.close();
  };

  export const set = (left: number, top: number) => {
    view.open(left, top);
    view.select("bottom");
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

export module MatDestructor {
  export const view = new MatDestructerView();

  export const reset = () => {
    view.select("left");
    view.close();
  };

  export const set = (left: number, top: number) => {
    view.open(left, top);
  };

  export const remove = (mat: MatrixAtom, row: number, col: number) => {
    switch (view.direction) {
      case "top":
        Builder.deleteCol(mat, col);
        return [
          row,
          Math.min(col, Math.max(...mat.rows.map((row) => row.length)) - 1),
        ];

      case "left":
        Builder.deleteRow(mat, row);
        return [Math.min(row, mat.rows.length - 1), col];
    }
  };
}
