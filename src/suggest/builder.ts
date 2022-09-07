import { GroupAtom, MathGroup, MatrixAtom } from "euler-tex/src/lib";

export module Builder {
  export const getCurRowCol = (atom: GroupAtom, mat: MatrixAtom) => {
    for (const [rowIndex, row] of mat.rows.entries()) {
      const column = row.indexOf(atom as MathGroup);
      if (column !== -1) return [rowIndex, column];
    }
    return [0, 0];
  };

  export const addRow = (mat: MatrixAtom, pos: number) => {
    if (pos < 0 || pos > mat.children.length) {
      throw new Error("Try to add row in invalid position");
    }
    const length = Math.max(...mat.rows.map((row) => row.length));
    const newRow = Array(length)
      .fill(1)
      .map(() => new MathGroup([]));
    mat.rows.splice(pos, 0, newRow);
  };

  export const addColumn = (mat: MatrixAtom, pos: number) => {
    const length = Math.max(...mat.rows.map((row) => row.length));
    if (pos < 0 || pos > length) {
      throw new Error("Try to add column in invalid position");
    }
    mat.rows.forEach((row) => {
      row.splice(pos, 0, new MathGroup([]));
    });
  };

  export const deleteRow = (mat: MatrixAtom, pos: number) => {
    if (mat.rows.length === 1) return;
    if (pos < 0 || pos > mat.rows.length - 1) {
      throw new Error("Try to add row in invalid position");
    }
    mat.rows.splice(pos, 1);
  };

  export const deleteCol = (mat: MatrixAtom, pos: number) => {
    const length = Math.max(...mat.rows.map((row) => row.length));
    if (length === 1) return;
    if (pos < 0 || pos > length - 1) {
      throw new Error("Try to add row in invalid position");
    }
    mat.rows.forEach((row) => {
      row.splice(pos, 1);
    });
  };
}
