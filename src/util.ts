import { OpAtom } from "euler-tex/src/atom/op";
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
import {
  ACC,
  BlockOp,
  LETTER1,
  LETTER2,
  LETTER3,
} from "euler-tex/src/parser/command";

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

  export const parseText = (latex: string) => {
    const atom = new GroupAtom(
      latex
        .split("")
        .map(
          (char) =>
            new SymAtom("ord", char === " " ? "&nbsp;" : char, ["Main-R"])
        ),
      true
    );
    const html = atom.toBox().toHtml();
    html.className = "text";
    return atom;
  };

  export const isInBlock = ([x, y]: [number, number], block: HTMLElement) => {
    const rects = Array.from(block.getClientRects());
    for (const rect of rects) {
      if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
        return true;
      }
    }
    return false;
  };

  export const getLineRect = (target: HTMLElement, block: HTMLElement) => {
    const rects = Array.from(block.getClientRects());
    const y =
      target.getBoundingClientRect().y +
      target.getBoundingClientRect().height / 2;
    for (const rect of rects) {
      if (y > rect.top && y < rect.bottom) {
        return rect;
      }
    }
    console.log(rects);
    throw new Error("target html is not in block");
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
      if (atom.char === "−") return "-";
      result = Object.keys(LETTER1).find((key) => LETTER1[key] === atom.char);
      if (result) return result;
      result = Object.keys(LETTER2).find((key) => LETTER2[key] === atom.char);
      if (result) return result;
      result = Object.keys(LETTER3).find((key) => LETTER3[key] === atom.char);
      if (result) return result;
      result = Object.keys(BlockOp).find((key) => BlockOp[key] === atom.char);
      if (result) return result;
      return atom.char;
    }
    if (atom instanceof OpAtom) {
      return "\\" + atom.body;
    }
    if (atom instanceof SqrtAtom) {
      return `\\sqrt{${serializeGroupAtom(atom.body.body)}}`;
    }
    if (atom instanceof FracAtom) {
      return `\\frac{${serializeGroupAtom(
        atom.numer.body
      )}}{${serializeGroupAtom(atom.denom.body)}}`;
    }
    if (atom instanceof OverlineAtom) {
      return `\\overline{${serializeGroupAtom(atom.body.body)}}`;
    }
    if (atom instanceof AccentAtom) {
      const command = Object.keys(ACC).find(
        (key) => ACC[key] === atom.accent.char
      );
      return `${command}{${serializeGroupAtom(atom.body.body)}}`;
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

export module Builder {
  export const getCurRowCol = (atom: GroupAtom, mat: MatrixAtom) => {
    for (const [rowIndex, row] of mat.children.entries()) {
      const column = row.indexOf(atom);
      if (column !== -1) return [rowIndex, column];
    }
    return [0, 0];
  };

  export const addRow = (mat: MatrixAtom, pos: number) => {
    if (pos < 0 || pos > mat.children.length) {
      throw new Error("Try to add row in invalid position");
    }
    const length = Math.max(...mat.children.map((row) => row.length));
    const newRow = Array(length)
      .fill(1)
      .map(() => new GroupAtom([], true));
    mat.children.splice(pos, 0, newRow);
  };

  export const addColumn = (mat: MatrixAtom, pos: number) => {
    const length = Math.max(...mat.children.map((row) => row.length));
    if (pos < 0 || pos > length) {
      throw new Error("Try to add column in invalid position");
    }
    mat.children.forEach((row) => {
      row.splice(pos, 0, new GroupAtom([], true));
    });
  };

  export const deleteRow = (mat: MatrixAtom, pos: number) => {
    if (mat.children.length === 1) return;
    if (pos < 0 || pos > mat.children.length - 1) {
      throw new Error("Try to add row in invalid position");
    }
    mat.children.splice(pos, 1);
  };

  export const deleteCol = (mat: MatrixAtom, pos: number) => {
    const length = Math.max(...mat.children.map((row) => row.length));
    if (length === 1) return;
    if (pos < 0 || pos > length - 1) {
      throw new Error("Try to add row in invalid position");
    }
    mat.children.forEach((row) => {
      row.splice(pos, 1);
    });
  };
}
