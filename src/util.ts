import {
  AccentAtom,
  Article,
  Atom,
  DisplayAtom,
  InlineAtom,
  LRAtom,
  MatrixAtom,
  OverlineAtom,
  SectionAtom,
  SqrtAtom,
  ThmAtom,
} from "euler-tex/src/lib";

export module Util {
  export const parentBlock = (atom: Atom): Atom => {
    if (atom instanceof Article) return atom;
    let parent = atom.parent;
    while (parent && !isBlockAtom(parent)) {
      parent = parent.parent;
    }
    if (!parent) throw new Error("Parent Expected");
    return parent;
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
  ): atom is InlineAtom | SectionAtom | Article => {
    return (
      atom instanceof InlineAtom ||
      atom instanceof SectionAtom ||
      atom instanceof Article
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

  export const isInBlock = ([x, y]: [number, number], block: HTMLElement) => {
    const rect = block.getBoundingClientRect();
    return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
  };

  export const getLineRects = (
    anchor: HTMLElement,
    target: HTMLElement,
    block: HTMLElement
  ) => {
    const rects = Array.from(block.getClientRects());
    return rects.filter((rect, i) => {
      if (i === 0) {
        return rect.bottom > anchor.getBoundingClientRect().y;
      }
      return (
        rect.bottom > anchor.getBoundingClientRect().y &&
        rects[i - 1].bottom <= target.getBoundingClientRect().y
      );
    });
  };
}
