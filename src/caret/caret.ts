import {
  Article,
  Block,
  Display,
  Inline,
  Section,
  Theorem,
} from "euler-tex/src/atom/block";
import {
  Atom,
  Delims,
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
import { record, setRecord } from "../record";
import { Util } from "../util";
import { Pointer } from "./nav";

export type Sel = [anchor: number, offset: number];
type Action = { focus: () => void; blur: () => void; setLabel: () => void };
export class Caret {
  sel: [anchor: Atom, offset: Atom] | null = null;
  public selElem: HTMLElement[] = [];
  public target: Group & Atom = new MathGroup([]);
  public pos = 0;
  constructor(
    public elem: HTMLElement,
    public field: HTMLElement,
    public action: Action
  ) {}
  x = () => Util.right(this.cur());
  y = () => Util.top(this.cur());
  bottom = () => Util.bottom(this.cur());
  cur = () => this.target.body[this.pos];

  renderCaret = () => {
    const curRect = Util.rect(this.cur());
    let x = curRect.x + curRect.width;
    let [y, h] = [0, 0];
    if (Util.isBreakAtom(this.cur()) && !this.isLast()) {
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
    setRecord({ action: "insert", manager: this.target, pos: this.pos, atoms });
    this.action.setLabel();
    this.set(this.target, this.pos + atoms.length);
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
    const target = this.target;
    if (this.sel !== null) {
      this.set(target, this.range()[1]);
      this.setSel(null);
      return;
    }
    if (this.isLast()) {
      if (Util.isSup(target) || Util.isSub(target)) {
        this.exitSupSub("right");
      } else if (Util.isNumer(target) || Util.isDenom(target)) {
        this.exitFrac(target.parent);
      } else if (Util.isBody(target)) {
        this.exitBody("right");
      } else if (Util.isMat(target)) {
        const mat = target.parent;
        const [ri, ci] = Util.findIndexInMat(target);
        if (ci + 1 === mat.rows[ri].length) {
          if (mat.parent instanceof MathGroup) {
            this.set(mat.parent, mat.parent.body.indexOf(mat));
          } else {
            if (!mat.parent) return;
            const root = mat.parent.parent as Article;
            this.set(root, root.body.indexOf(mat.parent));
          }
        } else this.set(mat.rows[ri][ci + 1], 0);
      } else if (
        Util.isSingleBlock(this.target) &&
        !(this.target instanceof Article)
      ) {
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
    const { target } = this;
    if (this.sel !== null) {
      this.set(target, this.range()[0]);
      this.setSel(null);
      return;
    }
    const cur = this.cur();
    if (this.isFirst()) {
      if (Util.isSup(target) || Util.isSub(target)) {
        this.exitSupSub("left");
      } else if (Util.isNumer(target) || Util.isDenom(target)) {
        this.exitFrac(target.parent);
        this.set(this.target, this.pos - 1);
      } else if (Util.isBody(target)) {
        this.exitBody("left");
        this.set(this.target, this.pos - 1);
      } else if (Util.isMat(target)) {
        const mat = target.parent;
        const [ri, ci] = Util.findIndexInMat(target);
        if (ci === 0) {
          if (mat.parent instanceof MathGroup) {
            this.set(mat.parent, mat.parent.body.indexOf(mat) - 1);
          } else if (mat.parent) {
            const root = mat.parent.parent as Article;
            this.set(root, root.body.indexOf(mat.parent) - 1);
          }
        } else {
          this.set(mat.rows[ri][ci - 1], mat.rows[ri][ci - 1].body.length - 1);
        }
      } else if (Util.isSingleBlock(target)) {
        const newAtom = target.parent as Group & Atom;
        if (!newAtom) return;
        this.set(newAtom, newAtom.body.indexOf(target) - 1);
      }
    } else {
      const atom = Util.lastChild(cur);
      if (atom) this.set(atom[0] as Atom & Group, atom[1]);
      else this.set(this.target, this.pos - 1);
    }
  }

  moveUp() {
    const target = this.target;
    if (Util.isSub(target)) {
      const supsub = target.parent as SupSubAtom;
      if (supsub.sup) {
        const atoms = supsub.sup.body;
        this.set(...Pointer.nearestAtom(this.x(), this.y(), atoms));
      }
    } else if (Util.isDenom(target)) {
      if (!(target.parent instanceof FracAtom)) throw new Error("");
      const atoms = target.parent.numer.body;
      this.set(...Pointer.nearestAtom(this.x(), this.y(), atoms));
    } else if (Util.isMat(target)) {
      const { rows } = target.parent as MatrixAtom;
      const [ri, ci] = Util.findIndexInMat(target);
      if (ri === 0) return false;
      else {
        const atoms = rows[ri - 1][ci].body;
        this.set(...Pointer.nearestAtom(this.x(), this.y(), atoms));
        return true;
      }
    } else {
      return false;
    }
    return true;
  }

  moveDown() {
    const target = this.target;
    if (Util.isSup(target)) {
      const supsub = target.parent as SupSubAtom;
      if (supsub.sub) {
        const atoms = supsub.sub.body;
        this.set(...Pointer.nearestAtom(this.x(), this.bottom(), atoms));
      }
    } else if (Util.isNumer(target)) {
      const atoms = target.parent.denom.body;
      this.set(...Pointer.nearestAtom(this.x(), this.bottom(), atoms));
    } else if (Util.isMat(target)) {
      const [ri, ci] = Util.findIndexInMat(target);
      if (ri === target.parent.rows.length - 1) return false;
      else {
        const atoms = target.parent.rows[ri + 1][ci].body;
        this.set(...Pointer.nearestAtom(this.x(), this.bottom(), atoms));
        return true;
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
    this.pointInBlock(x, y, this.target);
    this.setSel([anchor, this.cur()]);
  };

  replace = (newAtoms: Atom[] | null, range: [number, number]) => {
    const [start, num] = [range[0] + 1, Math.abs(range[1] - range[0])];
    const atoms = Util.del(this.target, start, num);
    setRecord({
      action: "delete",
      manager: this.target,
      pos: start,
      atoms,
      skip: !!newAtoms,
    });
    if (newAtoms) {
      Util.insert(this.target, range[0], newAtoms);
      setRecord({
        action: "insert",
        manager: this.target,
        pos: range[0],
        atoms: newAtoms,
        skip: true,
      });
      this.action.setLabel();
      this.set(this.target, range[0] + newAtoms.length);
    } else this.set(this.target, range[0]);
    this.setSel(null);
  };

  delete() {
    if (this.isFirst()) {
      if (Util.isSup(this.target) && this.isEmpty()) {
        this.moveRight();
        const supsub = this.cur() as SupSubAtom;
        if (supsub.sub) supsub.sup = undefined;
        else {
          this.delete();
          this.insert([supsub.nuc]);
        }
      }
      if (Util.isSub(this.target) && this.isEmpty()) {
        this.moveRight();
        const supsub = this.cur() as SupSubAtom;
        if (supsub.sup) supsub.sub = undefined;
        else {
          this.delete();
          this.insert([supsub.nuc]);
        }
      }
      return;
    }
    const atoms = Util.del(this.target, this.pos, 1);
    setRecord({ action: "delete", manager: this.target, pos: this.pos, atoms });
    this.action.setLabel();
    this.set(this.target, this.pos - 1);
  }

  point = (x: number, y: number, root: Article) => {
    let [g, i]: [Block, number | null] = Pointer.pointText(x, y, root);
    if (g instanceof Theorem) [g, i] = Pointer.pointText(x, y, g as Article);
    if (i === null) this.set(...Pointer.nearestAtom(x, y, g.children()));
    else this.set(g as unknown as Group & Atom, i);
    this.action.focus();
  };

  pointInBlock = (x: number, y: number, group: Group & Atom) => {
    if (group instanceof Article || group instanceof Theorem) {
      const [g, i] = Pointer.pointText(x, y, group);
      if (i === null) this.set(group, group.body.indexOf(g));
      else this.set(g as unknown as Group & Atom, i);
      this.action.focus();
    } else this.set(...Pointer.nearestAtom(x, y, group.body));
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

  addPar(left: Delims, right: Delims) {
    if (this.sel !== null) {
      const [start, end] = this.range();
      const body = this.target.body.slice(start + 1, end + 1);
      this.insert([new LRAtom(left, right, new MathGroup(body as MathAtom[]))]);
    } else {
      this.insert([new LRAtom(left, right, new MathGroup([]))]);
      this.moveLeft();
    }
  }

  set = (atom: Group & Atom, pos: number) => {
    const parentMat = Util.parentMatrix(this.target);
    if (parentMat) {
      parentMat.setGrid(false);
      Util.render(parentMat);
    }
    [this.target, this.pos] = [atom, pos];
    const parent = Util.parentMatrix(this.target);
    if (parent) {
      parent.setGrid(true);
      Util.render(parent);
    }
    this.renderCaret();
  };

  isTextMode = () => {
    return (
      this.target instanceof Theorem ||
      this.target instanceof Article ||
      this.target instanceof Section
    );
  };
  isSectionMode = () => Util.parentBlock(this.cur()) instanceof Section;
  isDisplayMode = () => Util.parentBlock(this.cur()) instanceof Display;
  isInlineMode = () => Util.parentBlock(this.cur()) instanceof Inline;
  isEmpty = () => this.target.body.length === 1;
  isFirst = () => this.pos === 0;
  isLast = () => this.pos === this.target.body.length - 1;
  exitSupSub(direction: "left" | "right") {
    const spb = this.target.parent;
    if (!(spb instanceof SupSubAtom)) {
      throw new Error("counld not find SupSubAtom as parent");
    }
    if (direction === "left" && spb.nuc instanceof LRAtom) {
      this.set(spb.nuc.body, spb.nuc.body.body.length - 1);
      return;
    }
    if (!spb.parent) throw new Error("Exprect parent of SupSubAtom");
    const atom = spb.parent;
    this.set(atom, atom.body.indexOf(spb) - (direction === "left" ? 1 : 0));
  }

  exitFrac(frac: FracAtom) {
    if (!frac.parent) throw new Error("Counld not find parent of FracAtom");
    this.set(frac.parent, frac.parent.body.indexOf(frac));
  }

  exitBody(direction: "left" | "right") {
    const body = this.target.parent;
    if (!Util.isSingleBody(body)) {
      throw new Error("Counld not find Single body atom as parent");
    }
    if (body.parent instanceof SupSubAtom) {
      if (direction === "left") {
        const atom = body.parent.parent as Group & Atom;
        this.set(atom, atom.body.indexOf(body.parent));
      } else {
        const { sup, sub } = body.parent;
        if (sup) this.set(sup, 0);
        else if (sub) this.set(sub, 0);
        else throw new Error("Either Sup or Sub must exist");
      }
      return;
    }
    const atom = body.parent as Atom & Group;
    this.set(atom, atom.body.indexOf(body));
  }

  redo = (once?: boolean) => {
    if (record.index === record.data.length - 1) return;
    const { action, manager, pos, atoms } = record.data[record.index + 1];
    if (action === "insert") {
      Util.insert(manager, pos, atoms);
      this.action.setLabel();
      this.set(manager, pos + atoms.length);
    }
    if (action === "delete") {
      this.setSel(null);
      Util.del(manager, pos, atoms.length);
      this.action.setLabel();
      this.set(manager, pos - 1);
    }
    record.index += 1;
    if (once) return;
    if (record.data[record.index].skip) this.redo(true);
  };

  undo = (once?: boolean) => {
    if (record.index === -1) return;
    const { action, manager, pos, atoms } = record.data[record.index];
    this.setSel(null);
    if (action === "insert") {
      Util.del(manager, pos + 1, atoms.length);
      this.action.setLabel();
      this.set(manager, pos);
    }
    if (action === "delete") {
      Util.insert(manager, pos - 1, atoms);
      this.action.setLabel();
      if (atoms.length > 1) {
        this.setSel([
          manager.body[pos - 1],
          manager.body[pos + atoms.length - 1],
        ]);
        this.set(manager, pos - 1);
      } else {
        this.set(manager, pos);
      }
    }
    record.index -= 1;
    if (once) return;
    if (record.data[record.index + 1].skip) this.undo(true);
  };
}
