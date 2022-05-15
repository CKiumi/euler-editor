import {
  Atom,
  FirstAtom,
  GroupAtom,
  LRAtom,
  SupSubAtom,
} from "eulertex/src/lib";
import { Util } from "./util";

export type Sel = [anchor: number, offset: number];
type Action = { focus: () => void; blur: () => void; render: () => void };
export class Caret {
  sel: Sel | null = null;
  constructor(
    public elem: HTMLElement,
    public field: HTMLElement,
    public action: Action,
    public selElem: HTMLElement,
    public target: GroupAtom = new GroupAtom([]),
    public pos: number = 0
  ) {
    this.elem.style.height = "0";
  }

  cur() {
    return this.target.body[this.pos];
  }

  renderCaret = (): true => {
    const { elem } = this.cur();
    if (!elem) throw new Error("Element not found in current pointed atom");
    const rect = elem.getBoundingClientRect();
    if (!elem.parentElement) throw new Error("Parent element not found");
    const parentRect = elem.parentElement.getBoundingClientRect();
    const [x, y] = this.toReltiveCoord([rect.x + rect.width, parentRect.y]);
    if (parentRect.height) {
      this.elem.style.cssText = `height:${parentRect.height}px; 
        transform:translate(${x - 1}px,${y}px)`;
    } else {
      this.elem.style.cssText = `height:${10}px; 
        transform:translate(${x}px,${y - 10}px)`;
    }
    this.elem.classList.remove("EN_caret");
    this.elem.offsetWidth;
    this.elem.classList.add("EN_caret");
    return true;
  };

  range() {
    if (!this.sel)
      throw new Error("sel must be specified when calling renge()");
    return [...this.sel].sort((a, b) => a - b) as [a: number, b: number];
  }

  setSel = (sel: [anchlor: number, offset: number] | null) => {
    this.selElem.style.width = "0px";
    this.sel = sel;
    sel === null ? this.action.focus() : this.action.blur();
    if (this.sel === null) return;
    const [start, last] = this.range().map((i) => this.target?.body[i]);
    const [relX, relY] = this.toReltiveCoord([
      Util.right(start),
      Util.top(this.target),
    ]);
    this.selElem.style.height = `${Util.height(this.target)}px`;
    this.selElem.style.transform = `translate(${relX}px,${relY}px)`;
    this.selElem.style.width = `${Util.right(last) - Util.right(start)}px`;
  };

  setAtoms(atoms: GroupAtom) {
    this.target = atoms;
  }

  insert(atoms: Atom[]) {
    if (this.sel !== null) return this.replaceRange(atoms);
    this.target.body.splice(this.pos + 1, 0, ...atoms);
    this.action.render();
    this.set(this.target, this.pos + atoms.length);
  }

  moveRight() {
    if (this.sel !== null) {
      this.set(this.target, this.range()[1]);
      this.setSel(null);
      return;
    }
    if (this.isLast()) {
      if (this.isSup() || this.isSub()) {
        this.exitSupSub();
      } else if (this.isBody()) {
        this.exitBody();
      }
    } else {
      ++this.pos;
      const cur = this.cur();
      if (cur instanceof SupSubAtom) {
        if (cur.sup) {
          this.set(cur.sup, 0);
        } else if (cur.sub) {
          this.set(cur.sub, 0);
        } else {
          throw new Error("SupSubAtom must have sup or sub");
        }
      } else if (cur instanceof LRAtom) {
        this.set(cur.body, 0);
      }
    }
    this.renderCaret();
  }

  moveLeft() {
    if (this.sel !== null) {
      this.set(this.target, this.range()[0]);
      this.setSel(null);
      return;
    }
    const cur = this.cur();
    if (this.isFirst()) {
      if (this.isSup() || this.isSub()) {
        this.exitSupSub();
        this.set(this.target, this.pos - 1);
      } else if (this.isBody()) {
        this.exitBody();
        this.set(this.target, this.pos - 1);
      }
    } else {
      if (cur instanceof SupSubAtom) {
        if (cur.sup) {
          this.set(cur.sup, cur.sup.body.length - 1);
        } else if (cur.sub) {
          this.set(cur.sub, cur.sub.body.length - 1);
        } else {
          throw new Error("SupSubAtom must have sup or sub");
        }
      } else if (cur instanceof LRAtom) {
        this.set(cur.body, cur.body.body.length - 1);
      } else {
        this.set(this.target, this.pos - 1);
      }
    }
  }

  shiftRight() {
    if (this.isLast()) return;
    const pos = this.pos;
    this.set(this.target, pos + 1);
    this.setSel(this.sel === null ? [pos, pos + 1] : [this.sel[0], pos + 1]);
  }

