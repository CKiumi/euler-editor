import "euler-tex/css/eulertex.css";
import "euler-tex/css/font.css";
import {
  Atom,
  GroupAtom,
  latexToEditableAtom,
  MatrixAtom,
  parse,
  SymAtom,
} from "euler-tex/src/lib";
import { Caret } from "./caret";
import { MatrixBuilder, MatrixDestructor } from "./mat";
import { redo, undo } from "./record";
import { EngineSuggestion, Suggestion } from "./suggest/suggest";
import { Builder, Util } from "./util";
export class EulerEditor extends HTMLElement {
  textarea: HTMLTextAreaElement;
  field: HTMLElement;
  lines: GroupAtom[] = [];
  lineIndex = 0;
  caret: Caret;
  constructor() {
    super();
    this.append(document.createElement("template").content.cloneNode(true));

    this.field = document.createElement("span");
    this.field.className = "EE_container";

    this.textarea = document.createElement("textarea");
    this.textarea.className = "EE_textarea";

    this.field.insertAdjacentElement("beforeend", Suggestion.view.elem);
    this.field.insertAdjacentElement("beforeend", MatrixBuilder.view.elem);
    this.field.insertAdjacentElement("beforeend", MatrixDestructor.view.elem);
    this.field.insertAdjacentElement("beforeend", EngineSuggestion.view.elem);

    this.addEventListener("focus", () => {
      this.textarea.focus({ preventScroll: true });
    });

    const sel = document.createElement("div");
    sel.className = "EE_selection";

    const caret = document.createElement("div");
    caret.className = "EE_caret";

    this.field.insertAdjacentElement("afterbegin", caret);
    this.field.insertAdjacentElement("afterbegin", sel);

    this.caret = new Caret(
      caret,
      this.field,
      {
        focus: this.focus,
        blur: this.blur,
        render: this.renderLine,
      },
      sel
    );

    Suggestion.replaceRange = this.caret.replaceRange;
    EngineSuggestion.insert = this.caret.insert;
    this.addEventListener("focus", () => this.textarea.focus());
    this.textarea.addEventListener("input", (ev) =>
      this.input(ev as InputEvent)
    );
    this.addEventListener("pointerdown", (ev) => this.onPointerDown(ev));
    this.textarea.addEventListener("keydown", (ev) => this.onKeyDown(ev));
    this.textarea.addEventListener("cut", (ev) => this.caret.cut(ev));
    this.textarea.addEventListener("copy", (ev) => this.caret.copy(ev));
    this.textarea.addEventListener("paste", (ev) => {
      ev.clipboardData &&
        this.caret.insert(parse(ev.clipboardData.getData("text/plain"), true));
    });
    this.lines = [new GroupAtom([])];
  }

  connectedCallback(): void {
    this.setAttribute("tabindex", "0");
    this.insertAdjacentElement("afterbegin", this.textarea);
    this.insertAdjacentElement("beforeend", this.field);
    this.dispatchEvent(
      new Event("mount", { cancelable: false, bubbles: true, composed: true })
    );
  }

  set = (latex: string[]) => {
    this.caret.elem.style.height = "0px";
    this.lines.forEach((elem) => {
      elem.elem?.remove();
    });
    this.lines = latex.map((s) => {
      const group = latexToEditableAtom(s);
      if (!group.elem) {
        throw new Error("latexToEditableAtom not working propery");
      }
      group.elem.classList.add("line");
      return group;
    });
    this.lines.forEach(({ elem }) => {
      elem && this.field.insertAdjacentElement("beforeend", elem);
    });
  };

  getLatex = (): string[] => {
    return this.lines.map((line) => Util.serializeGroupAtom(line.body));
  };

  newLine() {
    this.blur();
    const line = new GroupAtom([], true);
    const elem = line.toBox().toHtml();
    elem.classList.add("line");
    this.lines.splice(this.lineIndex + 1, 0, line);
    ++this.lineIndex;
    this.lines[this.lineIndex - 1].elem?.after(elem);
    this.caret.set(this.lines[this.lineIndex], 0);
    this.focus();
  }

  deleteLine() {
    this.lines[this.lineIndex].elem?.remove();
    this.lines.splice(this.lineIndex, 1);
    --this.lineIndex;
    this.caret.set(
      this.lines[this.lineIndex],
      this.lines[this.lineIndex].body.length - 1
    );
    this.focus();
  }

  input(ev: InputEvent) {
    if (!ev.data) {
      Suggestion.reset();
      return;
    }

    if (/^[a-zA-Z*]+/.test(ev.data)) {
      const atoms = parse(ev.data, true);
      this.caret.insert(atoms);
      Suggestion.set(atoms, [this.caret.x(), Util.bottom(this.caret.target)]);
      return;
    }

    Suggestion.reset();
    if (/^[0-9|,]+/.test(ev.data)) {
      this.caret.insert(parse(ev.data, true));
    }
    if (/^[+|-|=]+/.test(ev.data)) {
      this.caret.insert([new SymAtom("bin", ev.data, "Main-R")]);
    }
    if (ev.data === "^") this.caret.addSup();
    if (ev.data === "_") this.caret.addSub();
    if (ev.data === "(") this.caret.addPar();
    Suggestion.reset();
  }

  renderLine = () => {
    let parent: Atom | null = this.caret.target;
    //find current lineIndex
    while (parent.parent !== null) {
      parent = parent.parent;
    }
    this.blur();
    this.lineIndex = this.lines.indexOf(parent as GroupAtom);
    const prev = this.lines[this.lineIndex].elem;
    const elem = this.lines[this.lineIndex].toBox().toHtml();
    elem.classList.add("line");
    this.focus();
    elem && prev?.replaceWith(elem);
  };

