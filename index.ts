import EulerNote from "./src/note";
import init, { collect } from "euler-engine";
import { parse } from "eulertex/src/lib";
console.log(import.meta.url);
init().then(() => {
  console.log("Wasm initialized!!");
});

const main = document.getElementById("main");
[1].forEach(() => {
  main.innerHTML += `
  <euler-note id="t"></euler-note>
  <button id="collect">Collect</button>
  `;
});
const eulerNote = document.getElementById("t") as EulerNote;
const collectBtn = document.getElementById("collect");
collectBtn.onclick = () =>
  eulerNote.caret.insert(parse(collect(eulerNote.caret.getValue())));
eulerNote.addEventListener("mount", () => {
  eulerNote.set(["\\sqrt{xxx}\\hat{xx}", ""]);
});
