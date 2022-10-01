import { Atom, Group } from "euler-tex/src/lib";
export interface RecordData {
  action: "insert" | "delete";
  manager: Group & Atom;
  pos: number;
  atoms: Atom[];
  skip?: boolean;
}

export class Record {
  record: { index: number; data: RecordData[] } = {
    index: -1,
    data: [],
  };

  setRecord = (data: RecordData) => {
    this.record.data.splice(this.record.index + 1);
    this.record.data.push(data);
    this.record.index += 1;
  };
}
