import {
  AccentAtom,
  Article,
  Atom,
  DisplayAtom,
  FracAtom,
  GroupAtom,
  InlineAtom,
  LRAtom,
  MathGroup,
  MatrixAtom,
  OverlineAtom,
  SectionAtom,
  SqrtAtom,
  SupSubAtom,
  TextGroup,
  ThmAtom,
} from "euler-tex/src/lib";

export module Util {
  const isMac = navigator.userAgent.includes("Mac");

  export const isSelAll = (ev: KeyboardEvent) => {
    if (isMac) return ev.metaKey && ev.code == "KeyA";
    else return ev.ctrlKey && ev.code == "KeyA";
  };

  export const isUndo = (ev: KeyboardEvent) => {
    if (isMac) return ev.metaKey && !ev.shiftKey && ev.code == "KeyZ";
    else return ev.ctrlKey && ev.code == "KeyZ";
  };

  export const isRedo = (ev: KeyboardEvent) => {
    if (isMac) return ev.metaKey && ev.shiftKey && ev.code == "KeyZ";
    else return ev.ctrlKey && ev.code == "KeyY";
  };

  export const parentBlock = (atom: Atom): Atom => {
    if (atom instanceof Article) return atom;
    let parent = atom.parent;
    while (parent && !isBlockAtom(parent)) {
      parent = parent.parent;
    }
    if (!parent) throw new Error("Parent Expected");
    return parent;
  };

  export const isMathParent = (
    atom: Atom | null
  ): atom is InlineAtom | DisplayAtom | MatrixAtom => {
    return (
      atom instanceof InlineAtom ||
      atom instanceof MatrixAtom ||
      atom instanceof DisplayAtom
    );
  };

  export const isSingleBody = (
    atom: Atom | null
  ): atom is LRAtom | SqrtAtom | AccentAtom | OverlineAtom | DisplayAtom => {
    return (
      atom instanceof LRAtom ||
      atom instanceof SqrtAtom ||
      atom instanceof AccentAtom ||
      atom instanceof OverlineAtom ||
      atom instanceof DisplayAtom
    );
  };

  export const isBlockAtom = (
    atom: Atom
  ): atom is
    | InlineAtom
    | ThmAtom
    | DisplayAtom
    | SectionAtom
    | MatrixAtom
    | Article => {
    return (
      atom instanceof InlineAtom ||
      atom instanceof DisplayAtom ||
      atom instanceof SectionAtom ||
      atom instanceof MatrixAtom ||
      atom instanceof ThmAtom ||
      atom instanceof Article
    );
  };

  export const isSingleBlock = (
    atom: Atom
  ): atom is InlineAtom | SectionAtom | Article | ThmAtom => {
    return (
      atom instanceof InlineAtom ||
      atom instanceof SectionAtom ||
      atom instanceof Article ||
      atom instanceof ThmAtom ||
      atom instanceof MathGroup ||
      atom instanceof TextGroup
    );
  };

  export const idLabeled = (a: Atom) => {
    return (
      a instanceof SectionAtom ||
      a instanceof ThmAtom ||
      (a instanceof DisplayAtom && !!a.label) ||
      (a instanceof MatrixAtom && a.type === "align")
    );
  };

  export const firstChild = (atom: Atom): [GroupAtom, number] | null => {
    if (isSingleBody(atom)) return [atom.body, 0];
    if (atom instanceof MatrixAtom) return [atom.rows[0][0], 0];
    if (atom instanceof FracAtom) return [atom.numer, 0];
    if (isSingleBlock(atom)) return [atom, 0];
    if (atom instanceof SupSubAtom) {
      if (atom.nuc instanceof LRAtom) return [atom.nuc.body, 0];
      else if (atom.sup) return [atom.sup, 0];
      else if (atom.sub) return [atom.sub, 0];
      else throw new Error("SupSubAtom must have sup or sub");
    }
    return null;
  };

  export const lastChild = (atom: Atom): [GroupAtom, number] | null => {
    if (isSingleBody(atom)) return [atom.body, atom.body.body.length - 1];
    if (atom instanceof MatrixAtom) {
      const group = atom.rows[0][atom.rows[0].length - 1];
      return [group, group.body.length - 1];
    }
    if (atom instanceof FracAtom)
      return [atom.numer, atom.numer.body.length - 1];
    if (isSingleBlock(atom)) return [atom, atom.body.length - 1];
    if (atom instanceof SupSubAtom) {
      if (atom.sup) return [atom.sup, atom.sup.body.length - 1];
      else if (atom.sub) return [atom.sub, atom.sub.body.length - 1];
      else throw new Error("SupSubAtom must have sup or sub");
    }
    return null;
  };

  export const right = (atom: Atom): number => {
    if (!atom.elem) {
      throw new Error("Try to get rect of atom with no element linked");
    }
    return atom.elem.getBoundingClientRect().right;
  };

  export const left = (atom: Atom): number => {
    if (!atom.elem) {
      throw new Error("Try to get rect of atom with no element linked");
    }
    return atom.elem.getBoundingClientRect().left;
  };

  export const top = (atom: Atom): number => {
    if (!atom.elem) {
      throw new Error("Try to get rect of atom with no element linked");
    }
    return atom.elem.getBoundingClientRect().top;
  };

  export const bottom = (atom: Atom): number => {
    if (!atom.elem) {
      throw new Error("Try to get rect of atom with no element linked");
    }
    return atom.elem.getBoundingClientRect().bottom;
  };

  export const isInRect = (
    atom: Atom,
    coord: [x: number, y: number]
  ): boolean => {
    if (!atom.elem) {
      throw new Error("Try to get rect of atom with no element linked");
    }
    const [x, y] = coord;
    const { top, bottom, right, left } = atom.elem.getBoundingClientRect();
    return top < y && bottom > y && right > x && left < x;
  };

  export const height = (atom: Atom): number => {
    if (!atom.elem) {
      throw new Error("Try to get rect of atom with no element linked");
    }
    return atom.elem.getBoundingClientRect().height;
  };

  export const yCenter = (atom: Atom): number => {
    if (!atom.elem) {
      throw new Error("Try to get rect of atom with no element linked");
    }
    const { top, bottom } = atom.elem.getBoundingClientRect();
    return top + (bottom - top) / 2;
  };

  export const getLineRects = (
    anchor: HTMLElement,
    target: HTMLElement,
    block: HTMLElement
  ) => {
    const rects = Array.from(block.getClientRects());
    return rects.filter((rect, i) => {
      if (i === 0) return rect.bottom > anchor.getBoundingClientRect().y;
      return (
        rect.bottom > anchor.getBoundingClientRect().y &&
        rects[i - 1].bottom <= target.getBoundingClientRect().y
      );
    });
  };
}
