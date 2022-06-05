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
import { Util } from "../src/util";

test("children", () => {
  const j = new SymAtom("ord", "j", "Math-I");
  const group = new GroupAtom([j], true);
  const first = new FirstAtom();

  expect(Util.children(j)).toStrictEqual([j]);
  const accent = new SymAtom("ord", "^", "Main-R");
  const accAtom = new AccentAtom(group, accent);
  expect(Util.children(accAtom)).toStrictEqual([first, j, accAtom]);
  const olAtom = new OverlineAtom(group);
  expect(Util.children(olAtom)).toStrictEqual([first, j, olAtom]);
  const lrAtom = new LRAtom("(", ")", group);
  expect(Util.children(lrAtom)).toStrictEqual([first, j, lrAtom]);
  const sqrtAtom = new SqrtAtom(group);
  expect(Util.children(sqrtAtom)).toStrictEqual([first, j, sqrtAtom]);
  const fracAtom = new FracAtom(group, group);
  expect(Util.children(fracAtom)).toStrictEqual([first, j, first, j, fracAtom]);
  const mat = new MatrixAtom(
    [
      [group, group],
      [group, group],
    ],

    "pmatrix"
  );
  expect(Util.children(mat)).toStrictEqual([
    first,
    j,
    first,
    j,
    first,
    j,
    first,
    j,
    mat,
  ]);
  const supsubatom = new SupSubAtom(j, group, group);
  expect(Util.children(supsubatom)).toStrictEqual([
    first,
    j,
    first,
    j,
    supsubatom,
  ]);
});
