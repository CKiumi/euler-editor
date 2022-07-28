import { Options } from "euler-tex/src/box/style";
import {
  Atom,
  AtomKind,
  Box,
  FirstAtom,
  getSpacing,
  GroupAtom,
  parse,
} from "euler-tex/src/lib";

export const latexToInlineAtom = (latex: string) => {
  const atom = new InlineBlockAtom(parse(latex, true));
  atom.toBox().toHtml();
  return atom;
};

export class CharAtom implements Atom {
  kind: AtomKind = "ord";
  elem: HTMLSpanElement | null = null;
  parent: Atom | null = null;
  constructor(public char: string) {}
  toBox(): CharBox {
    return new CharBox(this.char, this);
  }
}

export class CharBox implements Box {
  rect: Rect = { width: 0, height: 0, depth: 0 };
  space: Space = {};
  constructor(public char: string, public atom?: Atom) {}
  toHtml(): HTMLSpanElement {
    const { char } = this;
    const span = document.createElement("span");
    if (char === "\n") {
      const first = document.createElement("span");
      first.innerHTML = "&#8203;";
      span.append(document.createElement("br"), first);
      if (this.atom) this.atom.elem = span;
      return span;
    }
    span.innerHTML = char;
    if (this.atom) this.atom.elem = span;
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

  toBox(options?: Options): Box {
    const children = this.body.map((atom) => {
      const box = atom.toBox(options);
      atom.parent = this;
      return box;
    });
    return new BlockBox("text", children, this);
  }
}

export class InlineBlockAtom extends GroupAtom {
  kind: AtomKind = "ord";
  elem: HTMLSpanElement | null = null;
  parent: Atom | null = null;

  constructor(public body: Atom[]) {
    super(body);
    this.body = [new FirstAtom(), ...body];
  }

  toBox(options?: Options): Box {
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
    return new BlockBox("inline", children, this);
  }
}

type Space = { left?: number; right?: number; top?: number; bottom?: number };
type Rect = { height: number; depth: number; width: number };

export class BlockBox implements Box {
  rect: Rect = { depth: 0, height: 0, width: 0 };
  space: Space = {};
  constructor(
    public mode: "text" | "inline" | "block",
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
