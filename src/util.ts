import {
  AccentAtom,
  Atom,
  FracAtom,
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
    if (atom instanceof GroupAtom) {
      return atom.body.flatMap((atom) => children(atom));
    } else if (atom instanceof SupSubAtom) {
      const nucs = children(atom.nuc);
      nucs.pop();
      return [
        ...nucs,
        ...(atom.sup ? children(atom.sup) : []),
        ...(atom.sub ? children(atom.sub) : []),
        atom,
      ];
    } else if (atom instanceof FracAtom) {
      return [...children(atom.denom), ...children(atom.numer), atom];
    } else if (isSingleBody(atom)) {
      return [...children(atom.body), atom];
    } else if (atom instanceof MatrixAtom) {
      const rows = atom.children.flatMap((row) =>
        row.flatMap((group) => children(group))
      );
      return [...rows, atom];
    } else return [atom];
  };

  export const isSingleBody = (
    atom: Atom | null
  ): atom is LRAtom | SqrtAtom | AccentAtom | OverlineAtom => {
    return (
      atom instanceof LRAtom ||
      atom instanceof SqrtAtom ||
      atom instanceof AccentAtom ||
      atom instanceof OverlineAtom
    );
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
      result = Object.keys(LETTER2).find((key) => LETTER2[key] === atom.char);
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
