import EulerNote from "./src/note";
const main = document.getElementById("main");
[1].forEach(() => {
  main.innerHTML += `
  <euler-note id="t"></euler-note>
  `;
});
const eulerNote = document.getElementById("t") as EulerNote;
eulerNote.addEventListener("mount", () => {
  eulerNote.set(["a_2+\\int^{aaaa}_a", "a_2+\\int^{aaaa}_a"]);
});
