import { Options } from "euler-tex/src/box/style";
import {
  Atom,
  AtomKind,
  Box,
  FirstAtom,
  getSpacing,
  GroupAtom,
  HBox,
  parse,
} from "euler-tex/src/lib";

export const latexToInlineAtom = (latex: string) => {
  const atom = new MathBlockAtom(parse(latex, true), "inline");
  atom.toBox().toHtml();
  return atom;
};

export const latexToDisplayAtom = (latex: string) => {
  const atom = new MathBlockAtom(parse(latex, true), "display");
  atom.toBox().toHtml();
  return atom;
};
export const latexToAlignAtom = (latex: string) => {
  const atom = new MathBlockAtom(
    parse("\\begin{aligned}" + latex + "\\end{aligned}", true),
    "display"
  );
  atom.toBox().toHtml();
  return atom;
};

export class CharAtom implements Atom {
  kind: AtomKind = "ord";
  elem: HTMLSpanElement | null = null;
  parent: Atom | null = null;
  constructor(public char: string, public composite?: boolean) {
    if (char === " ") this.char = "&nbsp;";
  }
  toBox(): CharBox {
    return new CharBox(this.char, this, this.composite);
  }
}

export class CharBox implements Box {
  rect: Rect = { width: 0, height: 0, depth: 0 };
  space: Space = {};
  constructor(
    public char: string,
    public atom: Atom,
    public composite?: boolean
  ) {}
  toHtml(): HTMLSpanElement {
    const { char } = this;
    const span = document.createElement("span");
    if (char === "\n") {
      const first = document.createElement("span");
      first.innerHTML = "&#8203;";
      span.append(document.createElement("br"), first);
      this.atom.elem = span;
      return span;
    }
    span.innerHTML = char;
    if (this.composite) span.style.textDecoration = "underline";
    this.atom.elem = span;
    return span;
  }
}

export class TextBlockAtom extends GroupAtom {
  kind: AtomKind = "ord";
  elem: HTMLSpanElement | null = null;
  parent: Atom | null = null;

  constructor(public body: Atom[]) {
    super(body);
    this.body = [new FirstAtom(), ...body];
  }

  toBox(options?: Options): HBox {
    const children = this.body.map((atom) => {
      const box = atom.toBox(options);
      atom.parent = this;
      return box;
    });
    return new BlockBox("text", children, this);
  }
}

export class MathBlockAtom extends GroupAtom {
  kind: AtomKind = "ord";
  elem: HTMLSpanElement | null = null;
  parent: Atom | null = null;

  constructor(public body: Atom[], public mode: "display" | "inline") {
    super(body);
    this.body = [new FirstAtom(), ...body];
  }

  toBox(options?: Options): HBox {
    let prevKind: AtomKind | null;
    const children = this.body.map((atom) => {
      const box = atom.toBox(options);
      atom.parent = this;
      if (prevKind && atom.kind) {
        box.space.left =
          (box.space.left ?? 0) + getSpacing(prevKind, atom.kind);
      }
      prevKind = atom.kind;
      return box;
    });
    return new BlockBox(this.mode, children, this);
  }
}

type Space = { left?: number; right?: number; top?: number; bottom?: number };
type Rect = { height: number; depth: number; width: number };

export class BlockBox implements Box {
  rect: Rect = { depth: 0, height: 0, width: 0 };
  space: Space = {};
  constructor(
    public mode: "text" | "inline" | "display",
    public children: Box[],
    public atom?: Atom,
    public multiplier?: number
  ) {}

  toHtml(): HTMLSpanElement {
    const span = document.createElement("span");
    span.classList.add(this.mode);
    this.children.forEach((box) => {
      span.append(box.toHtml());
    });
    if (this.children.length === 1) {
      const space = document.createElement("span");
      space.innerHTML = "&nbsp;";
      span.append(space);
    }
    if (this.atom) this.atom.elem = span;
    return span;
  }
}
