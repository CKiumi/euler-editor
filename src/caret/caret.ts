import {
  Article,
  Display,
  Inline,
  Section,
  Theorem,
} from "euler-tex/src/atom/block";
import {
  Atom,
  FirstAtom,
  FracAtom,
  Group,
  LRAtom,
  MathAtom,
  MathGroup,
  MatrixAtom,
  SupSubAtom,
} from "euler-tex/src/lib";
import { Engine } from "../engine";
import { setRecord } from "../record";
import { Util } from "../util";
import { Pointer } from "./nav";

export type Sel = [anchor: number, offset: number];
type Action = { focus: () => void; blur: () => void; render: () => void };
export class Caret {
  sel: [anchor: Atom, offset: Atom] | null = null;
  public selElem: HTMLElement[] = [];
  public target: Group & Atom = new MathGroup([]);
  public pos = 0;
  constructor(
    public elem: HTMLElement,
    public field: HTMLElement,
    public action: Action
  ) {
    this.elem.style.height = "0";
  }
  x = () => Util.right(this.cur());
  y = () => Util.bottom(this.cur());
  cur = () => this.target.body[this.pos];
  renderCaret = () => {
    const curRect = Util.rect(this.cur());
    let x = curRect.x + curRect.width;
    let [y, h] = [0, 0];
    if (Util.isBreakAtom(this.cur())) {
      const r = Util.rect(this.target.body[this.pos + 1]);
      [x, y, h] = [r.x, r.y, r.height];
    } else if (Util.isInlineGroup(this.target)) {
      const r = Util.rect(this.target);
      [y, h] = [r.y, r.height];
    } else {
      [y, h] = [curRect.y, curRect.height];
    }

    const { x: fx, y: fy } = this.field.getBoundingClientRect();
    this.elem.style.height = `${h}px`;
    this.elem.style.transform = `translate(${x - 1 - fx}px,${y - fy}px)`;
    this.elem.style.animation = "none";
    this.elem.offsetWidth;
    this.elem.style.animation = "";
    return true;
  };

  range() {
    if (!this.sel)
      throw new Error("sel must be specified when calling renge()");
    const range = this.sel.map((x) =>
      (x.parent as unknown as Group).body.indexOf(x)
    );
    return range.sort((a, b) => a - b) as [a: number, b: number];
  }

  setSel = (sel: [anchlor: Atom, offset: Atom] | null) => {
    if (this.sel && sel && this.sel[0] === sel[0] && this.sel[1] === sel[1]) {
      return;
    }
    const cache = this.selElem;
    if (sel === null || (sel && sel[0] == sel[1])) {
      this.sel = null;
      cache.forEach((elem) => elem.remove());
      Engine.reset();
      return;
    }
    this.sel = sel;
    const [start, last] = this.range().map((i) => this.target?.body[i]);

    if (!start.elem || !last.elem) return;
    if (!start.elem.parentElement) throw new Error("Parent element not found");
    const rects = Util.getLineRects(
      start.elem,
      last.elem,
      start.elem.parentElement
    );
    this.selElem = [];
    const fieldRect = this.field.getBoundingClientRect();
    rects.forEach((rect, i) => {
      const left = i === 0 ? Util.right(start) : rect.left;
      const right = i === rects.length - 1 ? Util.right(last) : rect.right;
      const [relX, relY] = [left - fieldRect.x, rect.top - fieldRect.y];
      const div = document.createElement("div");
      div.className = "EE_selection";
      this.selElem.push(div);
      this.selElem[i].style.height = `${rect.height}px`;
      this.selElem[i].style.transform = `translate(${relX}px,${relY}px)`;
      this.selElem[i].style.width = `${right - left}px`;
    });
    this.selElem.forEach((elem) => this.field.prepend(elem));
    cache.forEach((elem) => elem.remove());
    if (!this.isTextMode()) {
      const top = Util.top(this.target);
      Engine.set(this.getValue(), [
        Util.right(start),
        top + rects[0].height,
        top,
      ]);
    }
  };

