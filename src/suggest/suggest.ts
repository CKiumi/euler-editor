import { Atom, MathLatexToHtml } from "euler-tex/src/lib";
import { candidates, candidates2 } from "./data";
import { SuggestView } from "./view";

export module Suggestion {
  export const view = new SuggestView(true);
  export let insert: (atoms: Atom[]) => void;
  // eslint-disable-next-line prefer-const
  export let textMode = false;
  export let onSelected: (name: string, replace: string) => void;

  export const init = (onClick: (name: string, replace: string) => void) => {
    onSelected = onClick;
    view.input.addEventListener("keydown", (ev) => {
      if (ev.code === "Enter") view.select();
      if (ev.code === "ArrowUp") view.up();
      if (ev.code === "ArrowDown") view.down();
    });
    view.input.addEventListener("input", () => {
      set();
    });
  };

  export const reset = () => {
    view.close();
  };

  export const open = (position: [left: number, top: number, top2: number]) => {
    view.open(position[0], position[1], position[2]);
  };

  export const set = () => {
    const text = view.input.value;
    const list = (textMode ? candidates2 : candidates)
      .filter(([c1]) => d(c1.replace("\\", ""), text) > 0)
      .sort(([c1], [c2]) => d(c2.slice(1), text) - d(c1.slice(1), text))
      .map(([text, preview, replaceStr]) => {
        const html = MathLatexToHtml(preview, textMode ? "text" : "display");
        html.classList.remove("text", "display");
        const onClick = () => onSelected(text, replaceStr);
        return { text, preview: html, onClick };
      });
    view.setList(list);
  };

  export const d = (s: string, input: string) => {
    if (s === input) return 3;
    if (s.startsWith(input)) return 2;
    if (s.includes(input)) {
      return 1 - s.indexOf(input) / 100;
    }
    return 0;
  };
}
