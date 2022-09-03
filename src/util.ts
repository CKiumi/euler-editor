import { OpAtom } from "euler-tex/src/atom/op";
import {
  AccentAtom,
  ArticleAtom,
  Atom,
  CharAtom,
  FracAtom,
  GroupAtom,
  LRAtom,
  MathBlockAtom,
  MatrixAtom,
  OverlineAtom,
  SectionAtom,
  SqrtAtom,
  SupSubAtom,
  SymAtom,
} from "euler-tex/src/lib";
import { ACC } from "euler-tex/src/parser/command";

export module Util {
  export const parentBlock = (atom: Atom): Atom => {
    let parent = atom.parent;
    while (
      !(parent instanceof ArticleAtom) &&
      !(parent instanceof MathBlockAtom)
    ) {
      if (!parent) throw new Error("Parent Expected");
      parent = parent.parent;
    }
    return parent;
  };

  export const children = (atom: Atom): Atom[] => {
    if (atom instanceof GroupAtom || atom instanceof MathBlockAtom) {
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

  export const isBlockAtom = (
    atom: Atom
  ): atom is MathBlockAtom | SectionAtom | MatrixAtom | ArticleAtom => {
    return (
      atom instanceof MathBlockAtom ||
      atom instanceof SectionAtom ||
      atom instanceof MatrixAtom ||
      atom instanceof ArticleAtom
    );
  };

  export const isSingleBlock = (
    atom: Atom
  ): atom is MathBlockAtom | SectionAtom | ArticleAtom => {
    return (
      atom instanceof MathBlockAtom ||
      atom instanceof SectionAtom ||
      atom instanceof ArticleAtom
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
    throw new Error("target html is not in block");
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

  export const serializeGroupAtom = (atoms: Atom[]): string => {
    return atoms
      .map((atom) => serialize(atom))
      .filter(Boolean)
      .join("");
  };

  export const serialize = (atom: Atom): string => {
    if (atom instanceof CharAtom) {
      return atom.char === "&nbsp;" ? " " : atom.char;
    }
    if (atom instanceof SymAtom) return atom.command ?? atom.char;
    if (atom instanceof MathBlockAtom) {
      if (atom.mode === "display") {
        return "\\[" + serializeGroupAtom(atom.body) + "\\]";
      } else {
        return "$" + serializeGroupAtom(atom.body) + "$";
      }
    }
    if (atom instanceof OpAtom) {
      return "\\" + atom.body + " ";
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
      return `\\left${atom.left.char
        .replace("∣", "|")
        .replace("{", "\\{")}${serializeGroupAtom(
        atom.body.body
      )} \\right${atom.right.char.replace("∣", "|").replace("}", "\\}")}`;
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
      return `\\begin{${atom.type}}${result}\\end{${atom.type}}`;
    }
    return "";
  };
}
