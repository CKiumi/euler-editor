import { Atom, GroupAtom, parse } from "eulertex/src/lib";
import { Util } from "./util";
export type SetManager = (target: GroupAtom, pos: number) => void;
export module Suggestion {
  let replaceRange: (newAtoms: Atom[], range: [number, number]) => void;
  const candidates: string[] = ["a", "\\sqrt{a}"];
  let position = 0;
  export const element = document.createElement("div");
  export const buffer: Atom[] = [];
  export const set = (left: number, top: number) => {
    element.style.transform = `translate(${left}px,${top}px)`;
  };
  export const setUp = (
    fn2: (newAtoms: Atom[], range: [number, number]) => void
  ) => {
    element.addEventListener("pointerdown", (ev) => ev.stopPropagation());
    element.className = "suggestions";
    replaceRange = fn2;
    reset();
  };

  export const reset = () => {
    position = 0;
    buffer.splice(0, buffer.length);
    element.style.visibility = "hidden";
  };

  export const isOpen = () => element.style.visibility !== "hidden";

  const at = () => element.children[position];

  export const add = (atoms: Atom[], variable: string[]) => {
    atoms.forEach((atom) => buffer.push(atom));
    search(variable);
    if (!at()) return;
    element.style.visibility = "visible";
    at().classList.add("focus");
  };

  export const select = () => {
    at().dispatchEvent(new Event("click", {}));
    position = 0;
  };

  export const up = () => {
    const newPos = position === 0 ? element.children.length - 1 : position - 1;
    at().classList.remove("focus");
    position = newPos;
    at().classList.add("focus");
  };

  export const down = () => {
    const newPos = position === element.children.length - 1 ? 0 : position + 1;
    at().classList.remove("focus");
    position = newPos;
    at().classList.add("focus");
  };

  const search = (variable: string[]) => {
    element.innerHTML = "";
    const text = buffer.map((atom) => Util.serialize(atom)).join("");
    [...candidates, ...variable.filter((c) => c.length !== 1)]
      .filter(
        (candidate) =>
          candidate.startsWith("\\" + text) || candidate.startsWith(text)
      )
      .forEach(function (suggested) {
        const div = document.createElement("div");
        const atom = parse(suggested)[0];
        atom.toBox().toHtml();
        const wrapper = document.createElement("div");
        wrapper.classList.add("hbox");
        atom.elem && wrapper.appendChild(atom.elem);
        div.appendChild(wrapper);
        div.onclick = () => {
          const start =
            (buffer[0].parent as GroupAtom).body.indexOf(buffer[0]) - 1;
          replaceRange(parse(suggested), [start, start + buffer.length]);
          div.classList.remove("focus");
        };
        element.appendChild(div);
        const pHeight = 21;
        const cHeight = wrapper.getBoundingClientRect().height;
        const multiplier = (0.9 * pHeight) / cHeight;
        if (multiplier < 1) {
          wrapper.style.fontSize = multiplier + "em";
        }
      });
  };
}
