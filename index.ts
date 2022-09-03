/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MatBuilderView } from "./src/mat";
import { MathLatexToHtml, loadFont } from "euler-tex/src/lib";
import EulerEditor from "./src/note";
import { SuggestView } from "./src/suggest/view";
import "./src/engine/pyodide";
loadFont();

const main = document.getElementById("main");
[1].forEach(() => {
  main!.innerHTML += `
  <button id="collect">Suggestion Test</button>
  <button id="mat-builder-test">MatrixBuilder Test</button>
  <euler-editor id="t"></euler-editor>
  `;
});
const eulerNote = document.getElementById("t") as EulerEditor;
const collectBtn = document.getElementById("collect");
const matBuilderBtn = document.getElementById("mat-builder-test");
collectBtn!.onclick = () => {
  // eulerNote.caret.insert(parse(collect(eulerNote.caret.getValue())));/
  testSuggest();
};

matBuilderBtn!.onclick = () => {
  testMatBuilder();
};

eulerNote.addEventListener("mount", () => {
  const jpMath = String.raw`\[\frac{\sqrt{\text{x日本語}}}{\sqrt{\text{にほんご}}}\]`;
  const aligned = String.raw`\[\begin{aligned}x & = a \\  & = c+d\ \text{(text mode)}\end{aligned}\]`;
  const align = String.raw`\begin{align}\label{label1} x & = a \\  & \label{label2}= c+d\end{align}`;
  const align2 = String.raw`\begin{align*} x & = a \\  & = c+d\end{align*}`;
  const cor = String.raw`\begin{corollary}Corollary environment \[\begin{cases}x+y & a\lt 0 \\ c+d & a\ge 0\end{cases}\]\end{corollary}`;
  const eqt = String.raw`\begin{equation*}\begin{pmatrix}a & b \\ c & d\end{pmatrix}\begin{pmatrix}e & f \\ g & h\end{pmatrix}+\begin{pmatrix}e & f \\ g & h\end{pmatrix}\end{equation*}`;
  const eqt2 = String.raw`\begin{equation}a\label{eq2}\end{equation}`;
  const thm1 = String.raw`\begin{theorem}${align2}\end{theorem}\begin{proof}Proof here ${eqt2}\end{proof}`;
  const thm2 = String.raw`\begin{theorem}\label{thm2}Second example for Theorem environment\end{theorem}`;
  const cases = String.raw`\[\begin{cases}x+y & a\lt 0 \\ c+d & a\ge 0\end{cases}\]`;
  const env = String.raw`\section{Introduction}\subsection{How to insert command }To insert command, type \textbf{backslash}. Ok Let's start with the following equation. You can expand and factor${jpMath}The more complicated example With trig expand, you can expand 日本語も打てるよ。 inline math-mode $x+y= z$ Multiline editing is also supported now. $\pounds \in \mathbb{C}$ aligned is also supported ${aligned} and also cases${cases}and equation number with align (\ref{label1}) (\ref{label2}) (\ref{eq2}) ${align}Matrix calculations are also supported${eqt}\subsection{Ref}\label{subsec} ${cor} \subsubsection{subsub}!!! Theorem \ref{thm2} and Subsection \ref{subsec} (\ref{label2})\section{Advanced}${thm1}${thm2}`;
  eulerNote.set(env);
  // eulerNote.set(
  //   String.raw`Ok Let's start with the following equation. You can expand and factor\[\left(x+y \right)^{2},\]The more complicated example:\[\left(\sqrt{x}-\frac{z}{k}\right)^3  \]With trig expand, you can expand\[\sin(x+y)+\cos(x+y)\]\[\sin(x+y)+\cos(x+y)\]日本語も打てるよ。 inline math-mode $x+y= z$ Multiline editing is also supported now. $\pounds \in C$ aligned is also supported \[ \begin{aligned}x&=a\\&=c+d\end{aligned} \]and also cases\[ \begin{cases}x+y&a<0\\c+d&a\geq0\end{cases} \]Matrix calculations are also supported\[\begin{pmatrix}a & b \\ c & d\end{pmatrix}\begin{pmatrix}e & f \\ g & h\end{pmatrix}+\begin{pmatrix}e & f \\ g & h\end{pmatrix}\]!!!`
  // );
});

const wait = () => new Promise((resolve) => setTimeout(resolve, 400));
const testSuggest = async () => {
  const Symbol = ["\\alpha", "\\beta", "\\gamma", "\\zeta"];
  const BLOCK = [
    ["\\pmatrix", "\\begin{pmatrix}x&x\\\\x&x\\end{pmatrix}"],
    ["\\frac", "\\frac{a}{b}"],
  ];

  const blockList = BLOCK.map(([text, prev]) => ({
    text,
    preview: MathLatexToHtml(prev),
    onClick: () => console.log("clicked " + text),
  }));
  const symbolList = Symbol.map((text) => ({
    text,
    preview: MathLatexToHtml(text),
    onClick: () => console.log("clicked " + text),
  }));
  const main = document.getElementById("main");
  const autoCompletion = new SuggestView(true);
  main!.append(autoCompletion.elem);
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

const testMatBuilder = async () => {
  const main = document.getElementById("main");
  const matBilder = new MatBuilderView();
  main!.append(matBilder.elem);
  matBilder.open(400, 400);
  await wait();
  matBilder.select("top");
  await wait();
  matBilder.close();
};
