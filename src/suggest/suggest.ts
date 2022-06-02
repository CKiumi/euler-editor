import { SuggestView } from "./view";
import { Atom, GroupAtom, latexToHtml, parse } from "euler-tex/src/lib";
import { Util } from "../util";

const SYM = [
  "alpha",
  "beta",
  "chi",
  "delta",
  "epsilon",
  "varepsilon",
  "eta",
  "gamma",
  "iota",
  "kappa",
  "lambda",
  "mu",
  "nu",
  "omega",
  "phi",
  "varphi",
  "pi",
  "psi",
  "rho",
  "sigma",
  "varsigma",
  "tau",
  "theta",
  "vartheta",
  "upsilon",
  "xi",
  "zeta",
  "Delta",
  "Gamma",
  "Lambda",
  "Omega",
  "Phi",
  "Pi",
  "Psi",
  "Sigma",
  "Theta",
  "Upsilon",
  "Xi",
];
const BLOCK: [string, string][] = [
  ["\\pmatrix", "\\begin{pmatrix}x&x\\\\x&x\\end{pmatrix}"],
  ["\\frac", "\\frac{a}{b}"],
  ["\\sqrt", "\\sqrt{a}"],
];
export module Suggestion {
  export const view = new SuggestView();
  export let replaceRange: (newAtoms: Atom[], range: [number, number]) => void;
  const candidates: [string, string][] = [
    ...(SYM.map((x) => ["\\" + x, "\\" + x]) as [string, string][]),
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
            replaceRange(parse(preview), [start, start + buffer.length]);
          },
        };
      });
    view.setList(list);
  };
}
