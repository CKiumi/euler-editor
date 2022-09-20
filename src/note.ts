import init from "euler-engine";
import "euler-tex/css/eulertex.css";
import "euler-tex/css/font.css";
import {
  Article,
  Char,
  Display,
  Inline,
  latexToArticle,
  MathGroup,
  MatrixAtom,
  MidAtom,
  parse,
  prarseMath,
  Section,
  setLabels,
  SymAtom,
} from "euler-tex/src/lib";
import { FontMap } from "euler-tex/src/parser/command";
import { Caret } from "./caret/caret";
import { EngineSuggestion } from "./engine";
import { MatrixBuilder, MatrixDestructor } from "./mat/mat";
import { redo, undo } from "./record";
import { Builder } from "./suggest/builder";
import { Suggestion } from "./suggest/suggest";
import { RefView } from "./suggest/view";
import { Util } from "./util";
export { loadFont } from "euler-tex/src/lib";
export class EulerEditor extends HTMLElement {
  textarea: HTMLTextAreaElement;
  field: HTMLElement;
  root: Article = new Article([]);
  caret: Caret;
  fontMode:
    | "mathbb"
    | "mathcal"
    | "mathfrak"
    | "mathscr"
    | "mathsf"
    | "mathtt"
    | "mathit"
    | "mathbf"
    | "mathrm"
    | null = null;
  constructor() {
    super();
    this.append(document.createElement("template").content.cloneNode(true));

    this.field = document.createElement("span");
    this.field.className = "EE_container";

    this.textarea = document.createElement("textarea");
    this.textarea.className = "EE_textarea";
    const ref = new RefView((ref: string) => {
      this.textarea.focus();
      this.caret.insert([
        new SymAtom("ord", ref, ref, ["Main-R"], { ref: true }),
      ]);
    });
    this.field.append(
      this.textarea,
      Suggestion.view.elem,
      MatrixBuilder.view.elem,
      MatrixDestructor.view.elem,
      EngineSuggestion.view.elem,
      ref.elem
    );
    Suggestion.init((font, replace) => {
      this.textarea.focus();
      if (replace === "ref") {
        this.textarea.blur();
        ref.open();
        ref.setList(ref.atomToList(this.root));
        return;
      }
      if (font in FontMap) {
        this.fontMode = font as "mathbb";
        return;
      }
      if (replace === "\\middle|") {
        this.caret.insert([new MidAtom("|")]);
      } else {
        this.caret.insert(
          this.caret.isTextMode() ? parse(replace) : prarseMath(replace)
        );
      }

      this.caret.set(this.caret.target, this.caret.pos - 1);
      this.caret.moveRight();
    });

    this.addEventListener("focusout", () => {
      this.caret.setSel(null);
    });

    const caret = document.createElement("div");
    caret.className = "EE_caret";

    this.field.prepend(caret);

    this.caret = new Caret(caret, this.field, {
      focus: this.focus,
      blur: this.blur,
      render: this.render,
    });
    this.caret.target = this.root;
    Suggestion.insert = this.caret.insert;
    EngineSuggestion.init(async (sympyFn) => {
      this.caret.insert(prarseMath(await sympyFn));
    });
    this.addEventListener("focus", () => this.textarea.focus());
    this.textarea.addEventListener("input", (ev) => {
      console.time("input");
      this.input(ev as InputEvent);
      console.timeEnd("input");
    });

    this.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      console.time("pointerdown");
      this.onPointerDown(ev);
      console.timeEnd("pointerdown");
      this.textarea.focus();
    });
    let lastTime = 0;
    this.addEventListener("pointermove", (ev: PointerEvent) => {
      if (ev.buttons === 1 && ev.timeStamp) {
        if (ev.timeStamp - lastTime < 30) return;
        lastTime = ev.timeStamp;
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
      const atoms = Util.isMathParent(Util.parentBlock(this.caret.cur()))
        ? prarseMath(latex, true)
        : parse(latex);
      this.caret.insert(atoms);
    });
    this.textarea.addEventListener("compositionstart", () => {
      this.textarea.value = "";
    });
    this.textarea.addEventListener("compositionupdate", (ev) => {
      while ((this.caret.cur() as SymAtom).style?.composite) {
        this.caret.target.body.splice(this.caret.pos, 1)[0];
        this.caret.set(this.caret.target, this.caret.pos - 1);
      }
      const atoms = Array.from(ev.data).map(
        (c) => new SymAtom(null, c, c, ["Main-R"], { composite: true })
      );
      this.caret.target.body.splice(this.caret.pos + 1, 0, ...atoms);
      this.render();
      this.caret.set(this.caret.target, this.caret.pos + atoms.length);
    });

    this.textarea.addEventListener("compositionend", (ev) => {
      while ((this.caret.cur() as SymAtom).style?.composite) {
        this.caret.target.body.splice(this.caret.pos, 1)[0];
        this.caret.set(this.caret.target, this.caret.pos - 1);
      }
      this.caret.insert(
        Array.from(ev.data).map((c) => new SymAtom(null, c, c, ["Main-R"]))
      );
    });
    this.set("");
  }

  connectedCallback(): void {
    init().then(() => {
      console.log("Wasm initialized!!");
    });
    this.setAttribute("tabindex", "0");
    this.append(this.field);
    this.textarea.focus();
    this.dispatchEvent(
      new Event("mount", { cancelable: false, bubbles: true, composed: true })
    );
  }

  set = (latex: string) => {
    this.caret.elem.style.height = "0px";
    this.root.elem?.remove();
    this.root = latexToArticle(latex);
    this.root.render();
    if (this.root.elem) {
      this.field.append(this.root.elem);
      setLabels(this.root.elem);
    }
  };

  getLatex = (): string => {
    return this.root.serialize();
  };

  input(ev: InputEvent) {
    if (ev.isComposing) return;
    if (!ev.data) {
      Suggestion.reset();
      return;
    }

    if (ev.data === "\\") {
      if (this.caret.isSectionMode()) return;
      Suggestion.textMode = !!this.caret.isTextMode();
      Suggestion.set();
      Suggestion.open([
        this.caret.x(),
        this.caret.y(),
        this.caret.elem.getBoundingClientRect().top,
      ]);
      return;
    }

    if (this.caret.isTextMode()) {
      if (ev.data === "[") {
        this.caret.insert([
          new Display(new MathGroup([]), null),
          new Char(" ", "Main-R"),
        ]);
        this.render();
        this.caret.moveLeft();
        this.caret.moveLeft();
        this.focus();
        return;
      }
      if (ev.data === "$") {
        this.caret.insert([new Inline([])]);
        this.render();
        this.caret.moveLeft();
        this.focus();
        return;
      }
      const atom = new Char(ev.data, "Main-R");
      this.caret.insert([atom]);
      return;
    }

    if (/^[a-zA-Z*]+/.test(ev.data)) {
      if (this.fontMode) {
        const atoms = prarseMath(`${this.fontMode}{${ev.data}}`, true);
        this.fontMode = null;
        this.caret.insert(atoms);
        return;
      }
      const atoms = prarseMath(ev.data, true);
      this.caret.insert(atoms);

      return;
    }

    Suggestion.reset();
    if (/^[0-9,<>,.]+/.test(ev.data)) {
      this.caret.insert(prarseMath(ev.data, true));
    }

    if (/^[+=]+/.test(ev.data)) {
      this.caret.insert([new SymAtom("bin", ev.data, ev.data, ["Main-R"])]);
    }
    if (ev.data === "-") {
      this.caret.insert([new SymAtom("bin", "−", "-", ["Main-R"])]);
    }

    if (ev.data === "^") this.caret.addSup();
    if (ev.data === "_") this.caret.addSub();
    if (ev.data === "(") this.caret.addPar("(", ")");
    if (ev.data === "{") this.caret.addPar("\\{", "\\}");
    if (ev.data === "[") this.caret.addPar("[", "]");
    if (ev.data === "|") this.caret.addPar("|", "|");
    Suggestion.reset();
  }

  render = () => {
    this.blur();
    Util.parentBlock(this.caret.cur())?.render();
    this.focus();
    setLabels(this.root.elem);
  };

  onKeyDown(ev: KeyboardEvent) {
    this.textarea.style.transform = this.caret.elem.style.transform;
    if (ev.isComposing) return;
    if (ev.code == "Enter" && this.caret.isTextMode()) {
      const atom = new Char("\n", "Main-R");
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
        this.caret.set(mat.rows[newR][newC], 0);
        return;
      }

      if (this.caret.isMat()) {
        MatrixBuilder.set(this.caret.x(), Util.bottom(this.caret.target));
      }
    }
    if (Util.isSelAll(ev)) {
      const atoms = this.root.body;
      this.caret.set(this.root, atoms.length - 1);
      this.caret.setSel([atoms[0], atoms[atoms.length - 1]]);
      return;
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
        const x = this.caret.x();
        const parent = Util.parentBlock(this.caret.cur());
        if (parent instanceof Display || parent instanceof Section) {
          const y = Util.bottom(Util.parentBlock(this.caret.cur())) + 10;
          this.pointAtom([x, y]);
        } else {
          this.pointAtom([x, Util.bottom(this.caret.cur()) + 10]);
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
        const parent = Util.parentBlock(this.caret.cur());
        if (parent instanceof Display || parent instanceof Section) {
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
    Util.isUndo(ev) && undo(this.caret.set, this.caret.setSel);
    if (Util.isRedo(ev)) redo(this.caret.set, this.caret.setSel);

    if (ev.code == "Backspace") {
      if (MatrixDestructor.view.isOpen()) {
        const mat = this.caret.target.parent as MatrixAtom;
        const [rowNum, colNum] = Builder.getCurRowCol(this.caret.target, mat);
        const [newR, newC] = MatrixDestructor.remove(mat, rowNum, colNum);
        MatrixDestructor.reset();
        this.render();
        this.caret.set(mat.rows[newR][newC], 0);
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
    this.caret.sel = null;
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
    if (this.caret.isDisplayMode()) {
      const { elem } = Util.parentBlock(this.caret.cur());
      if (!elem) throw new Error("");
      elem.classList.add("focus");
    }
    if (this.caret.isInlineMode()) {
      const inline = Util.parentBlock(this.caret.cur());
      if (!inline.elem) throw new Error("");
      inline.elem.classList.add("focus");
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
