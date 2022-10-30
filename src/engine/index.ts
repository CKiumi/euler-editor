import { latex_to_sympy } from "euler-engine";
import { SuggestView } from "../suggest/view";
import { Pyodide } from "./pyodide";
export class Engine {
  view = new SuggestView();
  funcs: [string, (x: string) => Promise<string>][] = [
    ["collect", Pyodide.collect],
    ["expand", Pyodide.expand],
    ["trig expand", Pyodide.trigExpand],
    ["det", Pyodide.det],
    ["eigenvals", Pyodide.eigen],
    ["solve", Pyodide.solve],
    ["simplify", Pyodide.simplify],
    ["factor", Pyodide.factor],
    ["mock", Pyodide.mock],
  ];
  constructor(public onSelected: (x: Promise<string>) => void) {}

  reset = () => {
    this.view.close();
  };

  set = (
    input: string,
    position: [left: number, top: number, top2: number]
  ) => {
    try {
      const sympy = latex_to_sympy(input).replaceAll("\\", "\\\\");
      const list = this.funcs.map(([suggested, func]) => {
        return {
          text: suggested,
          preview: document.createElement("span"),
          onClick: async () => {
            this.onSelected(func(sympy));
          },
        };
      });
      this.view.open(position[0], position[1], position[2]);
      this.view.setList(list);
    } catch (error) {
      return;
    }
  };
}
