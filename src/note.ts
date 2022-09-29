import init from "euler-engine";
import "euler-tex/css/eulertex.css";
import "euler-tex/css/font.css";
import {
  Article,
  Atom,
  Char,
  Display,
  Inline,
  latexToArticle,
  MatrixAtom,
  MidAtom,
  parse,
  prarseMath,
  Ref,
  Section,
  setLabels,
  SymAtom,
  Theorem,
} from "euler-tex/src/lib";
import { FontMap } from "euler-tex/src/parser/command";
import { Caret } from "./caret/caret";
import { Engine } from "./engine";
import { KeyBoard } from "./keyboard";
import { MatBuilder, MatDestructor } from "./mat/mat";
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
  engineRunning = false;
  compositions: Atom[] = [];
  fontMode: keyof typeof FontMap | null = null;
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
        this.caret.isTextMode()
          ? new Ref(ref, null)
          : new SymAtom("ord", ref, ref, ["Main-R"], { ref: true }),
      ]);
    });

    this.field.append(
      this.textarea,
      KeyBoard.elem,
      Suggestion.view.elem,
      MatBuilder.view.elem,
      MatDestructor.view.elem,
      Engine.view.elem,
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
      setLabel: this.setLabel,
    });
    this.caret.target = this.root;
    Engine.init(async (sympyFn) => {
      this.engineRunning = true;
      this.caret.insert(prarseMath(await sympyFn));
      this.engineRunning = false;
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
        if (ev.timeStamp - lastTime < 20) return;
        lastTime = ev.timeStamp;
        console.time("all");
        this.caret.extendSel(ev.clientX, ev.clientY);
        console.timeEnd("all");
      }
    });
    this.textarea.addEventListener("keydown", (ev) => this.onKeyDown(ev));
    this.textarea.addEventListener("cut", (ev) => {
      ev.preventDefault();
      ev.clipboardData?.setData("text/plain", this.caret.getValue());
      this.caret.replace(null, this.caret.range());
    });
    this.textarea.addEventListener("copy", (ev) => {
      ev.preventDefault();
      ev.clipboardData?.setData("text/plain", this.caret.getValue());
    });
    this.textarea.addEventListener("paste", (ev) => {
      const latex = ev.clipboardData
        ? ev.clipboardData.getData("text/plain")
        : "";
      this.insert(latex);
    });
    this.textarea.addEventListener("compositionstart", () => {
      this.textarea.value = "";
    });
    this.textarea.addEventListener("compositionupdate", (ev) => {
      let pos = this.caret.pos;
      const { length } = this.compositions;
      Util.del(this.caret.target, pos - length + 1, length);
      pos -= length;
      const atoms = Array.from(ev.data).map((c) => {
        return this.caret.isTextMode()
          ? new Char(c === " " ? "\u00A0" : c, null)
          : new SymAtom("ord", c, c, ["Main-R"]);
      });
      Util.insert(this.caret.target, pos, atoms);
      this.compositions = atoms;
      atoms.forEach((atom) => {
        atom.elem && (atom.elem.style.textDecoration = "underline");
      });
      pos += atoms.length;
      this.caret.set(this.caret.target, pos);
    });

    this.textarea.addEventListener("compositionend", (ev) => {
      let pos = this.caret.pos;
      const { length } = this.compositions;
      Util.del(this.caret.target, pos - length + 1, length);
      pos -= length;
      this.caret.set(this.caret.target, pos);
      this.caret.insert(
        Array.from(ev.data).map((c) => {
          return this.caret.isTextMode()
            ? new Char(c === " " ? "\u00A0" : c, null)
            : new SymAtom("ord", c, c, ["Main-R"]);
        })
      );
      this.compositions = [];
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
    this.caret.set(this.root, this.root.body.length - 1);
  };

  getLatex = (): string => {
    return this.root.serialize();
  };

  insert = (latex: string) => {
    const atoms = this.caret.isTextMode()
      ? parse(latex)
      : prarseMath(latex, true);
    this.caret.insert(atoms);
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
      if (ev.data === "$") {
        this.caret.insert([new Inline([])]);
        this.caret.moveLeft();
        this.focus();
        return;
      }
      const atom = new Char(ev.data === " " ? "\u00A0" : ev.data, null);
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

  setLabel = () => {
    setLabels(this.root.elem);
  };

  onKeyDown(ev: KeyboardEvent) {
    console.log(ev.key, ev.metaKey, ev.shiftKey);
    const cmd = KeyBoard.getCmd(ev);
    this.getAttribute("show-key") && KeyBoard.print(cmd, ev);
    this.textarea.style.transform = this.caret.elem.style.transform;
    if (ev.isComposing) return;

    if (cmd === "enter") {
      if (this.caret.isTextMode()) {
        const atom = new Char("\n", "Main-R");
        this.caret.insert([atom]);
      }
      if (Engine.view.isOpen()) {
        Engine.view.select();
      }
      if (MatDestructor.view.isOpen()) return;

      if (MatBuilder.view.isOpen()) {
        const mat = this.caret.target.parent as MatrixAtom;
        const [rowNum, colNum] = Builder.getCurRowCol(this.caret.target, mat);
        const [newR, newC] = MatBuilder.add(mat, rowNum, colNum);
        Util.render(this.caret.target);
        MatBuilder.reset();
        this.caret.set(mat.rows[newR][newC], 0);
        return;
      }
      if (Util.isMat(this.caret.target)) {
        MatBuilder.set(this.caret.x(), Util.bottom(this.caret.target));
      }
    }
    if (cmd === "selA") {
      const atoms = this.root.body;
      this.caret.set(this.root, atoms.length - 1);
      this.caret.setSel([atoms[0], atoms[atoms.length - 1]]);
    }
    if (cmd === "extR") this.caret.shiftRight();
    if (cmd === "selR") this.caret.selectRight();

    if (cmd === "right") {
      if (MatBuilder.view.isOpen()) {
        MatBuilder.view.select("right");
        return;
      }
      if (MatDestructor.view.isOpen()) {
        MatDestructor.reset();
        return;
      }
      if (Suggestion.view.isOpen()) Suggestion.reset();
      else {
        this.blur();
        this.caret.moveRight();
        this.focus();
      }
    }
    if (cmd === "extL") this.caret.shiftLeft();
    if (cmd === "selL") this.caret.selectLeft();
    if (cmd === "left") {
      if (MatBuilder.view.isOpen()) {
        MatBuilder.view.select("left");
        return;
      }
      if (MatDestructor.view.isOpen()) {
        MatDestructor.view.select("left");
        return;
      }
      if (Suggestion.view.isOpen()) Suggestion.reset();
      else {
        this.blur();
        this.caret.moveLeft();
        this.focus();
      }
      return;
    }
    if (cmd === "extD") {
      const prev = this.caret.sel?.[0] ?? this.caret.cur();
      this.caret.pointInBlock(
        this.caret.x(),
        Util.bottom(this.caret.cur()) + 20,
        this.caret.target
      );
      this.caret.setSel([prev, this.caret.cur()]);
      return;
    }
    if (cmd === "down") {
      if (Engine.view.isOpen()) {
        Engine.view.down();
        return;
      }
      if (MatBuilder.view.isOpen()) {
        MatBuilder.view.select("bottom");
        return;
      }
      if (MatDestructor.view.isOpen()) MatDestructor.reset();
      if (!this.caret.moveDown()) {
        const x = this.caret.x();
        const parent = Util.parentBlock(this.caret.cur());
        if (parent instanceof Display || parent instanceof Section) {
          this.point([x, Util.bottom(parent) + 10]);
        } else {
          this.point([x, Util.bottom(this.caret.cur()) + 10]);
        }
        return;
      }
    }
    if (cmd === "extU") {
      const prev = this.caret.sel?.[0] ?? this.caret.cur();
      this.caret.pointInBlock(
        this.caret.x(),
        Util.top(this.caret.cur()) - 20,
        this.caret.target
      );
      this.caret.setSel([prev, this.caret.cur()]);
    }
    if (cmd === "up") {
      if (Engine.view.isOpen()) {
        Engine.view.up();
        return;
      }
      if (MatBuilder.view.isOpen()) {
        MatBuilder.view.select("top");
        return;
      }
      if (MatDestructor.view.isOpen()) {
        MatDestructor.view.select("top");
        return;
      }
      if (!this.caret.moveUp()) {
        const parent = Util.parentBlock(this.caret.cur());
        if (parent instanceof Display || parent instanceof Section) {
          this.point([this.caret.x(), Util.top(parent) - 10]);
        } else {
          this.point([this.caret.x(), Util.top(this.caret.cur()) - 20]);
        }
        return;
      }
    }
    cmd === "undo" && this.caret.undo();
    cmd === "redo" && this.caret.redo();

    if (cmd === "del") {
      if (MatDestructor.view.isOpen()) {
        const mat = this.caret.target.parent as MatrixAtom;
        const [rowNum, colNum] = Builder.getCurRowCol(this.caret.target, mat);
        const [newR, newC] = MatDestructor.remove(mat, rowNum, colNum);
        MatDestructor.reset();
        Util.render(this.caret.target);
        this.caret.set(mat.rows[newR][newC], 0);
        return;
      } else if (Util.isMat(this.caret.target) && this.caret.isFirst()) {
        MatDestructor.set(this.caret.x(), Util.bottom(this.caret.target));
      } else {
        this.caret.sel !== null
          ? this.caret.replace(null, this.caret.range())
          : this.caret.delete();
      }
    }
  }
  onPointerDown(ev: PointerEvent) {
    if (ev.shiftKey) return this.caret.extendSel(ev.clientX, ev.clientY);
    Suggestion.reset();
    MatBuilder.reset();
    MatDestructor.reset();
    this.caret.sel = null;
    this.point([ev.clientX, ev.clientY]);
  }

  point(c: [number, number]) {
    this.blur();
    this.caret.setSel(null);
    return this.caret.point(c[0], c[1], this.root);
  }

  focus = () => {
    const block = Util.parentBlock(this.caret.cur());
    if (block instanceof Article || block instanceof Theorem) return;
    block.elem.classList.add("focus");
  };

  blur = () => {
    const elems = document.querySelectorAll(".focus");
    elems.forEach((e) => e.classList.remove("focus"));
  };
}

export default EulerEditor;
if (!customElements?.get("euler-editor"))
  customElements?.define("euler-editor", EulerEditor);