  shiftLeft() {
    if (this.isFirst()) return;
    const pos = this.pos;
    this.set(this.target, pos - 1);
    this.setSel(this.sel === null ? [pos, pos - 1] : [this.sel[0], pos - 1]);
  }

  selectLeft() {
    const pos = this.pos;
    this.setSel(this.sel === null ? [pos, 0] : [this.sel[0], 0]);
    this.set(this.target, 0);
  }

  selectRight() {
    const pos = this.pos;
    const last = this.target.body.length - 1;
    this.setSel(this.sel === null ? [pos, last] : [this.sel[0], last]);
    this.set(this.target, last);
  }

  extendSel = (x: number) => {
    const start = this.sel?.[0] ?? this.pos;
    this.pointAtomHol(x, this.target);
    const last = this.pos;
    this.setSel([start, last]);
  };

  replaceRange(newAtoms?: Atom[]) {
    const range = this.range();
    this.target.body.splice(range[0] + 1, Math.abs(range[1] - range[0]));
    if (newAtoms) {
      this.target.body.splice(range[0] + 1, 0, ...newAtoms);
      this.action.render();
      this.set(this.target, range[0] + 1);
    } else {
      this.action.render();
      this.set(this.target, range[0]);
    }
    this.setSel(null);
  }

  delete() {
    if (this.isFirst()) {
      if (this.isSup() && this.isEmpty()) {
        this.moveRight();
        const supsub = this.cur() as SupSubAtom;
        if (supsub.sub) {
          supsub.sup = undefined;
        } else {
          this.delete();
          this.insert([supsub.nuc]);
        }
      }
      if (this.isSub() && this.isEmpty()) {
        this.moveRight();
        const supsub = this.cur() as SupSubAtom;
        if (supsub.sup) {
          supsub.sub = undefined;
        } else {
          this.delete();
          this.insert([supsub.nuc]);
        }
      }
      return;
    }
    this.target.body.splice(this.pos, 1);
    this.action.render();
    this.set(this.target, this.pos - 1);
  }

  toReltiveCoord(coord: [number, number]): [number, number] {
    const fieldRect = this.field.getBoundingClientRect();
    return [coord[0] - fieldRect.x, coord[1] - fieldRect.y];
  }

  pointAtomHol = (x: number, target: GroupAtom) => {
    this.setSel(null);
    let i = 0;
    while (
      target.body[i + 1] &&
      (Util.right(target.body[i]) + Util.right(target.body[i + 1])) / 2 < x
    ) {
      i++;
    }
    this.set(target, i);
    this.renderCaret();
  };

  pointAtom = (x: number, y: number, group: GroupAtom) => {
    const { body: atoms } = group;
    if (atoms.length === 1) {
      this.set(group, 0);
      return;
    }
    this.setSel(null);
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
      this.set(parent, parent.body.indexOf(atom));
      this.renderCaret();
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
    this.set(sub, 0);
    this.renderCaret();
  }

  addPar() {
    if (this.sel !== null) {
      const [start, end] = [...this.sel].sort((a, b) => a - b);
      const body = this.target.body.slice(start + 1, end + 1);
      this.insert([new LRAtom("(", ")", new GroupAtom(body))]);
    } else {
      this.insert([new LRAtom("(", ")", new GroupAtom([]))]);
      this.moveLeft();
    }
  }

  set(atom: GroupAtom, pos: number) {
    [this.target, this.pos] = [atom, pos];
    this.renderCaret();
  }

  isSup() {
    if (!(this.target.parent instanceof SupSubAtom)) return false;
    return this.target === this.target.parent.sup;
  }

  isSub() {
    if (!(this.target.parent instanceof SupSubAtom)) return false;
    return this.target === this.target.parent.sub;
  }

  isBody() {
    if (!(this.target.parent instanceof LRAtom)) return false;
    return this.target === this.target.parent.body;
  }

  isEmpty() {
    return this.target.body.length === 1;
  }

  isFirst() {
    return this.pos === 0;
  }

  isLast() {
    return this.pos === this.target.body.length - 1;
  }

  exitSupSub() {
    const supsub = this.target.parent;
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

  exitBody() {
    const body = this.target.parent;
    if (!(body instanceof LRAtom)) {
      throw new Error(
        "Try exit from LRAtom body, however counld not find LRAtom as parent"
      );
    }
    if (!(body.parent instanceof GroupAtom)) {
      throw new Error(
        "Try exit from sup, however counld not find parent of LRAtom"
      );
    }
    const newAtom = body.parent;
    this.set(newAtom, newAtom.body.indexOf(body));
  }
}

const distance = (c0: [x: number, y: number], c1: [x: number, y: number]) =>
  Math.pow(Math.abs(c1[0] - c0[0]), 2) + Math.pow(Math.abs(c1[1] - c0[1]), 2);
