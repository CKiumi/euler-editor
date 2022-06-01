import EulerEditor from "./src/note";
import init, { collect } from "euler-engine";
import { parse } from "euler-tex/src/lib";

init().then(() => {
  console.log("Wasm initialized!!");
});

const main = document.getElementById("main");
[1].forEach(() => {
  main.innerHTML += `
  <euler-editor id="t"></euler-editor>
  <button id="collect">Collect</button>
  `;
});
const eulerNote = document.getElementById("t") as EulerEditor;
const collectBtn = document.getElementById("collect");
collectBtn.onclick = () =>
  eulerNote.caret.insert(parse(collect(eulerNote.caret.getValue())));
eulerNote.addEventListener("mount", () => {
  eulerNote.set(["\\sqrt{xxx}\\hat{xx}", ""]);
  eulerNote.set(["\\sqrt{xxx}\\hat{xx}", ""]);
});
