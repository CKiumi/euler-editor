import { Article, MatrixAtom, Section } from "euler-tex/src/lib";
import { Util } from "../util";

export interface List {
  text: string;
  preview: HTMLElement;
  onClick: () => void;
}

export interface RefList {
  text: string;
  preview: HTMLElement;
  sub?: boolean;
}
export class SuggestView {
  elem: HTMLDivElement = document.createElement("div");
  list: HTMLDivElement = document.createElement("div");
  input = document.createElement("input");
  pos = 0;

  constructor(hasInput = false) {
    if (hasInput) {
      this.input.spellcheck = false;
      this.input.type = "text";
      this.elem.append(this.input);
    }
    this.elem.style.visibility = "hidden";
    this.elem.className = "suggestion";
    this.list.className = "list";
    this.elem.append(this.list);
    this.elem.addEventListener("pointerdown", (ev) => ev.stopPropagation());
  }

  isOpen = () => this.elem.style.visibility !== "hidden";

  at = () => this.list.children[this.pos];

  open(left: number, top: number, secTop: number) {
    const { width, height } = this.elem.getBoundingClientRect();
    const right = left + width;
    const bottom = top + height;
    if (right > window.innerWidth) left -= right - window.innerWidth;
    if (bottom > window.innerHeight) top = secTop - height;
    this.elem.style.visibility = "unset";
    this.elem.style.transform = `translate(${left}px,${top}px)`;
    this.input.focus();
  }

  close() {
    this.input.value = "";
    this.elem.style.visibility = "hidden";
  }

  select = () => {
    this.at().dispatchEvent(new Event("click", {}));
    this.pos = 0;
    this.close();
  };

  up() {
    this.render(this.pos === 0 ? this.list.children.length - 1 : this.pos - 1);
  }

  down() {
    this.render(this.pos === this.list.children.length - 1 ? 0 : this.pos + 1);
  }

  render(newPos: number) {
    this.at().classList.remove("focus");
    this.pos = newPos;
    this.at().classList.add("focus");
    const { bottom, top } = this.at().getBoundingClientRect();
    const rect = this.elem.getBoundingClientRect();
    if (bottom > rect.bottom) this.elem.scrollTop += bottom - rect.bottom;
    if (top < rect.top) this.elem.scrollTop -= rect.top - top;
  }

  setList = (variable: List[]) => {
    this.list.innerHTML = "";
    variable.forEach(({ text, preview, onClick }) => {
      const div = document.createElement("div");
      const wrapper = document.createElement("div");
      wrapper.classList.add("hbox", "preview");
      wrapper.append(preview);
      div.append(text, wrapper);
      div.onclick = () => {
        onClick();
        this.close();
      };
      this.list.appendChild(div);
      const pHeight = 21;
      const cHeight = wrapper.getBoundingClientRect().height;
      const multiplier = (0.9 * pHeight) / cHeight;
      if (multiplier < 1) {
        wrapper.style.fontSize = multiplier + "em";
      }
    });
    this.pos = 0;
    this.at()?.classList.add("focus");
  };
}

export class RefView {
  elem = document.createElement("div");
  list = document.createElement("div");
  pos = 0;
  constructor(public onSelected: (ref: string) => void) {
    this.elem.className = "refview";
    this.list.className = "list";
    this.elem.tabIndex = 0;
    this.elem.append(this.list);
    this.elem.addEventListener("pointerdown", (ev) => {
      ev.stopPropagation();
      if (ev.target === this.elem) this.close();
    });
    this.elem.addEventListener("pointermove", (ev) => {
      ev.stopPropagation();
    });
    this.elem.addEventListener("keydown", (ev) => {
      ev.preventDefault();
      if (ev.key === "ArrowUp") this.up();
      if (ev.key === "ArrowDown") this.down();
      if (ev.key === "Enter") this.select();
    });
  }

  at = () => this.children()[this.pos];

  open() {
    this.elem.style.display = "flex";
    this.elem.focus();
  }

  children() {
    return Array.from(this.list.children).filter(
      (e) => !e.classList.contains("sub")
    );
  }
  close() {
    this.list.innerHTML = "";
    this.elem.style.display = "none";
  }

  select = () => {
    this.at().dispatchEvent(new Event("click", {}));
    this.pos = 0;
    this.close();
  };

  up() {
    this.render(this.pos === 0 ? this.children().length - 1 : this.pos - 1);
  }

  down() {
    this.render(this.pos === this.children().length - 1 ? 0 : this.pos + 1);
  }

  render(newPos: number) {
    this.at().classList.remove("focus");
    this.pos = newPos;
    this.at().classList.add("focus");
    const { bottom, top } = this.at().getBoundingClientRect();
    const rect = this.list.getBoundingClientRect();
    if (bottom > rect.bottom) this.list.scrollTop += bottom - rect.bottom;
    if (top < rect.top) this.list.scrollTop -= rect.top - top;
  }

  setList = (variable: RefList[]) => {
    document.body.style.overflow = "hidden";
    variable.forEach(({ sub, text, preview }) => {
      const div = document.createElement("div");
      div.append(preview);
      if (text) {
        const label = document.createElement("div");
        label.classList.add("lb");
        label.innerText = "Label: " + text;
        div.append(label);
      }
      if (sub) div.classList.add("sub");
      div.onclick = () => {
        this.close();
        this.onSelected(text);
        document.body.style.overflow = "unset";
      };
      this.list.append(div);
    });
    this.pos = 0;
    this.at()?.classList.add("focus");
  };

  atomToList = (atom: Article) => {
    const list: RefList[] = [];
    const atoms = atom.body.filter((a) => Util.idLabeled(a));
    atoms.forEach((atom) => {
      if (atom instanceof MatrixAtom) {
        if (atom.labels.length === 0 || !atom.elem) return;
        const preview = atom.elem.cloneNode(true) as HTMLElement;
        list.push({ sub: true, text: "", preview });
        atom.labels.forEach((_, i) => {
          const text = atom.labels[i];
          const preview = document.createElement("span");
          list.push({ text, preview });
        });
        return;
      }
      if (!atom.elem || !(atom as Section).label) return;
      const text = (atom as Section).label;
      const preview = atom.elem.cloneNode(true) as HTMLElement;
      list.push({ text, preview });
    });
    return list;
  };
}
