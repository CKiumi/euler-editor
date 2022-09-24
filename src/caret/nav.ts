import { Article, Atom, Block, Char, Group, Theorem } from "euler-tex/src/lib";
import { Util } from "../util";

export module Pointer {
  export const pointText = (
    x: number,
    y: number,
    group: Article | Theorem
  ): [Block, number | null] => {
    const atoms = group.body;
    if (atoms.length === 1) return [group, 0];
    //search for line
    let i = 0;
    for (const [index, atom] of atoms.entries()) {
      if (!isVisible(atom)) {
        if (i === 0) continue;
        break;
      }
      if (y < Util.bottom(atom)) {
        i = index;
        break;
      }
      if (index === atoms.length - 1) return [group, index];
      if (isNewLine(atom, atoms[index + 1])) i = index + 1;
    }
    let prevDistance = Infinity;

    //after line break
    if (atoms[i] instanceof Char) {
      const rect = Util.rect(atoms[i]);
      if (x < rect.right - rect.width / 2) return [group, i - 1];
    }

    for (let index = i; index < atoms.length; index++) {
      const atom = atoms[index];
      if (Util.isBlockAtom(atom) && Util.isInRect(atom, [x, y])) {
        return [atom, null];
      }
      const newDistance = d(atom, [x, y]);
      if (newDistance < prevDistance) {
        prevDistance = newDistance;
        i = index;
      }
      if (index === atoms.length - 1) return [group, i];
      if (isNewLine(atom, atoms[index + 1])) break;
    }
    return [group, i];
  };

  export const nearestAtom = (
    x: number,
    y: number,
    atoms: Atom[]
  ): [Group & Atom, number] => {
    const atom = atoms.reduce((prev, cur) => {
      if (d(cur, [x, y]) <= d(prev, [x, y])) return cur;
      else return prev;
    });
    const parent = atom.parent as Group & Atom;
    return [parent, parent.body.indexOf(atom)];
  };

  const isNewLine = (atom: Atom, next: Atom): boolean => {
    return Util.bottom(atom) < Util.top(next);
  };

  export const isVisible = (atom: Atom) => {
    const rect = atom.elem?.getBoundingClientRect();
    if (!rect) return false;
    return rect.bottom >= 0 && rect.top <= window.innerHeight;
  };

  export const d = (atom: Atom, c: [x: number, y: number]) => {
    const [x, y] = [Util.right(atom), Util.yCenter(atom)];
    return Math.pow(Math.abs(c[0] - x), 2) + Math.pow(Math.abs(c[1] - y), 2);
  };
}
