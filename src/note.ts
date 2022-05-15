import "eulertex/css/eulertex.css";
import "eulertex/css/font.css";
import { GroupAtom, parse, SymAtom } from "eulertex/src/lib";
import { Caret } from "./caret";
export class EulerNote extends HTMLElement {
  textarea: HTMLTextAreaElement;
  field: HTMLElement;
  atoms: GroupAtom;
  line: HTMLSpanElement;
  caret: Caret;
  constructor() {
    super();
    this.append(document.createElement("template").content.cloneNode(true));
    this.innerHTML =
      "<textarea class='EN_textarea'></textarea><span class='EN_container'><div class='EN_selection'></div><span class='EN_caret'></span></span>";
    this.textarea = this.children[0] as HTMLTextAreaElement;
    this.field = this.children[1] as HTMLElement;
    this.caret = new Caret(
      this.field.children[1] as HTMLElement,
      this.field,
      this.render
    );
    this.addEventListener("focus", () => this.textarea.focus());
    this.textarea.addEventListener("input", (ev) =>
      this.input(ev as InputEvent)
    );
    this.field.addEventListener("pointerdown", (ev) => this.onPointerDown(ev));
    this.textarea.addEventListener("keydown", (ev) => this.onKeyDown(ev));

    this.line = document.createElement("span");
    this.line.className = "line";
    this.field.insertAdjacentElement("beforeend", this.line);
    this.atoms = new GroupAtom([]);
  }
  connectedCallback(): void {
    this.setAttribute("tabindex", "0");
    this.dispatchEvent(
      new Event("mount", { cancelable: false, bubbles: true, composed: true })
    );
  }

  set = (latex: string) => {
    this.atoms = new GroupAtom(parse(latex));
    this.caret.setAtoms(this.atoms);
    this.render();
  };

  input(ev: InputEvent) {
    if (!ev.data) return;
    if (/^[a-zA-Z*]+/.test(ev.data)) {
      const atoms = parse(ev.data);
      this.caret.insert(atoms);
    }
    if (/^[0-9|,]+/.test(ev.data)) {
      this.caret.insert(parse(ev.data));
    }
    if (/^[+|-]+/.test(ev.data)) {
      this.caret.insert([new SymAtom("bin", ev.data, "Main-R")]);
    }
    if (ev.data === "^") this.caret.addSup();
    if (ev.data === "_") this.caret.addSub();
    // if (ev.data === "(") this.caret.addPar();
  }

  render = () => {
    this.line.innerHTML = "";
    this.line.append(this.atoms.toBox().toHtml());
  };

  onKeyDown(ev: KeyboardEvent) {
    if (ev.code == "ArrowRight") {
      this.caret.moveRight();
    }
    if (ev.code == "ArrowLeft") {
      this.caret.moveLeft();
    }
    if (ev.code == "Backspace") {
      this.caret.delete();
      this.render();
    }
  }
  onPointerDown(ev: PointerEvent) {
    this.caret.pointAtom(ev.clientX, ev.clientY, this.atoms.body);
  }
}

export default EulerNote;
if (!customElements?.get("euler-note"))
  customElements?.define("euler-note", EulerNote);
