import {
  AMS_BIN,
  AMS_MISC,
  AMS_NBIN,
  AMS_NREL,
  AMS_REL,
  BIN,
  FontMap,
  LETTER1,
  LETTER2,
  LETTER3,
  MISC,
  OP,
  REL,
} from "euler-tex/src/parser/command";

const BLOCK: [string, string, string][] = [
  ["\\sum", "\\sum^n_{i=1}", "\\sum^n_{i=1}"],
  ["\\int", "\\int^x_y", "\\int^x_y"],
  ...["pmatrix", "bmatrix", "vmatrix", "Vmatrix", "Bmatrix"].map((name) => {
    return [
      "\\" + name,
      `\\begin{${name}}a&b\\\\c&d\\end{${name}}`,
      `\\begin{${name}}&\\\\&\\end{${name}}`,
    ] as [string, string, string];
  }),
  [
    "\\aligned",
    "\\begin{aligned}a&=b+c\\\\d&=e+f\\end{aligned}",
    "\\begin{aligned}&=\\\\&=\\end{aligned}",
  ],
  [
    "\\cases",
    "\\begin{cases}a&=b+c\\\\d&=e+f\\end{cases}",
    "\\begin{cases}&=\\\\&=\\end{cases}",
  ],
  ["\\frac", "\\frac{a}{b}", "\\frac{}{}"],
  ["\\sqrt", "\\sqrt{a}", "\\sqrt{}"],
  ["\\overline", "\\overline{a}", "\\overline{}"],
  ["\\tilde", "\\tilde{a}", "\\tilde{}"],
  ...Object.keys(FontMap).map(
    (font) => [font, `${font}{A}-${font}{Z}`, ""] as [string, string, string]
  ),
  [
    "\\array",
    "\\begin{pmatrix}a\\\\b \\end{pmatrix}",
    "\\begin{pmatrix}\\\\ \\end{pmatrix}",
  ],
];

const MACRO = ["\\bra{}", "\\ket{}", "\\braket{}"];
export const candidates: [string, string, string][] = [
  ...Object.keys(LETTER1).map((x) => [x, x, x] as [string, string, string]),
  ...Object.keys(LETTER2).map((x) => [x, x, x] as [string, string, string]),
  ...Object.keys(LETTER3).map((x) => [x, x, x] as [string, string, string]),
  ...Object.keys(MISC).map((x) => [x, x, x] as [string, string, string]),
  ...Object.keys(BIN).map((x) => [x, x, x] as [string, string, string]),
  ...Object.keys(REL).map((x) => [x, x, x] as [string, string, string]),
  ...Object.keys(AMS_MISC).map((x) => [x, x, x] as [string, string, string]),
  ...Object.keys(AMS_BIN).map((x) => [x, x, x] as [string, string, string]),
  ...Object.keys(AMS_REL).map((x) => [x, x, x] as [string, string, string]),
  ...Object.keys(AMS_NBIN).map((x) => [x, x, x] as [string, string, string]),
  ...Object.keys(AMS_NREL).map((x) => [x, x, x] as [string, string, string]),
  ...MACRO.map((x) => [x, x, x] as [string, string, string]),
  ...OP.map((x) => [x, x, x] as [string, string, string]),
  ...BLOCK,
  ["\\ref", "(1)", "ref"],
  ["\\middle", "|", "\\middle|"],
];

export const candidates2: [string, string, string][] = [
  ["\\section", "\\section{Section}", "\\section{}"],
  ["\\subsection", "\\subsection{sub}", "\\subsection{}"],
  ["\\subsubsection", "\\subsubsection{subsub}", "\\subsubsection{}"],
  [
    "equation",
    "\\begin{equation}x=y\\end{equation}",
    "\\begin{equation}\\end{equation}",
  ],
  [
    "equation*",
    "\\begin{equation*}x=y\\end{equation*}",
    "\\begin{equation*}\\end{equation*}",
  ],
  [
    "align",
    "\\begin{align}x&=y\\\\&=z\\end{align}",
    "\\begin{align}x&=y\\\\&=z\\end{align}",
  ],
  [
    "align*",
    "\\begin{align*}x&=y\\\\&=z\\end{align*}",
    "\\begin{align*}x&=y\\\\&=z\\end{align*}",
  ],
  [
    "theorem",
    "\\begin{theorem}\\end{theorem}",
    "\\begin{theorem}\\end{theorem}",
  ],
  ["proof", "\\begin{proof}x=y\\end{proof}", "\\begin{proof}x=y\\end{proof}"],
  ["\\ref", "(1)", "ref"],
];