  insert = (atoms: Atom[]) => {
    if (this.sel !== null) return this.replace(atoms, this.range());
    Util.insert(this.target, this.pos, atoms);
    this.set(this.target, this.pos + atoms.length);
    setRecord({
      action: "insert",
      manager: this.target,
      position: this.pos - atoms.length,
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
    this.replace(null, this.range());
  }

  getValue() {
    if (this.sel === null) return "";
    const [start, end] = this.range();
    return this.target.body
      .slice(start + 1, end + 1)
      .map((x) => x.serialize())
      .join("");
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
        mat.rows.forEach((row) => {
          const column = row.indexOf(this.target as MathGroup);
          if (column !== -1) {
            if (column + 1 === row.length) {
              if (!mat.parent) return;
              if (mat.parent instanceof MathGroup) {
                this.set(mat.parent, mat.parent.body.indexOf(mat));
              } else {
                this.set(
                  mat.parent.parent as Article,
                  (mat.parent.parent as Article).body.indexOf(mat.parent)
                );
              }
            } else {
              this.set(row[column + 1], 0);
            }
          }
        });
      } else if (Util.isSingleBlock(this.target)) {
        const newAtom = this.target.parent as Group & Atom;
        this.set(newAtom, newAtom.body.indexOf(this.target));
      }
    } else {
      ++this.pos;
      const first = Util.firstChild(this.cur());
      if (first) this.set(first[0], first[1]);
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
        mat.rows.forEach((row) => {
          const column = row.indexOf(this.target as MathGroup);
          if (column !== -1) {
            if (column === 0) {
              if (!mat.parent) return;
              if (mat.parent instanceof MathGroup) {
                this.set(mat.parent, mat.parent.body.indexOf(mat) - 1);
              } else {
                const target = mat.parent.parent as Article;
                this.set(target, target.body.indexOf(mat.parent) - 1);
              }
            } else {
              this.set(row[column - 1], row[column - 1].body.length - 1);
            }
          }
        });
      } else if (Util.isSingleBlock(this.target)) {
        const newAtom = this.target.parent as Group & Atom;
        if (!newAtom) return;
        this.set(newAtom, newAtom.body.indexOf(this.target) - 1);
      }
    } else {
      const atom = Util.lastChild(cur);
      if (atom) this.set(atom[0] as Atom & Group, atom[1]);
      else this.set(this.target, this.pos - 1);
    }
  }

  moveUp() {
    const target = this.target;
    if (this.isSub()) {
      if (!(target.parent instanceof SupSubAtom)) throw new Error("");
      if (target.parent.sup) {
        this.pointHol(this.x(), target.parent.sup);
      }
    } else if (this.isDenom()) {
      if (!(target.parent instanceof FracAtom)) throw new Error("");
      this.pointHol(this.x(), target.parent.numer);
    } else if (this.isMat()) {
      const mat = this.target.parent as MatrixAtom;
      for (const [rowIndex, row] of mat.rows.entries()) {
        const column = row.indexOf(this.target as MathGroup);
        if (column !== -1) {
          if (rowIndex === 0) {
            return false;
          } else {
            if (!mat.parent) return;
            this.pointHol(this.x(), mat.rows[rowIndex - 1][column]);
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
        this.pointHol(this.x(), target.parent.sub);
      }
    } else if (this.isNumer()) {
      if (!(target.parent instanceof FracAtom)) throw new Error("");
      this.pointHol(this.x(), target.parent.denom);
    } else if (this.isMat()) {
      const mat = this.target.parent as MatrixAtom;
      for (const [rowIndex, row] of mat.rows.entries()) {
        const column = row.indexOf(this.target as MathGroup);
        if (column !== -1) {
          if (rowIndex === mat.rows.length - 1) {
            return false;
          } else {
            if (!mat.parent) return;
            this.pointHol(this.x(), mat.rows[rowIndex + 1][column]);
            return true;
          }
        }
      }
    } else return false;
    return true;
  }

  shiftRight() {
    if (this.isLast()) return;
    const anchor = this.sel ? this.sel[0] : this.cur();
    this.set(this.target, this.pos + 1);
    this.setSel([anchor, this.cur()]);
  }

  shiftLeft() {
    if (this.isFirst()) return;
    const anchor = this.sel ? this.sel[0] : this.cur();
    this.set(this.target, this.pos - 1);
    this.setSel([anchor, this.cur()]);
  }

  selectLeft() {
    let last;
    const atoms = this.target.body;
    const anchor = this.sel ? this.sel[0] : this.cur();
    for (last = this.pos; last > 0; last--) {
      if (Util.isBreakAtom(atoms[last])) break;
    }
    this.setSel([anchor, atoms[last]]);
    this.set(this.target, last);
  }

  selectRight() {
    let last;
    const atoms = this.target.body;
    const anchor = this.sel ? this.sel[0] : this.cur();
    for (last = this.pos; last < atoms.length - 1; last++) {
      if (Util.isBreakAtom(atoms[last + 1])) break;
    }
    this.setSel([anchor, atoms[last]]);
    this.set(this.target, last);
  }

  extendSel = (x: number, y: number) => {
    const anchor = this.sel?.[0] ?? this.cur();
    this.point(x, y, this.target, false);
    this.setSel([anchor, this.cur()]);
  };

  replace = (newAtoms: Atom[] | null, range: [number, number]) => {
    const atoms = Util.del(
      this.target,
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
      Util.insert(this.target, range[0], newAtoms);
      setRecord({
        action: "insert",
        manager: this.target,
        position: range[0],
        atoms: newAtoms,
        skip: true,
      });
      this.set(this.target, range[0] + newAtoms.length);
    } else {
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
    const atoms = Util.del(this.target, this.pos, 1);
    setRecord({
      action: "delete",
      manager: this.target,
      position: this.pos,
      atoms,
    });
    this.set(this.target, this.pos - 1);
  }

  pointHol = (x: number, target: Group & Atom) => {
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

  point = (x: number, y: number, group: Group & Atom, recursive: boolean) => {
    if (!group.elem) throw new Error("Expect elem");
    let [g, i] = [group as Atom, 0];

    [g, i] = Pointer.pointText(x, y, group as Article);

    if (g instanceof Theorem) {
      group = g;
      [, i] = Pointer.pointText(x, y, g as Article);
    }

    if (recursive) {
      const atom = group.body[i].children().reduce((prev, cur) => {
        if (Pointer.d(cur, [x, y]) <= Pointer.d(prev, [x, y])) return cur;
        else return prev;
      });

      const parent = atom.parent as Group & Atom;
      if (parent) this.set(parent, parent.body.indexOf(atom));
      this.action.focus();
    } else this.set(group, i);
  };

  addSup() {
    const atom = this.cur();
    if (atom instanceof FirstAtom) return;
    const isSupBox = atom instanceof SupSubAtom && !atom.sup;
    const newSupSub = isSupBox
      ? new SupSubAtom(atom.nuc, new MathGroup([]), atom.sub)
      : new SupSubAtom(atom as MathAtom, new MathGroup([]));
    this.delete();
    this.insert([newSupSub]);
    this.moveLeft();
  }

  addSub() {
    const atom = this.cur();
    if (atom instanceof FirstAtom) return;
    const isSubBox = atom instanceof SupSubAtom && !atom.sub;
    const sub = new MathGroup([]);
    const newSupSub = isSubBox
      ? new SupSubAtom(atom.nuc, atom.sup, sub)
      : new SupSubAtom(atom as MathAtom, undefined, sub);
    this.delete();
    this.insert([newSupSub]);
    this.set(sub, 0);
    this.renderCaret();
  }

  addPar(left: string, right: string) {
    if (this.sel !== null) {
      const range = this.sel.map((x) =>
        (x.parent as Group & Atom).body.indexOf(x)
      );
      const [start, end] = range.sort((a, b) => a - b);
      const body = this.target.body.slice(start + 1, end + 1);
      this.insert([
        new LRAtom(
          left as "(",
          right as ")",
          new MathGroup(body as MathAtom[])
        ),
      ]);
    } else {
      this.insert([new LRAtom(left as "(", right as ")", new MathGroup([]))]);
      this.moveLeft();
    }
  }

  set = (atom: Group & Atom, pos: number, render?: boolean) => {
    const parentMat = Util.parentMatrix(this.target);
    [this.target, this.pos] = [atom, pos];
    if (parentMat) {
      parentMat.setGrid(false);
      this.action.render();
    }
    const parent = Util.parentMatrix(this.target);
    if (parent) {
      parent.setGrid(true);
      render = true;
    }
    if (render) this.action.render();
    this.renderCaret();
  };

  isTextMode = () => {
    return (
      this.target instanceof Theorem ||
      this.target instanceof Article ||
      this.target instanceof Section
    );
  };

  isSectionMode = () => {
    return Util.parentBlock(this.cur()) instanceof Section;
  };

  isDisplayMode = () => {
    return Util.parentBlock(this.cur()) instanceof Display;
  };

  isInlineMode = () => Util.parentBlock(this.cur()) instanceof Inline;

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

    if (!supsub.parent) {
      throw new Error(
        "Try exit from sup, however could not find parent of SupSubAtom"
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
    if (!(frac.parent instanceof MathGroup)) {
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
        if (sup) this.set(sup, 0);
        else if (sub) this.set(sub, 0);
        else throw new Error("Either Sup or Sub must exist");
      }

      return;
    }

    if (!body.parent) {
      throw new Error(
        "Try exit from LRAtom body, however counld not find parent of LRAtom"
      );
    }
    const newAtom = body.parent as Atom & Group;
    this.set(newAtom, newAtom.body.indexOf(body));
  }
}
