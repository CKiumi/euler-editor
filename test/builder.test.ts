import { MathGroup, MatrixAtom, SymAtom } from "euler-tex/src/lib";
import { expect, test } from "vitest";
import { Builder } from "../src/suggest/builder";

test("matrix builder", () => {
  const j = new SymAtom("ord", "j", "j", ["Math-I"]);
  const group = new MathGroup([j]);
  const targetGroup = new MathGroup([j]);
  const mat = new MatrixAtom(
    [
      [group, group],
      [targetGroup, group],
    ],
    "pmatrix",
    []
  );

  expect(Builder.getCurRowCol(targetGroup, mat)).toEqual([1, 0]);
  expect(() => Builder.addRow(mat, -1)).toThrow();
  expect(() => Builder.addRow(mat, 3)).toThrow();
  expect(() => Builder.deleteRow(mat, 2)).toThrow();
  Builder.addRow(mat, 2);
  console.log(mat.labels[0]);
  expect(mat).toEqual(
    new MatrixAtom([
      [group, group],
      [group, group],
      [new MathGroup([]), new MathGroup([])],
    ])
  );
  Builder.addRow(mat, 0);
  expect(mat).toEqual(
    new MatrixAtom([
      [new MathGroup([]), new MathGroup([])],
      [group, group],
      [group, group],
      [new MathGroup([]), new MathGroup([])],
    ])
  );
  Builder.addRow(mat, 1);
  expect(mat).toEqual(
    new MatrixAtom([
      [new MathGroup([]), new MathGroup([])],
      [new MathGroup([]), new MathGroup([])],
      [group, group],
      [group, group],
      [new MathGroup([]), new MathGroup([])],
    ])
  );

  Builder.deleteRow(mat, 0);
  expect(mat).toEqual(
    new MatrixAtom([
      [new MathGroup([]), new MathGroup([])],
      [group, group],
      [group, group],
      [new MathGroup([]), new MathGroup([])],
    ])
  );
  const mat2 = new MatrixAtom([
    [group, group],
    [targetGroup, group],
  ]);
  Builder.addColumn(mat2, 2);
  expect(mat2).toEqual(
    new MatrixAtom([
      [group, group, new MathGroup([])],
      [targetGroup, group, new MathGroup([])],
    ])
  );
  Builder.deleteCol(mat2, 2);
  expect(mat2).toEqual(
    new MatrixAtom([
      [group, group],
      [group, group],
    ])
  );
});
