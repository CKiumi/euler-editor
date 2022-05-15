import { Atom, FirstAtom, GroupAtom, SupSubAtom } from "eulertex/src/lib";
import { Util } from "./util";

export class Caret {
  target: Target;
  constructor(
    public elem: HTMLElement,
    public field: HTMLElement,
    public render: () => void
  ) {
    this.target = new Target(new GroupAtom([]));
  }

  cur() {
    return this.target.atom.body[this.target.pos];
  }

  set = (): true => {
    const { elem } = this.cur();
    if (!elem) throw new Error("Element not found in current pointed atom");
    const rect = elem.getBoundingClientRect();
    if (!elem.parentElement) throw new Error("Parent element not found");
    const parentRect = elem.parentElement.getBoundingClientRect();
    const [x, y] = this.toReltiveCoord([rect.x + rect.width, parentRect.y]);
    if (parentRect.height) {
      this.elem.style.cssText = `height:${parentRect.height * 1.4}px; 
        transform:translate(${x - 1}px,${y - parentRect.height * 0.2}px)`;
    } else {
      this.elem.style.cssText = `height:${10}px; 
        transform:translate(${x}px,${y - 10}px)`;
    }
    this.elem.classList.remove("EN_caret");
    this.elem.offsetWidth;
    this.elem.classList.add("EN_caret");
    return true;
  };

  setAtoms(atoms: GroupAtom) {
    this.target.atom = atoms;
  }

  insert(atoms: Atom[]) {
    atoms.forEach((atom) => {
      atom.parent = this.target.atom;
    });
    this.target.atom.body.splice(this.target.pos + 1, 0, ...atoms);
    this.target.pos = this.target.pos + atoms.length;
    this.render();
    this.set();
  }

  moveRight() {
    if (this.target.isLast()) {
      if (this.target.isSup() || this.target.isSub()) {
        this.target.exitSupSub();
      }
    } else {
      ++this.target.pos;
      const cur = this.cur();
      if (cur instanceof SupSubAtom) {
        if (cur.sup) {
          this.target.set(cur.sup, 0);
        } else if (cur.sub) {
          this.target.set(cur.sub, 0);
        } else {
          throw new Error("SupSubAtom must have sup or sub");
        }
      }
    }
    this.set();
  }

  moveLeft() {
    const cur = this.cur();
    if (this.target.isFirst()) {
      if (this.target.isSup() || this.target.isSub()) {
        this.target.exitSupSub();
        --this.target.pos;
      }
    } else {
      if (cur instanceof SupSubAtom) {
        if (cur.sup) {
          this.target.set(cur.sup, cur.sup.body.length - 1);
        } else if (cur.sub) {
          this.target.set(cur.sub, cur.sub.body.length - 1);
        } else {
          throw new Error("SupSubAtom must have sup or sub");
        }
      } else {
        --this.target.pos;
      }
    }
    this.set();
  }

  delete() {
    if (this.target.isFirst()) {
      if (this.target.isSup() && this.target.atom.body.length === 1) {
        this.moveRight();
        const supsub = this.cur() as SupSubAtom;
        if (supsub.sub) {
          supsub.sup = undefined;
        } else {
          this.delete();
          this.insert([supsub.nuc]);
        }
      }
      if (this.target.isSub() && this.target.atom.body.length === 1) {
        this.moveRight();
        const supsub = this.cur() as SupSubAtom;
        if (supsub.sup) {
          supsub.sub = undefined;
        } else {
          this.delete();
          this.insert([supsub.nuc]);
        }
      }
      this.set();
      return;
    }
    this.target.atom.body.splice(this.target.pos, 1);
    --this.target.pos;
    this.set();
  }

  toReltiveCoord(coord: [number, number]): [number, number] {
    const fieldRect = this.field.getBoundingClientRect();
    return [coord[0] - fieldRect.x, coord[1] - fieldRect.y];
  }

  pointAtom = (x: number, y: number, atoms: Atom[]) => {
    let i = 1;
    while (atoms[i + 1] && Util.right(atoms[i]) < x) {
      i++;
    }
    const atom = [atoms[i - 1], ...Util.children(atoms[i])].reduce(
      (prev, cur) => {
        if (
          distance([Util.right(cur), Util.yCenter(cur)], [x, y]) <=
          distance([Util.right(prev), Util.yCenter(prev)], [x, y])
        ) {
          return cur;
        } else return prev;
      }
    );
    const parent = atom.parent as GroupAtom;
    if (parent) {
      this.target.set(parent, parent.body.indexOf(atom));
      this.set();
    }
  };

  addSup() {
    const atom = this.cur();
    if (atom instanceof FirstAtom) return;
    const isSupBox = atom instanceof SupSubAtom && !atom.sup;
    const newSupSub = isSupBox
      ? new SupSubAtom(atom.nuc, new GroupAtom([]), atom.sub)
      : new SupSubAtom(atom, new GroupAtom([]));
    this.delete();
    this.insert([newSupSub]);
    this.moveLeft();
  }

  addSub() {
    const atom = this.cur();
    if (atom instanceof FirstAtom) return;
    const isSubBox = atom instanceof SupSubAtom && !atom.sub;
    const sub = new GroupAtom([]);
    const newSupSub = isSubBox
      ? new SupSubAtom(atom.nuc, atom.sup, sub)
      : new SupSubAtom(atom, undefined, sub);
    this.delete();
    this.insert([newSupSub]);
    this.target.set(sub, 0);
    this.set();
  }
}

class Target {
  constructor(public atom: GroupAtom, public pos = 0) {}
  set(atom: GroupAtom, pos: number) {
    [this.atom, this.pos] = [atom, pos];
  }

  isSup() {
    if (!(this.atom.parent instanceof SupSubAtom)) return false;
    return this.atom === this.atom.parent.sup;
  }

  isSub() {
    if (!(this.atom.parent instanceof SupSubAtom)) return false;
    return this.atom === this.atom.parent.sub;
  }

  isFirst() {
    return this.pos === 0;
  }

  isLast() {
    return this.pos === this.atom.body.length - 1;
  }

  exitSupSub() {
    const supsub = this.atom.parent;
    if (!(supsub instanceof SupSubAtom)) {
      throw new Error(
        "Try exit from sup, however counld not find SupSubAtom as parent"
      );
    }
    if (!(supsub.parent instanceof GroupAtom)) {
      throw new Error(
        "Try exit from sup, however counld not find parent of SupSubAtom"
      );
    }
    const newAtom = supsub.parent;
    this.set(newAtom, newAtom.body.indexOf(supsub));
  }
}

const distance = (c0: [x: number, y: number], c1: [x: number, y: number]) =>
  Math.pow(Math.abs(c1[0] - c0[0]), 2) + Math.pow(Math.abs(c1[1] - c0[1]), 2);
