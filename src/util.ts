import {
  AccentAtom,
  Atom,
  GroupAtom,
  LRAtom,
  MatrixAtom,
  OverlineAtom,
  SqrtAtom,
  SupSubAtom,
  SymAtom,
} from "euler-tex/src/lib";
import { LETTER1, LETTER2 } from "euler-tex/src/parser/command";

export module Util {
  export const children = (atom: Atom): Atom[] => {
    if (atom instanceof SupSubAtom) {
      return [
        atom,
        ...children(atom.nuc),
        ...recursive(atom.sup),
        ...recursive(atom.sub),
      ];
    } else if (
      atom instanceof LRAtom ||
      atom instanceof SqrtAtom ||
      atom instanceof AccentAtom ||
      atom instanceof OverlineAtom
    ) {
      return [atom, ...recursive(atom.body)];
    } else if (atom instanceof MatrixAtom) {
      const children = atom.children.reduce(
        (prev, cur) =>
          cur.reduce((prev2, cur2) => [...prev2, ...cur2.body], prev),
        [] as Atom[]
      );
      return [atom, ...children];
    } else return [atom];
  };

  const recursive = (group?: GroupAtom): Atom[] => {
    if (!group) return [];
    const init: Atom[] = [];
    return group.body.reduce((prev, cur) => [...prev, ...children(cur)], init);
  };

  export const right = (atom: Atom): number => {
    if (!atom.elem) {
      throw new Error("Try to get rect of atom with no element linked");
    }
    return atom.elem.getBoundingClientRect().right;
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

  export const serializeGroupAtom = (atoms: Atom[]): string => {
    return atoms
      .map((atom) => serialize(atom))
      .filter(Boolean)
      .join(" ");
  };

  export const serialize = (atom: Atom): string => {
    if (atom instanceof SymAtom) {
      let result;
      result = Object.keys(LETTER1).find((key) => LETTER1[key] === atom.char);
      if (result) return result;
      result = Object.keys(LETTER2).find((key) => LETTER1[key] === atom.char);
      if (result) return result;
      return atom.char;
    }
    if (atom instanceof SqrtAtom) {
      return `\\sqrt{${serializeGroupAtom(atom.body.body)}}`;
    }
    if (atom instanceof OverlineAtom) {
      return `\\overline{${serializeGroupAtom(atom.body.body)}}`;
    }
    if (atom instanceof AccentAtom) {
      if (atom.accent.char === "^") {
        return `\\hat{${serializeGroupAtom(atom.body.body)}}`;
      }
      if (atom.accent.char === "~") {
        return `\\tilde{${serializeGroupAtom(atom.body.body)}}`;
      }
    }
    if (atom instanceof LRAtom) {
      return `\\left(${serializeGroupAtom(atom.body.body)} \\right)`;
    }
    if (atom instanceof SupSubAtom) {
      let [sup, sub] = ["", ""];
      if (atom.sup) sup = `^{${serializeGroupAtom(atom.sup.body)}}`;
      if (atom.sub) sub = `_{${serializeGroupAtom(atom.sub.body)}}`;
      return `${serialize(atom.nuc)}${sub}${sup}`;
    }
    if (atom instanceof MatrixAtom) {
      let result = "";
      for (let row = 0; row < atom.children.length; row++) {
        for (let col = 0; col < atom.children[row].length; col++) {
          if (col > 0) result += " & ";
          result += serializeGroupAtom(atom.children[row][col].body);
        }
        if (row < atom.children.length - 1) {
          result += " \\\\ ";
        }
      }
      return `\\begin{pmatrix}${result}\\end{pmatrix}`;
    }
    return "";
  };
}
