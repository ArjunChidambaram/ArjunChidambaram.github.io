import katex from "katex";

/**
 * KaTeX helpers with the explainer colour scheme. Symbols keep the same colour
 * everywhere (and match the videos): β0 orange, β1 blue, x red, y green,
 * ŷ purple, residuals/loss amber.
 */
export const COL = {
  b0: "#E8772E",
  b1: "#2B8CBE",
  x: "#E2483D",
  y: "#3E9B4F",
  yhat: "#9B59D0",
  e: "#D4A017",
};

const MACROS: Record<string, string> = {
  "\\bz": `\\textcolor{${COL.b0}}{\\beta_0}`,
  "\\bo": `\\textcolor{${COL.b1}}{\\beta_1}`,
  "\\X": `\\textcolor{${COL.x}}{x}`,
  "\\Y": `\\textcolor{${COL.y}}{y}`,
  "\\xbar": `\\textcolor{${COL.x}}{\\bar{x}}`,
  "\\ybar": `\\textcolor{${COL.y}}{\\bar{y}}`,
  "\\yh": `\\textcolor{${COL.yhat}}{\\hat{y}}`,
  "\\E": `\\textcolor{${COL.e}}{e}`,
  "\\Lo": `\\textcolor{${COL.e}}{L}`,
  "\\cb": `\\textcolor{#${COL.b0}}{#1}`,
  "\\cs": `\\textcolor{#${COL.b1}}{#1}`,
  "\\cx": `\\textcolor{#${COL.x}}{#1}`,
  "\\cy": `\\textcolor{#${COL.y}}{#1}`,
  "\\ce": `\\textcolor{#${COL.e}}{#1}`,
  "\\cp": `\\textcolor{#${COL.yhat}}{#1}`,
};

const tight = (s: string) => s.replace(/(\d),(\d)/g, "$1{,}$2");

export const texHtml = (s: string, display = false) =>
  katex.renderToString(tight(s), { macros: MACROS, displayMode: display, throwOnError: false });

/** Inline math */
export const M: React.FC<{ children: string }> = ({ children }) => (
  <span dangerouslySetInnerHTML={{ __html: texHtml(children) }} />
);

/** Display math, scrolls sideways on narrow screens instead of overflowing */
export const DM: React.FC<{ children: string }> = ({ children }) => (
  <div className="my-4 overflow-x-auto overflow-y-hidden" dangerouslySetInnerHTML={{ __html: texHtml(children, true) }} />
);