  onKeyDown(ev: KeyboardEvent) {
    if (ev.code == "Enter" && EngineSuggestion.view.isOpen()) {
      EngineSuggestion.view.select();
      return;
    }
    if (ev.code == "Enter" && Suggestion.buffer.length > 0) {
      Suggestion.view.select();

      return;
    }
    if (ev.code == "Enter") {
      if (MatrixDestructor.view.isOpen()) {
        return;
      }
      if (MatrixBuilder.view.isOpen()) {
        const mat = this.caret.target.parent as MatrixAtom;
        const [rowNum, colNum] = Builder.getCurRowCol(this.caret.target, mat);
        const [newR, newC] = MatrixBuilder.add(mat, rowNum, colNum);
        MatrixBuilder.reset();
        this.renderLine();
        this.caret.set(mat.children[newR][newC], 0);
        return;
      }

      if (this.caret.isMat()) {
        MatrixBuilder.set(this.caret.x(), Util.bottom(this.caret.target));
      } else {
        this.newLine();
      }
    }
    if (ev.code == "ArrowRight") {
      if (MatrixBuilder.view.isOpen()) {
        MatrixBuilder.view.select("right");
        return;
      }
      if (MatrixDestructor.view.isOpen()) {
        MatrixDestructor.reset();
        return;
      }
      if (Suggestion.view.isOpen()) Suggestion.reset();
      else if (ev.metaKey && ev.shiftKey) this.caret.selectRight();
      else if (ev.shiftKey) this.caret.shiftRight();
      else this.caret.moveRight();
    }
    if (ev.code == "ArrowLeft") {
      if (MatrixBuilder.view.isOpen()) {
        MatrixBuilder.view.select("left");
        return;
      }
      if (MatrixDestructor.view.isOpen()) {
        MatrixDestructor.view.select("left");
        return;
      }
      if (Suggestion.view.isOpen()) Suggestion.reset();
      else if (ev.metaKey && ev.shiftKey) this.caret.selectLeft();
      else if (ev.shiftKey) this.caret.shiftLeft();
      else this.caret.moveLeft();
    }
    if (ev.code == "ArrowDown") {
      if (MatrixBuilder.view.isOpen()) {
        MatrixBuilder.view.select("bottom");
        return;
      }
      if (MatrixDestructor.view.isOpen()) {
        MatrixDestructor.reset();
        return;
      }
      this.caret.setSel(null);
      if (Suggestion.view.isOpen()) Suggestion.view.down();
      else if (
        !this.caret.moveDown() &&
        this.lineIndex !== this.lines.length - 1
      ) {
        this.setLine(this.lineIndex + 1, this.caret.x(), null);
      }
    }
    if (ev.code == "ArrowUp") {
      if (MatrixBuilder.view.isOpen()) {
        MatrixBuilder.view.select("top");
        return;
      }
      if (MatrixDestructor.view.isOpen()) {
        MatrixDestructor.view.select("top");
        return;
      }
      this.caret.setSel(null);
      if (Suggestion.view.isOpen()) Suggestion.view.up();
      else if (!this.caret.moveUp() && this.lineIndex !== 0) {
        this.setLine(this.lineIndex - 1, this.caret.x(), null);
      }
    }
    if (ev.metaKey && ev.code == "KeyZ") {
      ev.shiftKey
        ? redo(this.caret.set, this.caret.setSel)
        : undo(this.caret.set, this.caret.setSel);
    }
    if (ev.code == "Backspace") {
      if (this.lines[this.lineIndex].body.length === 1) {
        if (this.lineIndex !== 0) {
          this.deleteLine();
        }
      } else if (MatrixDestructor.view.isOpen()) {
        const mat = this.caret.target.parent as MatrixAtom;
        const [rowNum, colNum] = Builder.getCurRowCol(this.caret.target, mat);
        const [newR, newC] = MatrixDestructor.remove(mat, rowNum, colNum);
        MatrixDestructor.reset();
        this.renderLine();
        this.caret.set(mat.children[newR][newC], 0);
        return;
      } else if (this.caret.isMat() && this.caret.isFirst()) {
        MatrixDestructor.set(this.caret.x(), Util.bottom(this.caret.target));
      } else {
        this.caret.sel !== null
          ? this.caret.replaceRange(null, this.caret.range())
          : this.caret.delete();
      }
    }
  }
  onPointerDown(ev: PointerEvent) {
    if (ev.shiftKey) return this.caret.extendSel(ev.clientX);
    Suggestion.reset();
    MatrixBuilder.reset();
    MatrixDestructor.reset();
    this.pointAtom([ev.clientX, ev.clientY]);
  }

  setLine(newIndex: number, x: number, y: number | null) {
    this.blur();
    this.lineIndex = newIndex;
    this.focus();
    if (y) {
      this.caret.pointAtom(x, y, this.lines[this.lineIndex]);
    } else {
      this.caret.pointAtomHol(x, this.lines[this.lineIndex]);
    }
  }

  pointAtom(c: [number, number]) {
    this.caret.setSel(null);
    for (const [index, line] of this.lines.entries()) {
      if (c[1] < Util.bottom(line)) {
        return this.setLine(index, c[0], c[1]);
      }
    }
    return this.setLine(this.lines.length - 1, c[0], c[1]);
  }

  focus = () => {
    const { elem } = this.lines[this.lineIndex];
    elem && elem.classList.add("focus");
  };

  blur = () => {
    const { elem } = this.lines[this.lineIndex];
    elem && elem.classList.remove("focus");
  };
}

export default EulerEditor;
if (!customElements?.get("euler-editor"))
  customElements?.define("euler-editor", EulerEditor);
