import {
  Align,
  Article,
  Atom,
  Block,
  Char,
  Display,
  FracAtom,
  Group,
  Inline,
  LRAtom,
  MathGroup,
  MatrixAtom,
  Section,
  SupSubAtom,
  TextGroup,
  Theorem,
} from "euler-tex/src/lib";

export module Util {
  export const parentBlock = (atom: Atom): Block => {
    if (atom instanceof Article) return atom;
    let parent = atom.parent;
    while (parent && !isBlockAtom(parent)) {
      parent = parent.parent;
    }
    if (!parent) throw new Error("Parent Block Expected");
    return parent;
  };

  export const parentMatrix = (atom: Atom): MatrixAtom | null => {
    let res: Atom | null = atom.parent;
    while (!(res instanceof MatrixAtom)) {
      if (!res) return null;
      res = res.parent;
    }
    return res;
  };

  export const isMathParent = (
    atom: Atom | null
  ): atom is Inline | Display | Align => {
    return (
      atom instanceof Inline || atom instanceof Align || atom instanceof Display
    );
  };

  export const isSingleBody = (
    atom: Atom | null
  ): atom is Atom & { body: MathGroup } => {
    return (atom as LRAtom).body instanceof MathGroup;
  };

  export const isBlockAtom = (atom: Atom): atom is Block => {
    return atom instanceof Block;
  };

  export const isBreakAtom = (atom: Atom) => {
    return (
      (atom as Char).char === "\n" ||
      atom instanceof Display ||
      atom instanceof Align ||
      atom instanceof Section ||
      atom instanceof Theorem
    );
  };

  export const isSingleBlock = (atom: Atom): atom is Atom & Group => {
    return Array.isArray((atom as Inline).body);
  };

  export const idLabeled = (a: Atom) => {
    return (
      a instanceof Section ||
      a instanceof Theorem ||
      (a instanceof Display && !!a.label) ||
      (a instanceof Align && !!a.labels)
    );
  };

  export const isInlineGroup = (atom: Atom) => {
    return (
      atom instanceof MathGroup ||
      atom instanceof Inline ||
      atom instanceof TextGroup
    );
  };

  export const firstChild = (atom: Atom): [Group & Atom, number] | null => {
    if (isSingleBody(atom)) return [atom.body, 0];
    if (atom instanceof MatrixAtom) return [atom.rows[0][0], 0];
    if (atom instanceof Align) return [atom.body.rows[0][0], 0];
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

  export const lastChild = (atom: Atom): [Group, number] | null => {
    if (isSingleBody(atom)) return [atom.body, atom.body.body.length - 1];
    if (atom instanceof Align) return lastChild(atom.body);
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

  export const insert = (target: Group & Atom, pos: number, atoms: Atom[]) => {
    target.body.splice(pos + 1, 0, ...atoms);
    if (target instanceof Article) {
      atoms.forEach((atom, i) => {
        target.body[pos + i].elem?.insertAdjacentElement(
          "afterend",
          (atom as Block).render()
        );
        atom.parent = target;
      });
    } else parentBlock(target.body[pos]).render();
  };

  export const del = (
    target: Group & Atom,
    pos: number,
    num: number
  ): Atom[] => {
    const atoms = target.body.splice(pos, num);
    if (target instanceof Article) {
      atoms.forEach((atom) => atom.elem?.remove());
    } else parentBlock(target.body[0]).render();
    return atoms;
  };

  export const rect = (atom: Atom): DOMRect => {
    if (!atom.elem) {
      throw new Error("Try to get rect of atom with no element linked");
    }
    return atom.elem.getBoundingClientRect();
  };

  export const right = (atom: Atom): number => {
    return rect(atom).right;
  };

  export const left = (atom: Atom): number => {
    return rect(atom).left;
  };

  export const top = (atom: Atom): number => {
    return rect(atom).top;
  };

  export const bottom = (atom: Atom): number => {
    return rect(atom).bottom;
  };

  export const isInRect = (
    atom: Atom,
    coord: [x: number, y: number]
  ): boolean => {
    const [x, y] = coord;
    const { top, bottom, right, left } = rect(atom);
    return top < y && bottom > y && right > x && left < x;
  };

  export const height = (atom: Atom): number => {
    return rect(atom).height;
  };

  export const yCenter = (atom: Atom): number => {
    const { top, bottom } = rect(atom);
    return top + (bottom - top) / 2;
  };

  export const getLineRects = (
    anchor: Element,
    target: Element,
    block: Element
  ) => {
    const anchorY = anchor.getBoundingClientRect().y;
    const targetY = target.getBoundingClientRect().y;
    const rects = Array.from(block.getClientRects());
    return rects.filter((rect, i) => {
      if (i === 0) return rect.bottom > anchorY;
      return rect.bottom > anchorY && rects[i - 1].bottom <= targetY;
    });
  };
}
