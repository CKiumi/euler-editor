import "eulertex/css/eulertex.css";
import "eulertex/css/font.css";
import { GroupAtom, parse, SymAtom } from "eulertex/src/lib";
import { Caret } from "./caret";
import { Suggestion } from "./suggest";
import { Util } from "./util";
export class EulerNote extends HTMLElement {
  textarea: HTMLTextAreaElement;
  field: HTMLElement;
  lines: GroupAtom[] = [];
  lineIndex = 0;
  caret: Caret;
  variable = ["a", "\\alpha"];
  constructor() {
    super();
    this.append(document.createElement("template").content.cloneNode(true));
    this.innerHTML =
      "<textarea class='EN_textarea'></textarea><span class='EN_container'><div class='EN_selection'></div><span class='EN_caret'></span></span>";
    this.textarea = this.children[0] as HTMLTextAreaElement;
    this.field = this.children[1] as HTMLElement;
    const sel = this.field.children[0] as HTMLElement;
    this.field.insertAdjacentElement("beforeend", Suggestion.element);
    this.addEventListener("focus", () => {
      this.textarea.focus({ preventScroll: true });
    });
    const caret = this.field.children[1] as HTMLElement;
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
    Suggestion.setUp(this.caret.set, this.caret.replaceRange);
    this.addEventListener("focus", () => this.textarea.focus());
    this.textarea.addEventListener("input", (ev) =>
      this.input(ev as InputEvent)
    );
    this.field.addEventListener("pointerdown", (ev) => this.onPointerDown(ev));
    this.textarea.addEventListener("keydown", (ev) => this.onKeyDown(ev));
    this.textarea.addEventListener("cut", (ev) => this.caret.cut(ev));
    this.textarea.addEventListener("copy", (ev) => this.caret.copy(ev));
    this.textarea.addEventListener("paste", (ev) => {
      ev.clipboardData &&
        this.caret.insert(parse(ev.clipboardData.getData("text/plain")));
    });
    this.lines = [new GroupAtom([])];
  }
  connectedCallback(): void {
    this.setAttribute("tabindex", "0");
    this.dispatchEvent(
      new Event("mount", { cancelable: false, bubbles: true, composed: true })
    );
  }

  set = (latex: string[]) => {
    this.lines = latex.map((s) => {
      const group = new GroupAtom(parse(s));
      const elem = group.toBox().toHtml();
      elem.classList.add("line");
      return group;
    });
    this.lines.forEach(({ elem }) => {
      elem && this.field.insertAdjacentElement("beforeend", elem);
    });
  };

  newLine() {
    this.blur();
    const line = new GroupAtom([]);
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
    if (!ev.data) return;
    if (/^[a-zA-Z*]+/.test(ev.data)) {
      const atoms = parse(ev.data);
      Suggestion.add(atoms, this.variable);
      this.caret.insert(atoms);
      return;
    }
    if (/^[0-9|,]+/.test(ev.data)) {
      this.caret.insert(parse(ev.data));
      return;
    }
    if (/^[+|-|=]+/.test(ev.data)) {
      this.caret.insert([new SymAtom("bin", ev.data, "Main-R")]);
      return;
    }
    Suggestion.reset();
    if (ev.data === "^") this.caret.addSup();
    if (ev.data === "_") this.caret.addSub();
    if (ev.data === "(") this.caret.addPar();
  }

  renderLine = () => {
    const prev = this.lines[this.lineIndex].elem;
    const elem = this.lines[this.lineIndex].toBox().toHtml();
    elem.classList.add("line");
    this.focus();
    elem && prev?.replaceWith(elem);
  };

  onKeyDown(ev: KeyboardEvent) {
    if (ev.code == "Enter" && Suggestion.buffer.length > 0) {
      Suggestion.select();
      return;
    }
    if (ev.code == "Enter") this.newLine();
    if (ev.code == "ArrowRight") {
      if (Suggestion.isOpen()) Suggestion.reset();
      else if (ev.metaKey && ev.shiftKey) this.caret.selectRight();
      else if (ev.shiftKey) this.caret.shiftRight();
      else this.caret.moveRight();
    }
    if (ev.code == "ArrowLeft") {
      if (Suggestion.isOpen()) Suggestion.reset();
      else if (ev.metaKey && ev.shiftKey) this.caret.selectLeft();
      else if (ev.shiftKey) this.caret.shiftLeft();
      else this.caret.moveLeft();
    }
    if (ev.code == "ArrowDown") {
      this.caret.setSel(null);
      if (Suggestion.isOpen()) Suggestion.down();
      else if (
        !this.caret.moveDown() &&
        this.lineIndex !== this.lines.length - 1
      ) {
        this.setLine(this.lineIndex + 1, this.caret.x(), null);
      }
    }
    if (ev.code == "ArrowUp") {
      this.caret.setSel(null);
      if (Suggestion.isOpen()) Suggestion.up();
      else if (!this.caret.moveUp() && this.lineIndex !== 0) {
        this.setLine(this.lineIndex - 1, this.caret.x(), null);
      }
    }
    if (ev.code == "Backspace") {
      if (this.lines[this.lineIndex].body.length === 1) {
        if (this.lineIndex !== 0) {
          this.deleteLine();
        }
      } else {
        this.caret.sel !== null
          ? this.caret.replaceRange([], this.caret.range())
          : this.caret.delete();
      }
    }
  }
  onPointerDown(ev: PointerEvent) {
    if (ev.shiftKey) return this.caret.extendSel(ev.clientX);
    Suggestion.reset();
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
    for (const [index, line] of this.lines.entries())
      if (c[1] < Util.bottom(line)) return this.setLine(index, c[0], c[1]);
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

export default EulerNote;
if (!customElements?.get("euler-note"))
  customElements?.define("euler-note", EulerNote);
