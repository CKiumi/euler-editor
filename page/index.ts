/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { loadFont } from "euler-tex/src/lib";
import "../src/engine/pyodide";
import EulerEditor from "../src/note";
import { Auto } from "../src/auto";
import "../src/note";
import "../css/note.css";
import "../css/suggest.css";
import "../css/mat.css";
import { article } from "./data";
loadFont();
const main = document.getElementById("main");

const route: { [key: string]: () => void } = {
  "/": () => {
    const eulerNote = document.createElement("euler-editor") as EulerEditor;
    main?.append(eulerNote);
    eulerNote.set(article);
  },

  "/insert": async () => {
    const e = document.createElement("euler-editor") as EulerEditor;
    main?.append(e);
    e.style.minHeight = "0";
    const auto = new Auto(e, 10);
    await auto.write("Insert text test.");
    await auto.selectAll();
    await auto.keydown("Backspace");
    await auto.section();
    await auto.write("Let's insert inline math equation ");
    await auto.inline();
    await auto.eq();
    await auto.matrix();
    await auto.matrix();
    await auto.write("=");
    await auto.left();
    await auto.selectLeft();
    await auto.copy();
    await auto.right();
    await auto.right();
    await auto.paste();
    await auto.extendLeft();
    await auto.extendLeft();
    // await auto.keydown("Enter");
    // await auto.waitEngine();
    await auto.right();
    await auto.right();
    await auto.eq2();
    await auto.matrix();
    await auto.left();
    await auto.keydown("Enter");
    await auto.keydown("Enter");
    await auto.keydown("Backspace");
    await auto.keydown("Backspace");
    await auto.keydown("Backspace");
    await auto.up();
    await auto.keydown("Backspace");
    await auto.right();
    await auto.right();
    await auto.leftToStart();
    await auto.rightToEnd();
    await auto.deleteToStart();
  },
};

await route[window.location.pathname]?.();
