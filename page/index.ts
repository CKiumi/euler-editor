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
const run = async (title: string, test: (e: EulerEditor) => void) => {
  const header = document.createElement("h2");
  header.innerText = title;
  const btn = document.createElement("button");
  btn.style.margin = "20px";
  btn.innerText = "Run";
  btn.onclick = () => test(e);
  const e = document.createElement("euler-editor") as EulerEditor;
  main?.append(header, e, btn);
  e.style.minHeight = "0";
  test(e);
};
const route: { [key: string]: () => void } = {
  "/": () => {
    const eulerNote = document.createElement("euler-editor") as EulerEditor;
    main?.append(eulerNote);
    eulerNote.set(
      String.raw`\[X\left|0\right>,H\left|0\right>, H_{0}H_{1}\left|00\right>,  Y_{1}\left|00\right>,\operatorname{CNOT}_{1,2}\left|111\right>\]`
    );
  },
  "/article": () => {
    const eulerNote = document.createElement("euler-editor") as EulerEditor;
    main?.append(eulerNote);
    eulerNote.set(article);
  },
  "/insert": async () => {
    run("Text", async (e) => {
      const auto = new Auto(e, 5);
      await auto.write("Insert text test.");
    });
    run("Section", async (e) => {
      const auto = new Auto(e, 5);
      await auto.section();
    });
    run("Inline", async (e) => {
      const auto = new Auto(e, 5);
      await auto.inline();
    });
    run("Equation", async (e) => {
      const auto = new Auto(e, 1);
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
      await auto.keydown("Enter");
      await auto.waitEngine();
      await auto.right();
      await auto.right();
    });
    run("Matrix", async (e) => {
      const auto = new Auto(e, 5);
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
    });
  },
};

route[window.location.pathname]?.();
