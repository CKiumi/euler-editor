import { expect, test } from "vitest";
import {
  SupSubAtom,
  MatrixAtom,
  FracAtom,
  AccentAtom,
  LRAtom,
  OverlineAtom,
  SqrtAtom,
  SymAtom,
  MathGroup,
} from "euler-tex/src/lib";
import { Util } from "../src/util";
import { Builder } from "../src/suggest/builder";

test("serialize", () => {
  const j = new SymAtom("ord", "j", "j", ["Math-I"]);
  const group = new MathGroup([j]);
  expect(Util.serialize(j)).toStrictEqual("j");
  const accent = new SymAtom("ord", "^", "^", ["Main-R"]);
  const accAtom = new AccentAtom(group, accent);
  expect(Util.serialize(accAtom)).toStrictEqual("\\hat{j}");
  const olAtom = new OverlineAtom(group);
  expect(Util.serialize(olAtom)).toStrictEqual("\\overline{j}");
  const lrAtom = new LRAtom("(", ")", group);
  expect(Util.serialize(lrAtom)).toStrictEqual("\\left(j \\right)");
  const sqrtAtom = new SqrtAtom(group);
  expect(Util.serialize(sqrtAtom)).toStrictEqual("\\sqrt{j}");
  const fracAtom = new FracAtom(group, group);
  expect(Util.serialize(fracAtom)).toStrictEqual("\\frac{j}{j}");
  const mat = new MatrixAtom(
    [
      [group, group],
      [group, group],
    ],

    "pmatrix"
  );
  expect(Util.serialize(mat)).toStrictEqual(
    "\\begin{pmatrix}j & j \\\\ j & j\\end{pmatrix}"
  );
  const supsubatom = new SupSubAtom(j, group, group);
  expect(Util.serialize(supsubatom)).toStrictEqual("j_{j}^{j}");
});

test("matrix builder", () => {
  const j = new SymAtom("ord", "j", "j", ["Math-I"]);
  const group = new MathGroup([j]);
  const targetGroup = new MathGroup([j]);
  const mat = new MatrixAtom(
    [
      [group, group],
      [targetGroup, group],
    ],
    "pmatrix"
  );
  expect(Builder.getCurRowCol(targetGroup, mat)).toEqual([1, 0]);
  expect(() => Builder.addRow(mat, -1)).toThrow();
  expect(() => Builder.addRow(mat, 3)).toThrow();
  expect(() => Builder.deleteRow(mat, 2)).toThrow();
  Builder.addRow(mat, 2);

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
