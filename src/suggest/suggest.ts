import { latex_to_sympy } from "euler-engine";
import { Atom, MathLatexToHtml, parse, prarseMath } from "euler-tex/src/lib";
import { fontMap } from "euler-tex/src/parser/command";
import { candidates, candidates2 } from "./data";
import { SuggestView } from "./view";

export module Suggestion {
  export const view = new SuggestView(true);
  export let insert: (atoms: Atom[]) => void;
  // eslint-disable-next-line prefer-const
  export let textMode = false;
  export let positions: [left: number, top: number] = [0, 0];
  export const init = (onEnter: () => void, onClick: (x: string) => void) => {
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
      set(positions, onClick);
    });
  };
  export const reset = () => {
    view.close();
  };

  export const set = (
    position: [left: number, top: number],
    onClick: (x: string) => void
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
          preview: MathLatexToHtml(preview, textMode ? "text" : "display")
            .children[0] as HTMLElement,
          onClick: () => {
            insert(textMode ? parse(replaceStr) : prarseMath(replaceStr));
            if (Object.keys(fontMap).includes(suggested.slice(1)))
              onClick(suggested);
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
  export const collect = (latex: string): string => {
    return (
      pyodide?.runPython(`
      from sympy import *
      latex((${latex_to_sympy(latex)}).collect(), mat_delim="(")`) ?? latex
    );
  };
  export const expand = (latex: string): string => {
    return (
      pyodide?.runPython(`
      from sympy import *
      latex((${latex_to_sympy(latex)}).expand(), mat_delim="(")`) ?? latex
    );
  };
  export const trigExpand = (latex: string): string => {
    return (
      pyodide?.runPython(`
      from sympy import *
      latex((${latex_to_sympy(latex)}).expand(trig=True), mat_delim="(")`) ??
      latex
    );
  };
  export const det = (latex: string): string => {
    return (
      pyodide?.runPython(`
      from sympy import *
      latex((${latex_to_sympy(latex)}).det(), mat_delim="(")`) ?? latex
    );
  };
  export const solve = (latex: string): string => {
    return (
      pyodide?.runPython(`
      from sympy import *
      latex(solve(${latex_to_sympy(latex)}, dict=True), mat_delim="(")`) ??
      latex
    );
  };
  export const eigen = (latex: string): string => {
    return (
      pyodide?.runPython(`
      from sympy import *
      latex((${latex_to_sympy(latex)}).eigenvals(), mat_delim="(")`) ?? latex
    );
  };
  export const simplify = (latex: string): string => {
    return (
      pyodide?.runPython(`
      from sympy import *
      latex(simplify(${latex_to_sympy(latex)}), mat_delim="(")`) ?? latex
    );
  };
  export const factor = (latex: string): string => {
    return (
      pyodide?.runPython(`
      from sympy import *
      latex(factor(${latex_to_sympy(latex)}), mat_delim="(")`) ?? latex
    );
  };
  export let insert: (atoms: Atom[]) => void;
  const candidates: [string, (x: string) => string][] = [
    ["collect", collect],
    ["expand", expand],
    ["trig expand", trigExpand],
    ["det", det],
    ["eigenvals", eigen],
    // ["solve", solve],
    ["simplify", simplify],
    ["factor", factor],
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
              insert(prarseMath(result as string, true));
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
