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
    this.elem.className = "suggestion";
    this.list.className = "list";
    this.elem.append(this.list);
    this.elem.addEventListener("pointerdown", (ev) => ev.stopPropagation());
  }

  isOpen = () => this.elem.style.visibility !== "hidden";

  at = () => this.list.children[this.pos];

  open(left: number, top: number) {
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
    const newPos =
      this.pos === 0 ? this.list.children.length - 1 : this.pos - 1;
    this.at().classList.remove("focus");
    this.pos = newPos;
    this.at().classList.add("focus");
  }

  down() {
    const newPos =
      this.pos === this.list.children.length - 1 ? 0 : this.pos + 1;
    this.at().classList.remove("focus");
    this.pos = newPos;
    this.at().classList.add("focus");
  }

  setList = (
    variable: { text: string; preview: HTMLElement; onClick: () => void }[]
  ) => {
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
