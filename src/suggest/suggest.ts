import { collect, expand, latex_to_sympy } from "euler-engine";
import {
  Atom,
  latexToEditableAtoms,
  MathLatexToHtml,
  parse,
} from "euler-tex/src/lib";
import {
  AMS_BIN,
  AMS_MISC,
  AMS_NBIN,
  AMS_NREL,
  AMS_REL,
  BIN,
  LETTER1,
  LETTER2,
  LETTER3,
  MISC,
  OP,
  REL,
} from "euler-tex/src/parser/command";
import { SuggestView } from "./view";
const BLOCK: [string, string, string][] = [
  ["\\sum", "\\sum^n_{i=1}", "\\sum^n_{i=1}"],
  ["\\int", "\\int^x_y", "\\int^x_y"],
  ...["pmatrix", "bmatrix", "vmatrix", "Vmatrix", "Bmatrix"].map((name) => {
    return [
      "\\" + name,
      `\\begin{${name}}a&b\\\\c&d\\end{${name}}`,
      `\\begin{${name}}&\\\\&\\end{${name}}`,
    ] as [string, string, string];
  }),
  [
    "\\aligned",
    "\\begin{aligned}a&=b+c\\\\d&=e+f\\end{aligned}",
    "\\begin{aligned}&=\\\\&=\\end{aligned}",
  ],
  [
    "\\cases",
    "\\begin{cases}a&=b+c\\\\d&=e+f\\end{cases}",
    "\\begin{cases}&=\\\\&=\\end{cases}",
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

const MACRO = ["\\bra{}", "\\ket{}", "\\braket{}"];
export module Suggestion {
  export const view = new SuggestView(true);
  export let insert: (atoms: Atom[]) => void;
  const candidates: [string, string, string][] = [
    ...Object.keys(LETTER1).map((x) => [x, x, x] as [string, string, string]),
    ...Object.keys(LETTER2).map((x) => [x, x, x] as [string, string, string]),
    ...Object.keys(LETTER3).map((x) => [x, x, x] as [string, string, string]),
    ...Object.keys(MISC).map((x) => [x, x, x] as [string, string, string]),
    ...Object.keys(BIN).map((x) => [x, x, x] as [string, string, string]),
    ...Object.keys(REL).map((x) => [x, x, x] as [string, string, string]),
    ...Object.keys(AMS_MISC).map((x) => [x, x, x] as [string, string, string]),
    ...Object.keys(AMS_BIN).map((x) => [x, x, x] as [string, string, string]),
    ...Object.keys(AMS_REL).map((x) => [x, x, x] as [string, string, string]),
    ...Object.keys(AMS_NBIN).map((x) => [x, x, x] as [string, string, string]),
    ...Object.keys(AMS_NREL).map((x) => [x, x, x] as [string, string, string]),
    ...MACRO.map((x) => [x, x, x] as [string, string, string]),
    ...OP.map((x) => [x, x, x] as [string, string, string]),
    ...BLOCK,
  ];
  const candidates2: [string, string, string][] = [["Equation", "", "\\[\\]"]];
  export let positions: [left: number, top: number] = [0, 0];
  export const init = (onEnter: () => void) => {
    view.input.addEventListener("keydown", (ev) => {
      if (ev.code === "Enter") {
        view.select();
        onEnter();
      }
      if (ev.code === "ArrowUp") {
        view.up();
      }
      if (ev.code === "ArrowDown") {
        view.down();
      }
    });
    view.input.addEventListener("input", () => {
      set(positions);
    });
  };
  export const reset = () => {
    view.close();
  };

  export const set = (
    position: [left: number, top: number],
    textMode = false
  ) => {
    view.open(position[0], position[1]);
    positions = position;
    const text = view.input.value;
    const list = (textMode ? candidates2 : candidates)
      .filter(([c1]) => distance(c1.replace("\\", ""), text) > 0)
      .sort(
        ([c1], [c2]) =>
          distance(c2.replace("\\", ""), text) -
          distance(c1.replace("\\", ""), text)
      )
      .map(([suggested, preview, replaceStr]) => {
        return {
          text: suggested,
          preview: MathLatexToHtml(preview),
          onClick: () => {
            insert(
              textMode
                ? latexToEditableAtoms(replaceStr)
                : parse(replaceStr, true)
            );
          },
        };
      });
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
  export let pyodide:
    | {
        loadPackage: (arg0: string) => Promise<void>;
        runPython: (arg0: string) => string;
      }
    | undefined = undefined;
  export const loadSympy = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    loadPyodide().then((p) => {
      pyodide = p;
      pyodide?.loadPackage("sympy").then(() => {
        pyodide?.runPython("from sympy import *");
      });
    });
  };

  export const trigExpand = (latex: string): string => {
    return (
      pyodide?.runPython(`
      from sympy import *
      latex((${latex_to_sympy(latex)}).expand(trig=True))`) ?? latex
    );
  };
  export let insert: (atoms: Atom[]) => void;
  const candidates: [string, (x: string) => string][] = [
    ["collect", collect],
    ["expand", expand],
    ["trig expand", trigExpand],
  ];

  export const reset = () => {
    view.close();
  };

  export const set = async (
    input: string,
    position: [left: number, top: number]
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 1));
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
              insert(parse(result as string, true));
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
