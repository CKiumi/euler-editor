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
  GroupAtom,
  FirstAtom,
} from "euler-tex/src/lib";
import { Builder, Util } from "../src/util";

test("children", () => {
  const j = new SymAtom("ord", "j", "Math-I");
  const group = new GroupAtom([j], true);
  const f = new FirstAtom();

  expect(Util.children(j)).toStrictEqual([j]);
  const accent = new SymAtom("ord", "^", "Main-R");
  const accAtom = new AccentAtom(group, accent);
  expect(Util.children(accAtom)).toStrictEqual([f, j, accAtom]);
  const olAtom = new OverlineAtom(group);
  expect(Util.children(olAtom)).toStrictEqual([f, j, olAtom]);
  const lrAtom = new LRAtom("(", ")", group);
  expect(Util.children(lrAtom)).toStrictEqual([f, j, lrAtom]);
  const sqrtAtom = new SqrtAtom(group);
  expect(Util.children(sqrtAtom)).toStrictEqual([f, j, sqrtAtom]);
  const fracAtom = new FracAtom(group, group);
  expect(Util.children(fracAtom)).toStrictEqual([f, j, f, j, fracAtom]);
  const mat = new MatrixAtom(
    [
      [group, group],
      [group, group],
    ],
    "pmatrix"
  );
  expect(Util.children(mat)).toStrictEqual([f, j, f, j, f, j, f, j, mat]);
  const supsubatom = new SupSubAtom(j, group, group);
  expect(Util.children(supsubatom)).toStrictEqual([f, j, f, j, supsubatom]);
});

test("serialize", () => {
  const j = new SymAtom("ord", "j", "Math-I");
  const group = new GroupAtom([j], true);
  expect(Util.serialize(j)).toStrictEqual("j");
  const accent = new SymAtom("ord", "^", "Main-R");
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
  const j = new SymAtom("ord", "j", "Math-I");
  const group = new GroupAtom([j], true);
  const targetGroup = new GroupAtom([j], true);
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
      [new GroupAtom([], true), new GroupAtom([], true)],
    ])
  );
  Builder.addRow(mat, 0);
  expect(mat).toEqual(
    new MatrixAtom([
      [new GroupAtom([], true), new GroupAtom([], true)],
      [group, group],
      [group, group],
      [new GroupAtom([], true), new GroupAtom([], true)],
    ])
  );
  Builder.addRow(mat, 1);
  expect(mat).toEqual(
    new MatrixAtom([
      [new GroupAtom([], true), new GroupAtom([], true)],
      [new GroupAtom([], true), new GroupAtom([], true)],
      [group, group],
      [group, group],
      [new GroupAtom([], true), new GroupAtom([], true)],
    ])
  );

  Builder.deleteRow(mat, 0);
  expect(mat).toEqual(
    new MatrixAtom([
      [new GroupAtom([], true), new GroupAtom([], true)],
      [group, group],
      [group, group],
      [new GroupAtom([], true), new GroupAtom([], true)],
    ])
  );
  const mat2 = new MatrixAtom([
    [group, group],
    [targetGroup, group],
  ]);
  Builder.addColumn(mat2, 2);
  expect(mat2).toEqual(
    new MatrixAtom([
      [group, group, new GroupAtom([], true)],
      [targetGroup, group, new GroupAtom([], true)],
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
