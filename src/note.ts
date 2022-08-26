import init from "euler-engine";
import "euler-tex/css/eulertex.css";
import "euler-tex/css/font.css";
import { Options } from "euler-tex/src/box/style";
import {
  CharAtom,
  FracAtom,
  GroupAtom,
  latexToArticle,
  latexToEditableAtoms,
  MathBlockAtom,
  MatrixAtom,
  parse,
  SymAtom,
} from "euler-tex/src/lib";
import { Caret } from "./caret";
import { MatrixBuilder, MatrixDestructor } from "./mat";
import { redo, undo } from "./record";
import { EngineSuggestion, Suggestion } from "./suggest/suggest";
import { Builder, Util } from "./util";
export { loadFont } from "euler-tex/src/lib";
export class EulerEditor extends HTMLElement {
  textarea: HTMLTextAreaElement;
  field: HTMLElement;
  root: GroupAtom = new GroupAtom([]);
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
    Suggestion.init(() => {
      this.textarea.focus();
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
    });
    this.addEventListener("focusout", () => {
      this.caret.setSel(null);
      this.render();
    });

    const caret = document.createElement("div");
    caret.className = "EE_caret";

    this.field.insertAdjacentElement("afterbegin", caret);

    this.caret = new Caret(caret, this.field, {
      focus: this.focus,
      blur: this.blur,
      render: this.render,
    });

    Suggestion.insert = this.caret.insert;
    EngineSuggestion.insert = this.caret.insert;
    this.addEventListener("focus", () => this.textarea.focus());
    this.textarea.addEventListener("input", (ev) =>
      this.input(ev as InputEvent)
    );

