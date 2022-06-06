import { SuggestView } from "./view";
import { Atom, GroupAtom, latexToHtml, parse } from "euler-tex/src/lib";
import { Util } from "../util";
import { LETTER1, LETTER2 } from "euler-tex/src/parser/command";

const BLOCK: [string, string][] = [
  ["\\sum", "\\sum^x_x"],
  ["\\int", "\\int^x_x"],
  ["\\pmatrix", "\\begin{pmatrix}x&x\\\\x&x\\end{pmatrix}"],
  ["\\frac", "\\frac{a}{b}"],
  ["\\sqrt", "\\sqrt{a}"],
];
export module Suggestion {
  export const view = new SuggestView();
  export let replaceRange: (newAtoms: Atom[], range: [number, number]) => void;
  const candidates: [string, string][] = [
    ...Object.keys(LETTER1).map((x) => [x, x] as [string, string]),
    ...Object.keys(LETTER2).map((x) => [x, x] as [string, string]),
    ...BLOCK,
  ];
  export const buffer: Atom[] = [];

  export const reset = () => {
    buffer.splice(0, buffer.length);
    view.close();
  };

  export const set = (atoms: Atom[], position: [left: number, top: number]) => {
    view.open(position[0], position[1]);
    atoms.forEach((atom) => buffer.push(atom));
    const text = buffer.map((atom) => Util.serialize(atom)).join("");
    const list = candidates
      .filter(([c]) => c.startsWith("\\" + text) || c.startsWith(text))
      .map(([suggested, preview]) => {
        return {
          text: suggested,
          preview: latexToHtml(preview),
          onClick: () => {
            const start =
              (buffer[0].parent as GroupAtom).body.indexOf(buffer[0]) - 1;
            replaceRange(parse(preview, true), [start, start + buffer.length]);
          },
        };
      });
    if (list.length === 0) reset();
    view.setList(list);
  };
}
