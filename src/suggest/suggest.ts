import { MathLatexToHtml } from "euler-tex/src/lib";
import { candidates, candidates2 } from "./data";
import { SuggestView } from "./view";

export class Suggestion {
  view = new SuggestView(true);
  textMode = false;
  constructor(public onSelected: (name: string, replace: string) => void) {
    this.view.input.addEventListener("keydown", (ev) => {
      if (ev.code === "Enter") this.view.select();
      if (ev.code === "ArrowUp") this.view.up();
      if (ev.code === "ArrowDown") this.view.down();
    });
    this.view.input.addEventListener("input", () => {
      this.set();
    });
  }

  reset = () => {
    this.view.close();
  };

  open = (position: [left: number, top: number, top2: number]) => {
    this.view.open(position[0], position[1], position[2]);
  };

  set = () => {
    const text = this.view.input.value;
    const list = (this.textMode ? candidates2 : candidates)
      .filter(([c1]) => Suggestion.d(c1.replace("\\", ""), text) > 0)
      .sort(
        ([c1], [c2]) =>
          Suggestion.d(c2.slice(1), text) - Suggestion.d(c1.slice(1), text)
      )
      .map(([text, preview, replaceStr]) => {
        const html = MathLatexToHtml(
          preview,
          this.textMode ? "text" : "display"
        );
        html.classList.remove("text", "display");
        const onClick = () => this.onSelected(text, replaceStr);
        return { text, preview: html, onClick };
      });
    this.view.setList(list);
  };

  static d = (s: string, input: string) => {
    if (s === input) return 3;
    if (s.startsWith(input)) return 2;
    if (s.includes(input)) {
      return 1 - s.indexOf(input) / 100;
    }
    return 0;
  };
}
