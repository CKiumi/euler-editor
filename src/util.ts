import { Atom, GroupAtom, LRAtom, SupSubAtom } from "eulertex/src/lib";

export module Util {
  export const children = (atom: Atom): Atom[] => {
    if (atom instanceof SupSubAtom) {
      return [atom, ...recursive(atom.sup), ...recursive(atom.sub)];
    } else if (atom instanceof LRAtom) {
      return [atom, ...recursive(atom.body)];
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
}
