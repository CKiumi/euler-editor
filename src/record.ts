import { Atom, Group } from "euler-tex/src/lib";
export type SetManager = (target: Group & Atom, pos: number) => void;
export interface Record {
  action: "insert" | "delete";
  manager: Group & Atom;
  pos: number;
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
