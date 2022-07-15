import { SuggestView } from "./view";
import {
  Atom,
  GroupAtom,
  latexToEditableAtom,
  latexToHtml,
  parse,
} from "euler-tex/src/lib";
import { Util } from "../util";
import { LETTER1, LETTER2, LETTER3, OP } from "euler-tex/src/parser/command";
import { collect, expand } from "euler-engine";
const BLOCK: [string, string, string][] = [
  ["\\sum", "\\sum^n_{i=1}", "\\sum^n_{i=1}"],
  ["\\int", "\\int^x_y", "\\int^x_y"],
  [
    "\\pmatrix",
    "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}",
    "\\begin{pmatrix}&\\\\&\\end{pmatrix}",
  ],
  ["\\frac", "\\frac{a}{b}", "\\frac{}{}"],
  ["\\sqrt", "\\sqrt{a}", "\\sqrt{}"],
  ["\\overline", "\\overline{a}", "\\overline{}"],
  ["\\tilde", "\\tilde{a}", "\\tilde{}"],
  ["\\mathbb{C}", "\\mathbb{C}", "\\mathbb{C}"],
  [
    "\\array",
    "\\begin{pmatrix}a\\\\b \\end{pmatrix}",
    "\\begin{pmatrix}\\\\ \\end{pmatrix}",
  ],
];
export module Suggestion {
  export const view = new SuggestView();
  export let replaceRange: (newAtoms: Atom[], range: [number, number]) => void;
  const candidates: [string, string, string][] = [
    ...Object.keys(LETTER1).map((x) => [x, x, x] as [string, string, string]),
    ...Object.keys(LETTER2).map((x) => [x, x, x] as [string, string, string]),
    ...Object.keys(LETTER3).map((x) => [x, x, x] as [string, string, string]),
    ...OP.map((x) => [x, x, x] as [string, string, string]),
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
      .filter(([c1]) => distance(c1.replace("\\", ""), text) > 0)
      .sort(
        ([c1], [c2]) =>
          distance(c2.replace("\\", ""), text) -
          distance(c1.replace("\\", ""), text)
      )
      .map(([suggested, preview, replaceStr]) => {
        return {
          text: suggested,
          preview: latexToHtml(preview),
          onClick: () => {
            const start =
              (buffer[0].parent as GroupAtom).body.indexOf(buffer[0]) - 1;
            replaceRange(parse(replaceStr, true), [
              start,
              start + buffer.length,
            ]);
          },
        };
      });
    if (list.length === 0) reset();
    view.setList(list);
  };

  export const distance = (s: string, input: string) => {
    if (s === input) return 3;
    if (s.startsWith(input)) return 2;
    if (s.includes(input)) {
      return 1 - s.indexOf(input) / 100;
    }
    return 0;
  };
}

export module EngineSuggestion {
  export const view = new SuggestView();
  export let insert: (atoms: Atom[]) => void;
  const candidates: [string, (x: string) => string][] = [
    ["collect", collect],
    ["expand", expand],
  ];

  export const reset = () => {
    view.close();
  };

  export const set = (input: string, position: [left: number, top: number]) => {
    view.open(position[0], position[1]);
    const list = candidates
      .map(([title, func]) => {
        try {
          const result = func(input);
          return result === input ? [title, false] : [title, result];
        } catch (error) {
          return [title, false];
        }
      })
      .filter(([, result]) => result !== false)
      .map(([suggested, result]) => {
        return {
          text: suggested as string,
          preview: document.createElement("span"),
          onClick: () => {
            try {
              insert(latexToEditableAtom(result as string).body.slice(1));
            } catch (error) {
              console.log("ENGINE ERROR");
            }
          },
        };
      });
    if (list.length === 0) reset();
    view.setList(list);
  };
}
