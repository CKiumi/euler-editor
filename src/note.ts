import init from "euler-engine";
import "euler-tex/css/eulertex.css";
import "euler-tex/css/font.css";
import {
  Atom,
  FracAtom,
  GroupAtom,
  latexToEditableAtom,
  MatrixAtom,
  parse,
  SymAtom,
} from "euler-tex/src/lib";
import { latexToBlocks } from "euler-tex/src/parser/textParser";
import { CharAtom, latexToInlineAtom } from "./atom";
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

    const caret = document.createElement("div");
    caret.className = "EE_caret";

    this.field.insertAdjacentElement("afterbegin", caret);

    this.caret = new Caret(caret, this.field, {
      focus: this.focus,
      blur: this.blur,
      render: this.renderLine,
    });

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
    this.set("");
  }

  connectedCallback(): void {
    init().then(() => {
      console.log("Wasm initialized!!");
    });
    this.setAttribute("tabindex", "0");
    this.insertAdjacentElement("afterbegin", this.textarea);
    this.insertAdjacentElement("beforeend", this.field);
    this.dispatchEvent(
      new Event("mount", { cancelable: false, bubbles: true, composed: true })
    );
  }

  set = (latex: string) => {
    this.caret.elem.style.height = "0px";
    this.lines.forEach((elem) => {
      elem.elem?.remove();
    });
    this.lines = [];
    let texts: Atom[] = [];
    latexToBlocks(latex).forEach(({ mode, latex }) => {
      if (mode === "text") {
        const atoms = latex
          .split("")
          .map((char) => new CharAtom(char === " " ? "&nbsp;" : char));
        texts.push(...atoms);
        return;
      }
      if (mode === "inline") {
        texts.push(latexToInlineAtom(latex));
        return;
      }
      this.lines.push(Util.parseText(texts));
      texts = [];
      const group = latexToEditableAtom(latex, mode);
      this.lines.push(group);
    });
    if (texts.length != 0) {
      this.lines.push(Util.parseText(texts));
    }
    if (
      this.lines.length !== 0 &&
      !this.lines[this.lines.length - 1].elem?.classList.contains("text")
    ) {
      this.lines.push(Util.parseText(texts));
    }

    this.lines.forEach(({ elem }) => {
      elem && this.field.insertAdjacentElement("beforeend", elem);
    });
  };

  getLatex = (): string => {
    return this.lines
      .map((line) => {
        if (line.elem?.classList.contains("display")) {
          return String.raw`\[${Util.serializeGroupAtom(line.body)}\]`;
        }
        return Util.serializeGroupAtom(line.body);
      })
      .join("");
  };

  curLine = () => this.lines[this.lineIndex];

  newDisplay() {
    this.blur();
    const atom = latexToEditableAtom("", "display");

    if (this.lineIndex === this.lines.length - 1) {
      const text = Util.parseText([]);
      this.lines.splice(this.lineIndex + 1, 0, atom, text);
      ++this.lineIndex;
      atom.elem &&
        text.elem &&
        this.lines[this.lineIndex - 1].elem?.after(atom.elem, text.elem);
    } else {
      this.lines.splice(this.lineIndex + 1, 0, atom);
      ++this.lineIndex;
      atom.elem && this.lines[this.lineIndex - 1].elem?.after(atom.elem);
    }
    this.caret.set(this.curLine(), 0);
    this.focus();
  }

  deleteLine() {
    this.curLine().elem?.remove();
    this.lines.splice(this.lineIndex, 1);
    --this.lineIndex;
    this.caret.set(this.curLine(), this.curLine().body.length - 1);
    this.focus();
  }

  input(ev: InputEvent) {
    if (!ev.data) {
      Suggestion.reset();
      return;
    }
    if (this.caret.isTextMode()) {
      if (ev.data === "[") {
        this.newDisplay();
        return;
      }
      if (ev.data === "$") {
        this.caret.insert([latexToInlineAtom("")]);
        this.renderLine();
        this.caret.moveLeft();
        this.focus();
        return;
      }
      const atom = new CharAtom(ev.data === " " ? "&nbsp;" : ev.data);
      this.caret.insert([atom]);
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

    if (/^[+|=]+/.test(ev.data)) {
      this.caret.insert([new SymAtom("bin", ev.data, ["Main-R"])]);
    }
    if (ev.data === "-") {
      this.caret.insert([new SymAtom("bin", "−", ["Main-R"])]);
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
    const prev = this.curLine().elem;
    const elem = this.curLine().toBox().toHtml();
    if (prev) elem.className = prev.className;
    this.focus();
    elem && prev?.replaceWith(elem);
  };

  onKeyDown(ev: KeyboardEvent) {
    if (ev.code == "Enter" && this.caret.isTextMode()) {
      const atom = new CharAtom("\n");
      this.caret.insert([atom]);
      return;
    }
    if (ev.code == "Enter" && EngineSuggestion.view.isOpen()) {
      EngineSuggestion.view.select();
      return;
    }
    if (ev.code == "Enter" && Suggestion.buffer.length > 0) {
      Suggestion.view.select();
      const atom = this.caret.cur();
      if (Util.isSingleBody(atom)) {
        this.caret.moveLeft();
      }
      if (atom instanceof FracAtom) {
        this.caret.moveLeft();
      }
      if (atom instanceof MatrixAtom) {
        this.caret.set(atom.children[0][0], 0);
      }
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
      else if (
        this.caret.sel === null &&
        this.caret.target === this.curLine() &&
        this.caret.pos === this.curLine().body.length - 1 &&
        this.lineIndex != this.lines.length - 1
      ) {
        this.caret.set(this.lines[this.lineIndex + 1], 0);
        this.lineIndex += 1;
      } else {
        this.blur();
        this.caret.moveRight();
        this.focus();
      }
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
      else if (
        this.caret.sel === null &&
        this.caret.target === this.curLine() &&
        this.caret.pos === 0 &&
        this.lineIndex != 0
      ) {
        this.caret.set(
          this.lines[this.lineIndex - 1],
          this.lines[this.lineIndex - 1].body.length - 1
        );
        this.lineIndex -= 1;
      } else {
        this.blur();
        this.caret.moveLeft();
        this.focus();
      }
    }
    if (ev.code == "ArrowDown") {
      if (EngineSuggestion.view.isOpen()) {
        EngineSuggestion.view.down();
        return;
      }
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
      else if (!this.caret.moveDown()) {
        if (
          Util.bottom(this.lines[this.lines.length - 1]) <
          Util.bottom(this.caret.cur()) + 20
        )
          return;
        this.pointAtom([this.caret.x(), Util.bottom(this.caret.cur()) + 20]);
        this.caret.setSel(null);
        return;
      }
    }
    if (ev.code == "ArrowUp") {
      if (EngineSuggestion.view.isOpen()) {
        EngineSuggestion.view.up();
        return;
      }
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
      else if (!this.caret.moveUp()) {
        if (this.caret.isDisplayMode()) {
          this.pointAtom([
            this.caret.x(),
            Util.bottom(this.lines[this.lineIndex - 1]) - 10,
          ]);
        } else {
          this.pointAtom([this.caret.x(), Util.top(this.caret.cur()) - 20]);
        }

        this.caret.setSel(null);
        return;
      }
    }
    if (ev.metaKey && ev.code == "KeyZ") {
      ev.shiftKey
        ? redo(this.caret.set, this.caret.setSel)
        : undo(this.caret.set, this.caret.setSel);
    }
    if (ev.code == "Backspace") {
      if (this.curLine().body.length === 1) {
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
    if (y) {
      this.caret.pointAtom(x, y, this.curLine());
    } else {
      this.caret.pointAtomHol(x, this.curLine());
    }
    this.focus();
  }

  pointAtom(c: [number, number]) {
    this.caret.setSel(null);
    for (const [index, line] of this.lines.entries()) {
      if (!line.elem) throw new Error("Expect elem");
      const { bottom } = line.elem.getBoundingClientRect();
      if (bottom > c[1]) {
        const rects = Array.from(line.elem.getClientRects());
        for (const rect of rects) {
          if (rect.right < c[0] && rect.bottom > c[1] && rect.top < c[1]) {
            return this.setLine(index, rect.right, rect.top);
          }
        }
        return this.setLine(index, c[0], c[1]);
      }
    }

    const lastBlock = this.lines[this.lines.length - 1];
    return this.caret.set(lastBlock, lastBlock.body.length - 1);
  }

  focus = () => {
    if (this.caret.isTextMode()) return;
    const { elem } = this.curLine();
    if (!elem) throw new Error("");
    if (this.caret.isDisplayMode()) {
      elem.classList.add("focus");
      return;
    }
    if (this.caret.isInlineMode()) {
      this.caret.target.elem?.classList.add("focus");
    }
  };

  blur = () => {
    let elem = document.getElementsByClassName("inline focus");
    elem[0] && elem[0].classList.remove("focus");
    elem = document.getElementsByClassName("display focus");
    elem[0] && elem[0].classList.remove("focus");
  };
}

export default EulerEditor;
if (!customElements?.get("euler-editor"))
  customElements?.define("euler-editor", EulerEditor);
