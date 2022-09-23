import { latex_to_sympy } from "euler-engine";
import { SuggestView } from "../suggest/view";
import { Pyodide } from "./pyodide";

export module Engine {
  export const view = new SuggestView();
  let onSelect: (x: Promise<string>) => void;
  export const init = (onSelected: (x: Promise<string>) => void) => {
    onSelect = onSelected;
  };

  const funcs: [string, (x: string) => Promise<string>][] = [
    ["collect", Pyodide.collect],
    ["expand", Pyodide.expand],
    ["trig expand", Pyodide.trigExpand],
    ["det", Pyodide.det],
    ["eigenvals", Pyodide.eigen],
    ["solve", Pyodide.solve],
    ["simplify", Pyodide.simplify],
    ["factor", Pyodide.factor],
  ];

  export const reset = () => {
    view.close();
  };

  export const set = (
    input: string,
    position: [left: number, top: number, top2: number]
  ) => {
    try {
      const sympy = latex_to_sympy(input).replaceAll("\\", "\\\\");
      const list = funcs.map(([suggested, func]) => {
        return {
          text: suggested,
          preview: document.createElement("span"),
          onClick: async () => {
            onSelect(func(sympy));
          },
        };
      });
      view.open(position[0], position[1], position[2]);
      view.setList(list);
    } catch (error) {
      return;
    }
  };
}
