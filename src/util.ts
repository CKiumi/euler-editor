import { Atom, GroupAtom, SupSubAtom } from "eulertex/src/lib";

export module Util {
  export const children = (atom: Atom): Atom[] => {
    const recursive = (group?: GroupAtom): Atom[] => {
      if (!group) return [];
      return (
        group.body.reduce((prev, cur) => {
          return [...prev, ...children(cur)];
        }, [] as Atom[]) ?? []
      );
    };
    if (atom instanceof SupSubAtom) {
      return [atom, atom.nuc, ...recursive(atom.sup), ...recursive(atom.sub)];
    } else return [atom];
  };
  export const right = (atom: Atom): number => {
    if (!atom.elem) {
      throw new Error("Try to get rect of atom with no element linked");
    }
    return atom.elem.getBoundingClientRect().right;
  };

  export const yCenter = (atom: Atom): number => {
    if (!atom.elem) {
      throw new Error("Try to get rect of atom with no element linked");
    }
    const { top, bottom } = atom.elem.getBoundingClientRect();
    return top + (bottom - top) / 2;
  };
}
