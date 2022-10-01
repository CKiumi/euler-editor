import EulerEditor from "./note";

export class Auto {
  textarea: HTMLTextAreaElement;
  input: HTMLInputElement;
  clipboard = "";
  constructor(
    public e: EulerEditor,
    public speed: number,
    public noWait = false
  ) {
    this.textarea = e.textarea;
    const input = e.querySelector(".suggestion")?.querySelector("input");
    if (!input) throw new Error("input not found");
    this.input = input;
  }
  wait = (time: number) =>
    !this.noWait && new Promise((r) => setTimeout(r, time / this.speed));

  waitEngine = async () => {
    if (this.e.engineRunning === true) {
      await new Promise((r) => setTimeout(r, 100));
      await this.waitEngine();
    }
  };

  write = async (s: string) => {
    await this.wait(500);
    for (const c of s.split("")) {
      this.e.textarea.dispatchEvent(new InputEvent("input", { data: c }));
      await this.wait(20);
    }
  };

  keydown = async (key: string) => {
    await this.wait(300);
    this.textarea.dispatchEvent(
      new KeyboardEvent("keydown", { key, code: key })
    );
  };

  leftToStart = async () => {
    let count = 0;
    this.speed *= 10;
    while (this.e.caret.cur() !== this.e.root.body[0]) {
      await this.keydown("ArrowLeft");
      count++;
      if (count > 100000) throw new Error("Unable to reach to start");
    }
    this.speed /= 10;
  };

  rightToEnd = async () => {
    let count = 0;
    this.speed *= 10;
    while (
      this.e.caret.cur() !== this.e.root.body[this.e.root.body.length - 1]
    ) {
      await this.keydown("ArrowRight");
      count++;
      if (count > 100000) throw new Error("Unable to reach to end");
    }
    this.speed /= 10;
  };

  deleteToStart = async () => {
    let count = 0;
    this.speed *= 100;
    const length = this.e.root.body.length;
    while (this.e.root.body.length !== 1) {
      await this.keydown("Backspace");
      count++;
      if (count > length) throw new Error("Unable to reach to end");
    }
    this.speed /= 100;
  };

  selectAll = async () => {
    await this.wait(800);
    this.textarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "a", metaKey: true })
    );
  };

  right = async () => {
    await this.keydown("ArrowRight");
  };

  left = async () => {
    await this.keydown("ArrowLeft");
  };

  up = async () => {
    await this.keydown("ArrowUp");
  };

  down = async () => {
    await this.keydown("ArrowDown");
  };

  command = async (s: string) => {
    await this.wait(500);
    this.textarea.dispatchEvent(new InputEvent("input", { data: "\\" }));
    this.textarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "\\", code: "Backslash" })
    );
    await this.wait(500);

    for (const c of s.slice(1)) {
      await this.wait(50);
      this.input && (this.input.value += c);
      this.input.dispatchEvent(new InputEvent("input", { data: "" }));
    }
    await this.wait(800);
    this.input.dispatchEvent(new KeyboardEvent("keydown", { code: "Enter" }));
  };

  inline = async () => {
    await this.keydown("$");
    this.textarea.dispatchEvent(new InputEvent("input", { data: "$" }));
    await this.write("e^i");
    await this.command("\\pi");
    await this.right();
    await this.write("=-1");
    await this.right();
  };

  section = async () => {
    await this.command("\\section");
    await this.write("Introduction");
    await this.right();
  };

  selectLeft = async () => {
    this.textarea.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "ArrowLeft",
        key: "ArrowLeft",
        shiftKey: true,
        metaKey: true,
        ctrlKey: true,
      })
    );
  };

  extendLeft = async () => {
    this.textarea.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "ArrowLeft",
        key: "ArrowLeft",
        shiftKey: true,
      })
    );
  };

  eq = async () => {
    await this.wait(500);
    await this.command("\\equation");
  };

  eq2 = async () => {
    await this.wait(500);
    await this.command("\\equation*");
  };

  copy = async () => {
    await this.wait(500);
    this.clipboard = this.e.caret.getValue();
  };

  paste = async () => {
    await this.wait(500);
    this.e.insert(this.clipboard);
  };

  matrix = async () => {
    this.speed *= 2;
    await this.command("\\pmatrix");
    await this.write("a");
    await this.down();
    await this.write("c");
    await this.up();
    await this.right();
    await this.write("b");
    await this.down();
    await this.write("d");
    await this.right();
    this.speed /= 2;
  };
}
