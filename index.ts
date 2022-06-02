import init from "euler-engine";
import { latexToHtml } from "euler-tex/src/lib";
import EulerEditor from "./src/note";
import { SuggestView } from "./src/suggest/view";

init().then(() => {
  console.log("Wasm initialized!!");
});

const main = document.getElementById("main");
[1].forEach(() => {
  main.innerHTML += `
  <button id="collect">Suggestion Test</button>
  <euler-editor id="t"></euler-editor>
  `;
});
const eulerNote = document.getElementById("t") as EulerEditor;
const collectBtn = document.getElementById("collect");
collectBtn.onclick = () => {
  // eulerNote.caret.insert(parse(collect(eulerNote.caret.getValue())));/
  testSuggest();
};

eulerNote.addEventListener("mount", () => {
  eulerNote.set(["\\sqrt{xxx}\\hat{xx}", ""]);
  eulerNote.set(["\\sqrt{xxx}\\hat{xx}", ""]);
});

const testSuggest = async () => {
  const Symbol = ["\\alpha", "\\beta", "\\gamma", "\\zeta"];
  const BLOCK = [
    ["\\pmatrix", "\\begin{pmatrix}x&x\\\\x&x\\end{pmatrix}"],
    ["\\frac", "\\frac{a}{b}"],
  ];

  const wait = () => new Promise((resolve) => setTimeout(resolve, 400));

  const blockList = BLOCK.map(([text, prev]) => ({
    text,
    preview: latexToHtml(prev),
    onClick: () => console.log("clicked " + text),
  }));
  const symbolList = Symbol.map((text) => ({
    text,
    preview: latexToHtml(text),
    onClick: () => console.log("clicked " + text),
  }));

  const main = document.getElementById("main");
  const autoCompletion = new SuggestView();
  main.append(autoCompletion.elem);

  autoCompletion.open(70, 70);

  autoCompletion.setList([...blockList, ...symbolList]);
  await wait();
  autoCompletion.up();
  await wait();
  autoCompletion.up();
  await wait();
  autoCompletion.down();
  await wait();
  autoCompletion.down();
  await wait();
  autoCompletion.down();
  await wait();
  autoCompletion.setList([]);
  await wait();
  autoCompletion.setList([...symbolList]);
  await wait();
  autoCompletion.close();
  await wait();
  autoCompletion.open(170, 170);
  await wait();
  autoCompletion.select();
};
