export module KeyBoard {
  type Command =
    | "selA"
    | "undo"
    | "redo"
    | "copy"
    | "cut"
    | "paste"
    | "left"
    | "right"
    | "up"
    | "down"
    | "extL"
    | "extR"
    | "extU"
    | "extD"
    | "selL"
    | "selR"
    | "selU"
    | "selD"
    | "del"
    | "enter"
    | "backslash"
    | "$";

  export const elem = (() => {
    const span = document.createElement("div");
    span.className = "keystroke";
    return span;
  })();

  const isMac = navigator.userAgent.includes("Mac");

  export const getCmd = (ev: KeyboardEvent): Command | null => {
    const cmdKey = isMac ? ev.metaKey : ev.ctrlKey;
    if (ev.key === "\\") return "backslash";
    if (ev.key === "$") return "$";
    if (cmdKey && ev.shiftKey) {
      if (ev.key === "z" && isMac) return "redo";
      if (ev.key === "ArrowLeft") return "selL";
      if (ev.key === "ArrowRight") return "selR";
      if (ev.key === "ArrowUp") return "selU";
      if (ev.key === "ArrowDown") return "selD";
    }
    if (cmdKey) {
      if (ev.key === "a") return "selA";
      if (ev.key === "z") return "undo";
      if (ev.key === "y" && !isMac) return "redo";
      if (ev.key === "c") return "copy";
      if (ev.key === "x") return "cut";
      if (ev.key === "v") return "paste";
    }
    if (ev.shiftKey) {
      if (ev.key === "ArrowLeft") return "extL";
      if (ev.key === "ArrowRight") return "extR";
      if (ev.key === "ArrowUp") return "extU";
      if (ev.key === "ArrowDown") return "extD";
    }
    if (ev.key === "ArrowLeft") return "left";
    if (ev.key === "ArrowRight") return "right";
    if (ev.key === "ArrowUp") return "up";
    if (ev.key === "ArrowDown") return "down";
    if (ev.key === "Backspace") return "del";
    if (ev.key === "Enter") return "enter";
    return null;
  };

  export const print = (cmd: Command | null, ev: KeyboardEvent) => {
    if (!cmd) return;
    if (cmd === "$") return render(["$"]);
    const key = {
      Enter: "\u23CE",
      Backspace: "\u232B",
      Backslash: "\\",
      ArrowLeft: "←",
      ArrowUp: "↑",
      ArrowRight: "→",
      ArrowDown: "↓",
    }[ev.code];
    const res = key ?? ev.code.replace("Key", "").replace("Digit", "");
    render([
      ev.metaKey ? "⌘" : "",
      ev.shiftKey ? "⇧" : "",
      ev.ctrlKey ? "⌃" : "",
      res,
    ]);
  };

  const render = (commands: string[]) => {
    elem.innerHTML = "";
    commands.forEach((command) => {
      if (command === "") return;
      const div = document.createElement("div");
      div.innerText = command;
      elem.append(div);
    });
  };
}
