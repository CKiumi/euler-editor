import { Atom, GroupAtom } from "euler-tex/src/lib";
export type SetManager = (
  target: GroupAtom,
  pos: number,
  render?: boolean
) => void;
export interface Record {
  action: "insert" | "delete";
  manager: GroupAtom;
  position: number;
  atoms: Atom[];
  skip?: boolean;
}
export const record: { index: number; data: Record[] } = {
  index: -1,
  data: [],
};
export const setRecord = (data: Record) => {
  record.data.splice(record.index + 1);
  record.data.push(data);
  record.index += 1;
};

export const redo = (
  setMg: SetManager,
  setSel: (sel: [anchlor: Atom, offset: Atom] | null) => void,
  once?: boolean
) => {
  if (record.index === record.data.length - 1) return;
  const { action, manager, position, atoms } = record.data[record.index + 1];
  if (action === "insert") {
    manager.body.splice(position + 1, 0, ...atoms);
    setMg(manager, position + atoms.length, true);
  }
  if (action === "delete") {
    setSel(null);
    manager.body.splice(position, atoms.length);
    setMg(manager, position - 1, true);
  }
  record.index += 1;
  if (once) return;
  if (record.data[record.index].skip) redo(setMg, setSel, true);
};

export const undo = (
  setMg: SetManager,
  setSel: (sel: [anchlor: Atom, offset: Atom] | null) => void,
  once?: boolean
) => {
  if (record.index === -1) return;
  const { action, manager, position, atoms } = record.data[record.index];
  setSel(null);
  if (action === "insert") {
    manager.body.splice(position + 1, atoms.length);
    setMg(manager, position, true);
  }
  if (action === "delete") {
    manager.body.splice(position, 0, ...atoms);
    setMg(manager, position - 1, true);
    if (atoms.length > 1)
      setSel([
        manager.body[position - 1],
        manager.body[position + atoms.length - 1],
      ]);
  }
  record.index -= 1;
  if (once) return;
  if (record.data[record.index + 1].skip) undo(setMg, setSel, true);
};