    this.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      this.onPointerDown(ev);
      this.textarea.focus({ preventScroll: true });
    });
    this.addEventListener("pointermove", (ev: PointerEvent) => {
      if (ev.buttons === 1 && ev.timeStamp) {
        this.caret.extendSel(ev.clientX, ev.clientY);
      }
    });
    this.textarea.addEventListener("keydown", (ev) => this.onKeyDown(ev));
    this.textarea.addEventListener("cut", (ev) => this.caret.cut(ev));
    this.textarea.addEventListener("copy", (ev) => this.caret.copy(ev));
    this.textarea.addEventListener("paste", (ev) => {
      const latex = ev.clipboardData
        ? ev.clipboardData.getData("text/plain")
        : "";
      const atoms =
        Util.parentBlock(this.caret.cur()) instanceof MathBlockAtom
          ? parse(latex, true)
          : latexToEditableAtoms(latex);
      this.caret.insert(atoms);
    });
    this.textarea.addEventListener("compositionstart", () => {
      this.textarea.value = "";
      this.textarea.style.transform = this.caret.elem.style.transform;
    });
    this.textarea.addEventListener("compositionupdate", (ev) => {
      while ((this.caret.cur() as CharAtom).composite) {
        this.caret.target.body.splice(this.caret.pos, 1)[0];
        this.caret.set(this.caret.target, this.caret.pos - 1);
      }
      const atoms = Array.from(ev.data).map((c) => new CharAtom(c, true));
      this.caret.target.body.splice(this.caret.pos + 1, 0, ...atoms);
      this.render();
      this.caret.set(this.caret.target, this.caret.pos + atoms.length);
    });

    this.textarea.addEventListener("compositionend", (ev) => {
      while ((this.caret.cur() as CharAtom).composite) {
        this.caret.target.body.splice(this.caret.pos, 1)[0];
        this.caret.set(this.caret.target, this.caret.pos - 1);
      }
      this.caret.insert(Array.from(ev.data).map((c) => new CharAtom(c)));
    });
    this.set("");
  }

  connectedCallback(): void {
    EngineSuggestion.loadSympy();
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
    this.root.elem?.remove();
    this.root = latexToArticle(latex);
    this.root.toBox(new Options()).toHtml();
    this.root.elem &&
      this.field.insertAdjacentElement("beforeend", this.root.elem);
  };

  getLatex = (): string => {
    return Util.serializeGroupAtom(this.root.body);
  };

  input(ev: InputEvent) {
    if (ev.isComposing) return;
    if (!ev.data) {
      Suggestion.reset();
      return;
    }
    if (this.caret.isTextMode()) {
      if (ev.data === "[") {
        this.caret.insert([
          new MathBlockAtom(parse("", true), "display"),
          new CharAtom(" "),
        ]);
        this.render();
        this.caret.moveLeft();
        this.caret.moveLeft();
        this.focus();
        return;
      }
      if (ev.data === "$") {
        this.caret.insert([new MathBlockAtom(parse("", true), "inline")]);
        this.render();
        this.caret.moveLeft();
        this.focus();
        return;
      }
      const atom = new CharAtom(ev.data);
      this.caret.insert([atom]);
      return;
    }

    if (ev.data === "\\") {
      Suggestion.set([this.caret.x(), Util.bottom(this.caret.target)]);
      return;
    }

    if (/^[a-zA-Z*]+/.test(ev.data)) {
      const atoms = parse(ev.data, true);
      this.caret.insert(atoms);
      return;
    }

    Suggestion.reset();
    if (/^[0-9,<>,.]+/.test(ev.data)) {
      this.caret.insert(parse(ev.data, true));
    }

    if (/^[+=]+/.test(ev.data)) {
      this.caret.insert([new SymAtom("bin", ev.data, ["Main-R"])]);
    }
    if (ev.data === "-") {
      this.caret.insert([new SymAtom("bin", "−", ["Main-R"])]);
    }

    if (ev.data === "^") this.caret.addSup();
    if (ev.data === "_") this.caret.addSub();
    if (ev.data === "(") this.caret.addPar("(", ")");
    if (ev.data === "{") this.caret.addPar("{", "}");
    if (ev.data === "[") this.caret.addPar("[", "]");
    if (ev.data === "|") this.caret.addPar("∣", "∣");
    Suggestion.reset();
  }

  render = () => {
    this.blur();
    const prev = this.root.elem;
    const elem = this.root.toBox(new Options()).toHtml();
    if (prev) elem.className = prev.className;
    this.focus();
    elem && prev?.replaceWith(elem);
  };

  onKeyDown(ev: KeyboardEvent) {
    if (ev.isComposing) return;
    if (ev.code == "Enter" && this.caret.isTextMode()) {
      const atom = new CharAtom("\n");
      this.caret.insert([atom]);
      return;
    }
    if (ev.code == "Enter" && EngineSuggestion.view.isOpen()) {
      EngineSuggestion.view.select();
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
        this.render();
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
      else {
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
      else {
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

      if (ev.shiftKey) {
        const prev = this.caret.sel?.[0] ?? this.caret.cur();
        this.caret.pointAtom(
          this.caret.x(),
          Util.bottom(this.caret.cur()) + 20,
          this.caret.target,
          false
        );
        this.caret.setSel([prev, this.caret.cur()]);
      } else if (!this.caret.moveDown()) {
        if (this.caret.isDisplayMode()) {
          this.pointAtom([
            this.caret.x(),
            Util.bottom(Util.parentBlock(this.caret.cur())) + 10,
          ]);
        } else {
          this.pointAtom([this.caret.x(), Util.bottom(this.caret.cur()) + 20]);
        }
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

      if (ev.shiftKey) {
        const prev = this.caret.sel?.[0] ?? this.caret.cur();
        this.caret.pointAtom(
          this.caret.x(),
          Util.top(this.caret.cur()) - 20,
          this.caret.target,
          false
        );
        this.caret.setSel([prev, this.caret.cur()]);
      } else if (!this.caret.moveUp()) {
        if (this.caret.isDisplayMode()) {
          this.pointAtom([
            this.caret.x(),
            Util.top(Util.parentBlock(this.caret.cur())) - 10,
          ]);
        } else {
          this.pointAtom([this.caret.x(), Util.top(this.caret.cur()) - 20]);
        }
        return;
      }
    }
    if (ev.metaKey && ev.code == "KeyZ") {
      ev.shiftKey
        ? redo(this.caret.set, this.caret.setSel)
        : undo(this.caret.set, this.caret.setSel);
    }
    if (ev.code == "Backspace") {
      if (MatrixDestructor.view.isOpen()) {
        const mat = this.caret.target.parent as MatrixAtom;
        const [rowNum, colNum] = Builder.getCurRowCol(this.caret.target, mat);
        const [newR, newC] = MatrixDestructor.remove(mat, rowNum, colNum);
        MatrixDestructor.reset();
        this.render();
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
    if (ev.shiftKey) return this.caret.extendSel(ev.clientX, ev.clientY);
    Suggestion.reset();
    MatrixBuilder.reset();
    MatrixDestructor.reset();
    this.pointAtom([ev.clientX, ev.clientY]);
  }

  pointAtom(c: [number, number]) {
    this.blur();
    this.caret.setSel(null);
    if (!this.root.elem) throw new Error("Expect elem");
    return this.caret.pointAtom(c[0], c[1], this.root, true);
  }

  focus = () => {
    if (this.caret.isTextMode()) return;
    if (this.caret.isDisplayMode() || this.caret.isInlineMode()) {
      const { elem } = Util.parentBlock(this.caret.cur());
      if (!elem) throw new Error("");
      elem.classList.add("focus");
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
