import { GroupAtom, MatrixAtom } from "euler-tex/src/lib";

export module Builder {
  export const getCurRowCol = (atom: GroupAtom, mat: MatrixAtom) => {
    for (const [rowIndex, row] of mat.children.entries()) {
      const column = row.indexOf(atom);
      if (column !== -1) return [rowIndex, column];
    }
    return [0, 0];
  };

  export const addRow = (mat: MatrixAtom, pos: number) => {
    if (pos < 0 || pos > mat.children.length) {
      throw new Error("Try to add row in invalid position");
    }
    const length = Math.max(...mat.children.map((row) => row.length));
    const newRow = Array(length)
      .fill(1)
      .map(() => new GroupAtom([], true));
    mat.children.splice(pos, 0, newRow);
  };

  export const addColumn = (mat: MatrixAtom, pos: number) => {
    const length = Math.max(...mat.children.map((row) => row.length));
    if (pos < 0 || pos > length) {
      throw new Error("Try to add column in invalid position");
    }
    mat.children.forEach((row) => {
      row.splice(pos, 0, new GroupAtom([], true));
    });
  };

  export const deleteRow = (mat: MatrixAtom, pos: number) => {
    if (mat.children.length === 1) return;
    if (pos < 0 || pos > mat.children.length - 1) {
      throw new Error("Try to add row in invalid position");
    }
    mat.children.splice(pos, 1);
  };

  export const deleteCol = (mat: MatrixAtom, pos: number) => {
    const length = Math.max(...mat.children.map((row) => row.length));
    if (length === 1) return;
    if (pos < 0 || pos > length - 1) {
      throw new Error("Try to add row in invalid position");
    }
    mat.children.forEach((row) => {
      row.splice(pos, 1);
    });
  };
}
