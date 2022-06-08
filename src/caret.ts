import {
  Atom,
  FirstAtom,
  FracAtom,
  GroupAtom,
  LRAtom,
  MatrixAtom,
  SupSubAtom,
} from "euler-tex/src/lib";
import { setRecord } from "./record";
import { EngineSuggestion } from "./suggest/suggest";
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
    public target: GroupAtom = new GroupAtom([], true),
    public pos: number = 0
  ) {
    this.elem.style.height = "0";
  }

  x() {
    return Util.right(this.cur());
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
      const [x, y] = this.toReltiveCoord([rect.x + rect.width, rect.y]);
      this.elem.style.cssText = `height:${rect.height}px; 
        transform:translate(${x - 1}px,${y + 2}px)`;
    }
    this.elem.classList.remove("EE_caret");
    this.elem.offsetWidth;
    this.elem.classList.add("EE_caret");
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
    if (sel === null) {
      EngineSuggestion.reset();
    }
    sel === null ? this.action.focus() : this.action.blur();
    if (this.sel === null) return;
    const [start, last] = this.range().map((i) => this.target?.body[i]);
    const [relX, relY] = this.toReltiveCoord([
      Util.right(start),
      Util.top(this.target),
    ]);
    EngineSuggestion.set(this.getValue(), [
      Util.right(start),
      Util.top(this.target) + Util.height(this.target),
    ]);
    this.selElem.style.height = `${Util.height(this.target)}px`;
    this.selElem.style.transform = `translate(${relX}px,${relY}px)`;
    this.selElem.style.width = `${Util.right(last) - Util.right(start)}px`;
  };

  setAtoms(atoms: GroupAtom) {
    this.target = atoms;
  }

  insert = (atoms: Atom[]) => {
    if (this.sel !== null) return this.replaceRange(atoms, this.range());
    this.target.body.splice(this.pos + 1, 0, ...atoms);
    this.action.render();
    this.set(this.target, this.pos + atoms.length);
    setRecord({
      action: "insert",
      manager: this.target,
      position: this.pos - 1,
      atoms,
    });
  };

  copy(ev: ClipboardEvent) {
    const latex = this.getValue();
    if (latex) ev.clipboardData?.setData("text/plain", latex);
    ev.preventDefault();
  }

  cut(ev: ClipboardEvent) {
    this.copy(ev);
    this.replaceRange(null, this.range());
  }

  getValue() {
    if (this.sel === null) return "";
    const [start, end] = this.range();
    return Util.serializeGroupAtom(this.target.body.slice(start + 1, end + 1));
  }

  moveRight() {
    if (this.sel !== null) {
      this.set(this.target, this.range()[1]);
      this.setSel(null);
      return;
    }
    if (this.isLast()) {
      if (this.isSup() || this.isSub()) {
        this.exitSupSub("right");
      } else if (this.isNumer() || this.isDenom()) {
        this.exitFrac();
      } else if (this.isBody()) {
        this.exitBody("right");
      } else if (this.isMat()) {
        const mat = this.target.parent as MatrixAtom;
        mat.children.forEach((row) => {
          const column = row.indexOf(this.target);
          if (column !== -1) {
            if (column + 1 === row.length) {
              if (!mat.parent) return;
              this.set(mat.parent, mat.parent.body.indexOf(mat));
            } else {
              this.set(row[column + 1], 0);
            }
          }
        });
      }
    } else {
      ++this.pos;
      const cur = this.cur();
      if (cur instanceof SupSubAtom) {
        if (cur.nuc instanceof LRAtom) {
          this.set(cur.nuc.body, 0);
        } else if (cur.sup) {
          this.set(cur.sup, 0);
        } else if (cur.sub) {
          this.set(cur.sub, 0);
        } else {
          throw new Error("SupSubAtom must have sup or sub");
        }
      } else if (Util.isSingleBody(cur)) {
        this.set(cur.body, 0);
      } else if (cur instanceof FracAtom) {
        this.set(cur.numer, 0);
      } else if (cur instanceof MatrixAtom) {
        this.set(cur.children[0][0], 0);
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
        this.exitSupSub("left");
      } else if (this.isNumer() || this.isDenom()) {
        this.exitFrac();
        this.set(this.target, this.pos - 1);
      } else if (this.isBody()) {
        this.exitBody("left");
        this.set(this.target, this.pos - 1);
      } else if (this.isMat()) {
        const mat = this.target.parent as MatrixAtom;
        mat.children.forEach((row) => {
          const column = row.indexOf(this.target);
          if (column !== -1) {
            if (column === 0) {
              if (!mat.parent) return;
              this.set(mat.parent, mat.parent.body.indexOf(mat) - 1);
            } else {
              this.set(row[column - 1], 0);
            }
          }
        });
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
      } else if (cur instanceof FracAtom) {
        this.set(cur.numer, cur.numer.body.length - 1);
      } else if (Util.isSingleBody(cur)) {
        this.set(cur.body, cur.body.body.length - 1);
      } else if (cur instanceof MatrixAtom) {
        const child = cur.children[0][cur.children[0].length - 1];
        this.set(child, child.body.length - 1);
      } else {
        this.set(this.target, this.pos - 1);
      }
    }
  }

  moveUp() {
    const target = this.target;
    if (this.isSub()) {
      if (!(target.parent instanceof SupSubAtom)) throw new Error("");
      if (target.parent.sup) {
        this.pointAtomHol(this.x(), target.parent.sup);
      }
    } else if (this.isDenom()) {
      if (!(target.parent instanceof FracAtom)) throw new Error("");
      this.pointAtomHol(this.x(), target.parent.numer);
    } else if (this.isMat()) {
      const mat = this.target.parent as MatrixAtom;
      for (const [rowIndex, row] of mat.children.entries()) {
        const column = row.indexOf(this.target);
        if (column !== -1) {
          if (rowIndex === 0) {
            return false;
          } else {
            if (!mat.parent) return;
            this.pointAtomHol(this.x(), mat.children[rowIndex - 1][column]);
            return true;
          }
        }
      }
    } else {
      return false;
    }
    return true;
  }

  moveDown() {
    const target = this.target;
    if (this.isSup()) {
      if (!(target.parent instanceof SupSubAtom)) throw new Error("");
      if (target.parent.sub) {
        this.pointAtomHol(this.x(), target.parent.sub);
      }
    } else if (this.isNumer()) {
      if (!(target.parent instanceof FracAtom)) throw new Error("");
      this.pointAtomHol(this.x(), target.parent.denom);
    } else if (this.isMat()) {
      const mat = this.target.parent as MatrixAtom;
      for (const [rowIndex, row] of mat.children.entries()) {
        const column = row.indexOf(this.target);
        if (column !== -1) {
          if (rowIndex === mat.children.length - 1) {
            return false;
          } else {
            if (!mat.parent) return;
            this.pointAtomHol(this.x(), mat.children[rowIndex + 1][column]);
            return true;
          }
        }
      }
    } else {
      return false;
    }
    return true;
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

  replaceRange = (newAtoms: Atom[] | null, range: [number, number]) => {
    const atoms = this.target.body.splice(
      range[0] + 1,
      Math.abs(range[1] - range[0])
    );
    setRecord({
      action: "delete",
      manager: this.target,
      position: range[0] + 1,
      atoms,
      skip: !!newAtoms,
    });
    if (newAtoms) {
      this.target.body.splice(range[0] + 1, 0, ...newAtoms);
      setRecord({
        action: "insert",
        manager: this.target,
        position: range[0],
        atoms: newAtoms,
        skip: true,
      });
      this.action.render();
      this.set(this.target, range[0] + newAtoms.length);
    } else {
      this.action.render();
      this.set(this.target, range[0]);
    }
    this.setSel(null);
  };

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
    const atom = this.target.body.splice(this.pos, 1)[0];
    this.action.render();
    setRecord({
      action: "delete",
      manager: this.target,
      position: this.pos,
      atoms: [atom],
    });
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
    while (i < atoms.length && Util.right(atoms[i]) < x) {
      i++;
    }
    const atom = (() => {
      if (i === atoms.length) {
        return atoms[i - 1];
      } else {
        return [atoms[i - 1], ...Util.children(atoms[i])].reduce(
          (prev, cur) => {
            if (
              distance([Util.right(cur), Util.yCenter(cur)], [x, y]) <=
              distance([Util.right(prev), Util.yCenter(prev)], [x, y])
            ) {
              return cur;
            } else return prev;
          }
        );
      }
    })();
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
      ? new SupSubAtom(atom.nuc, new GroupAtom([], true), atom.sub)
      : new SupSubAtom(atom, new GroupAtom([], true));
    this.delete();
    this.insert([newSupSub]);
    this.moveLeft();
  }

  addSub() {
    const atom = this.cur();
    if (atom instanceof FirstAtom) return;
    const isSubBox = atom instanceof SupSubAtom && !atom.sub;
    const sub = new GroupAtom([], true);
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
      this.insert([new LRAtom("(", ")", new GroupAtom(body, true))]);
    } else {
      this.insert([new LRAtom("(", ")", new GroupAtom([], true))]);
      this.moveLeft();
    }
  }

  set = (atom: GroupAtom, pos: number, render?: boolean) => {
    [this.target, this.pos] = [atom, pos];
    if (render) this.action.render();
    this.renderCaret();
  };

  isSup() {
    if (!(this.target.parent instanceof SupSubAtom)) return false;
    return this.target === this.target.parent.sup;
  }

  isSub() {
    if (!(this.target.parent instanceof SupSubAtom)) return false;
    return this.target === this.target.parent.sub;
  }

  isNumer() {
    if (!(this.target.parent instanceof FracAtom)) return false;
    return this.target === this.target.parent.numer;
  }

  isDenom() {
    if (!(this.target.parent instanceof FracAtom)) return false;
    return this.target === this.target.parent.denom;
  }

  isBody() {
    if (!this.target.parent) return false;
    return Util.isSingleBody(this.target.parent);
  }

  isMat() {
    const { parent } = this.target;
    return parent instanceof MatrixAtom;
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

  exitSupSub(direction: "left" | "right") {
    const supsub = this.target.parent;
    if (!(supsub instanceof SupSubAtom)) {
      throw new Error(
        "Try exit from sup, however counld not find SupSubAtom as parent"
      );
    }

    if (direction === "left" && supsub.nuc instanceof LRAtom) {
      this.set(supsub.nuc.body, supsub.nuc.body.body.length - 1);
      return;
    }

    if (!(supsub.parent instanceof GroupAtom)) {
      throw new Error(
        "Try exit from sup, however counld not find parent of SupSubAtom"
      );
    }
    const newAtom = supsub.parent;
    if (direction === "left") {
      this.set(newAtom, newAtom.body.indexOf(supsub) - 1);
    } else {
      this.set(newAtom, newAtom.body.indexOf(supsub));
    }
  }

  exitFrac() {
    const frac = this.target.parent;
    if (!(frac instanceof FracAtom)) {
      throw new Error(
        "Try exit from numer, however counld not find FracAtom as parent"
      );
    }
    if (!(frac.parent instanceof GroupAtom)) {
      throw new Error(
        "Try exit from denom, however counld not find parent of FracAtom"
      );
    }
    const newAtom = frac.parent;
    this.set(newAtom, newAtom.body.indexOf(frac));
  }

  exitBody(direction: "left" | "right") {
    const body = this.target.parent;
    if (!Util.isSingleBody(body)) {
      throw new Error(
        "Try exit from Single body atom, however counld not find Single body atom as parent"
      );
    }
    if (body.parent instanceof SupSubAtom) {
      if (direction === "left") {
        const newAtom = body.parent.parent;
        if (!newAtom) throw new Error("");
        this.set(newAtom, newAtom.body.indexOf(body.parent));
      } else {
        const { sup, sub } = body.parent;
        if (sup) {
          this.set(sup, 0);
        } else if (sub) {
          this.set(sub, 0);
        } else {
          throw new Error("Either Sup or Sub must exist");
        }
      }

      return;
    }
    if (!(body.parent instanceof GroupAtom)) {
      throw new Error(
        "Try exit from LRAtom body, however counld not find parent of LRAtom"
      );
    }
    const newAtom = body.parent;
    this.set(newAtom, newAtom.body.indexOf(body));
  }
}

const distance = (c0: [x: number, y: number], c1: [x: number, y: number]) =>
  Math.pow(Math.abs(c1[0] - c0[0]), 2) + Math.pow(Math.abs(c1[1] - c0[1]), 2);
