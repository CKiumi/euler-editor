import { Atom, MathLatexToHtml } from "euler-tex/src/lib";
import { candidates, candidates2 } from "./data";
import { SuggestView } from "./view";

export module Suggestion {
  export const view = new SuggestView(true);
  export let insert: (atoms: Atom[]) => void;
  // eslint-disable-next-line prefer-const
  export let textMode = false;
  export let positions: [left: number, top: number] = [0, 0];
  export let onSelected: (name: string, replace: string) => void;
  export const init = (onClick: (name: string, replace: string) => void) => {
    onSelected = onClick;
    view.input.addEventListener("keydown", (ev) => {
      if (ev.code === "Enter") view.select();
      if (ev.code === "ArrowUp") view.up();
      if (ev.code === "ArrowDown") view.down();
    });
    view.input.addEventListener("input", () => {
      set(positions);
    });
  };
  export const reset = () => {
    view.close();
  };

  export const set = (position: [left: number, top: number]) => {
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
            onSelected(suggested, replaceStr);
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
