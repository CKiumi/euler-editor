import { SuggestView } from "./view";
import {
  Atom,
  GroupAtom,
  latexToEditableAtom,
  latexToHtml,
  parse,
} from "euler-tex/src/lib";
import { Util } from "../util";
import { LETTER1, LETTER2 } from "euler-tex/src/parser/command";
import { collect } from "euler-engine";
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
      .filter(([c1]) => distance(c1.replace("\\", ""), text) > 0)
      .sort(
        ([c1], [c2]) =>
          distance(c2.replace("\\", ""), text) -
          distance(c1.replace("\\", ""), text)
      )
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
  const candidates: string[] = ["collect"];

  export const reset = () => {
    view.close();
  };

  export const set = (input: string, position: [left: number, top: number]) => {
    view.open(position[0], position[1]);
    const list = candidates
      .map((cand) => {
        try {
          const result = collect(input);
          return result === input ? [cand, false] : [cand, collect(input)];
        } catch (error) {
          return [cand, false];
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
