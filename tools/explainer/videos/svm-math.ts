import { createVideo, plotFrame, prog, smooth, span, lerp } from "./engine";
import { X1, X2, Y, N, MODEL, fitSVM, decision, norm, marginWidth, supportVectors, type SVM } from "../../../lib/explainers/svm";

const DURATION = 124;
const v = createVideo({
  theme: "dark",
  width: 1920,
  height: 1080,
  duration: DURATION,
  macros: {
    "\\w": "\\textcolor{#58C4DD}{\\mathbf{w}}",
    "\\wa": "\\textcolor{#58C4DD}{w_1}",
    "\\wb": "\\textcolor{#58C4DD}{w_2}",
    "\\bb": "\\textcolor{#FF862F}{b}",
    "\\x": "\\textcolor{#FC6255}{\\mathbf{x}}",
    "\\Yi": "\\textcolor{#83C167}{y_i}",
    "\\Cc": "\\textcolor{#F4D35E}{C}",
  },
});
const { C, W, tex, text, life, s, set, frame } = v;
const BUY = C.green;
const NO = "#8A8F98";
const POS = Y.reduce((a, y) => a + (y === 1 ? 1 : 0), 0);
const f3 = (x: number) => x.toFixed(3);

// ---------------- Scene 1: title (0 – 9) ----------------
v.centerTitle("Support Vector Machines", 0.2, 8.4, 70, 64, 600);
life(text("An SVM separates two classes with the {blue:widest possible street}.", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 8.4, "fade");
life(text("Only the points at the edge of the street matter: the {yellow:support vectors}.", { x: W / 2, y: 400 }, { size: 38, ax: 0.5 }), 3.2, 8.4, "fade");
life(text("Let's see where its numbers come from.", { x: W / 2, y: 470 }, { size: 38, ax: 0.5 }), 5, 8.4, "fade");

v.divider([
  [9.2, 37.6],
  [56.2, 115.6],
]);

// ---------------- shared plot ----------------
const P = plotFrame(v, { left: 1100, right: 1830, top: 170, bottom: 880 }, [0, 12], [0, 12], {
  xticks: [0, 2, 4, 6, 8, 10, 12],
  yticks: [0, 2, 4, 6, 8, 10, 12],
  xlabel: "minutes on page $x_1$",
  ylabel: "pages viewed $x_2$",
  spans: [
    [9.6, 37.6],
    [56.4, 115.6],
  ],
});
const { px, py } = P;
const street = s("path", { fill: C.blue, opacity: 0 }, P.inner);
const edgeA = s("line", { stroke: C.blue, "stroke-width": 2.5, "stroke-dasharray": "10 8", opacity: 0 }, P.inner);
const edgeB = s("line", { stroke: C.blue, "stroke-width": 2.5, "stroke-dasharray": "10 8", opacity: 0 }, P.inner);
const mid = s("line", { stroke: C.blue, "stroke-width": 5, opacity: 0 }, P.inner);
const tries = [0, 1, 2].map(() => s("line", { stroke: C.dim, "stroke-width": 3, opacity: 0 }, P.inner));
const rings = Y.map(() => s("circle", { r: 0, fill: "none", stroke: C.yellow, "stroke-width": 3 }, P.top));
const dots = Y.map((y, i) => s("circle", { cx: px(X1[i]), cy: py(X2[i]), r: 0, fill: y === 1 ? BUY : NO }, P.top));
const star = s("path", { fill: C.purple, stroke: "#fff", "stroke-width": 2 }, P.top);

// line w1 x1 + w2 x2 + b = level, clipped to the plot box (x from -1 to 13)
function seg(m: { w: [number, number]; b: number }, level: number) {
  const ya = (level - m.b - m.w[0] * -1) / m.w[1];
  const yb = (level - m.b - m.w[0] * 13) / m.w[1];
  return { x1: px(-1), y1: py(ya), x2: px(13), y2: py(yb) };
}
function drawStreet(m: { w: [number, number]; b: number }, alpha: number, edges = true) {
  const a = seg(m, 1);
  const c = seg(m, -1);
  set(street, { d: `M${a.x1},${a.y1}L${a.x2},${a.y2}L${c.x2},${c.y2}L${c.x1},${c.y1}Z`, opacity: 0.16 * alpha });
  set(edgeA, { ...a, opacity: edges ? alpha : 0 });
  set(edgeB, { ...c, opacity: edges ? alpha : 0 });
  set(mid, { ...seg(m, 0), opacity: alpha });
}
function ringSVs(m: SVM, alpha: number) {
  const sv = new Set(supportVectors(m));
  rings.forEach((r, i) => set(r, { cx: px(X1[i]), cy: py(X2[i]), r: sv.has(i) ? 16 * alpha : 0 }));
}

frame((t) => {
  dots.forEach((d, i) => {
    const p = prog(t, 10.4 + i * 0.1, 0.3);
    set(d, { r: p >= 1 ? 9 : p > 0 ? 9 + Math.sin(p * Math.PI) * 5 : 0 });
  });
});

// ---------------- Scene 2: data (9 – 22) ----------------
v.sectionTitle("Support Vector Machines:", "The Data", 9.2, 21.6);
life(text("$x_1$: minutes on the product page", { x: 70, y: 290 }, { size: 32 }), 9.8, 21.6);
life(text("$x_2$: pages viewed on the site", { x: 70, y: 345 }, { size: 32 }), 10.2, 21.6);
life(text("$\\Yi = {+1}$ {green:bought}, $\\Yi = -1$ didn't", { x: 70, y: 400 }, { size: 32 }), 10.6, 21.6);
life(text(`$n = ${N}$ visitors, ${POS} bought`, { x: 70, y: 455 }, { size: 32 }), 11, 21.6);
life(text("Buyers sit to the upper right. Where should the boundary go?", { x: 70, y: 600 }, { size: 30, color: C.dim, width: 600 }), 15, 21.6, "fade");

// ---------------- Scene 3: the widest street (22 – 38) ----------------
v.sectionTitle("Support Vector Machines:", "The Widest Street", 22.2, 37.6);
life(tex("f(\\x) = \\wa x_1 + \\wb x_2 + \\bb", { x: 70, y: 260 }, { size: 40 }), 22.8, 37.6, "write", 1);
life(text("boundary: $f(\\x) = 0$", { x: 70, y: 360 }, { size: 32 }), 24.4, 37.6);
life(text("street edges: $f(\\x) = \\pm 1$", { x: 70, y: 412 }, { size: 32 }), 25.2, 37.6);
life(text("Many lines separate the classes.", { x: 70, y: 520 }, { size: 30, color: C.dim }), 23.6, 37.6, "fade");
life(text("The SVM picks the one with the widest street,", { x: 70, y: 580 }, { size: 30 }), 30.4, 37.6, "fade");
life(text("the safest gap between buyers and non-buyers.", { x: 70, y: 622 }, { size: 30 }), 30.6, 37.6, "fade");
life(tex("\\text{width} = \\frac{2}{\\|\\w\\|}", { x: 70, y: 720 }, { size: 46 }), 33, 37.6, "write", 1);
const TRIES = [
  { w: [0.9, 0.2] as [number, number], b: -6.4 },
  { w: [0.55, 0.6] as [number, number], b: -6.6 },
  { w: [1.0, 0.45] as [number, number], b: -8.3 },
];
frame((t) => {
  if (t < 22 || t > 38.2) {
    if (t < 56) tries.forEach((l) => set(l, { opacity: 0 }));
    return;
  }
  tries.forEach((l, k) => set(l, { ...seg(TRIES[k], 0), opacity: span(t, 23.6 + k * 1.4, 29.8, 0.4) }));
  const g = smooth(prog(t, 30.2, 1.6));
  // street grows from zero width to the SVM's
  const scale = lerp(6, 1, g);
  drawStreet({ w: [MODEL.w[0] * scale, MODEL.w[1] * scale], b: MODEL.b * scale }, span(t, 30.2, 37.6));
  ringSVs(MODEL, span(t, 34, 37.6));
});

// ---------------- Scene 4: the optimization (38 – 56) ----------------
v.centerTitle("Finding the Widest Street", 38.2, 55.6, 60, 46, 480);
life(text("Widest street = smallest $\\|\\w\\|$. If every visitor could sit outside the street:", { x: W / 2, y: 190 }, { size: 30, ax: 0.5 }), 38.8, 55.6, "fade");
life(tex("\\min_{\\w,\\,\\bb}\\ \\tfrac{1}{2}\\|\\w\\|^2 \\quad \\text{subject to} \\quad \\Yi\\,f(\\x_i) \\ge 1 \\ \\text{for every } i", { x: W / 2, y: 250 }, { size: 44, ax: 0.5 }), 39.6, 55.6, "write", 1.4);
life(text("But two visitors are on the wrong side, so allow violations and pay for them:", { x: W / 2, y: 390 }, { size: 30, ax: 0.5 }), 42.6, 55.6, "fade");
life(tex("\\min_{\\w,\\,\\bb}\\ \\tfrac{1}{2}\\|\\w\\|^2 + \\Cc\\sum_{i=1}^{n} \\max\\big(0,\\ 1 - \\Yi\\,f(\\x_i)\\big)", { x: W / 2, y: 450 }, { size: 46, ax: 0.5 }), 43.4, 55.6, "write", 1.4);
life(text("{yellow:hinge loss}: zero outside the street on the right side, growing the further a point intrudes", { x: W / 2, y: 590 }, { size: 28, ax: 0.5, color: C.dim }), 45.4, 55.6, "fade");
{
  const HP = plotFrame(v, { left: 660, right: 1260, top: 680, bottom: 960 }, [-1.5, 2.5], [0, 2.5], {
    xticks: [-1, 0, 1, 2],
    yticks: [0, 1, 2],
    xlabel: "$\\Yi\\,f(\\x_i)$",
    ylabel: "loss",
    spans: [[46.4, 55.6]],
    grid: true,
  });
  const h = s("path", { fill: "none", stroke: C.yellow, "stroke-width": 5 }, HP.inner);
  frame((t) => {
    const g = smooth(prog(t, 47, 1.4));
    let d = "";
    for (let k = 0; k <= 80 * g; k++) {
      const z = -1.5 + (4 * k) / 80;
      d += `${k ? "L" : "M"}${HP.px(z).toFixed(1)},${HP.py(Math.max(0, 1 - z)).toFixed(1)}`;
    }
    set(h, { d });
  });
  life(text("$\\Cc$ sets the price of each violation.", { x: 1320, y: 820 }, { size: 30 }), 49, 55.6, "fade");
}

// ---------------- Scene 5: the numbers (56 – 76) ----------------
const SV = supportVectors(MODEL);
const nw = norm(MODEL);
v.sectionTitle("Support Vector Machines:", "The Solution (C = 1)", 56.2, 75.6);
life(tex(`\\wa = ${f3(MODEL.w[0])},\\quad \\wb = ${f3(MODEL.w[1])}`, { x: 70, y: 240 }, { size: 32 }), 56.8, 75.6, "write", 1);
life(tex(`\\bb = ${f3(MODEL.b)}`, { x: 70, y: 290 }, { size: 32 }), 57.4, 75.6, "write", 0.6);
life(tex(`\\|\\w\\| = \\sqrt{${f3(MODEL.w[0])}^2 + ${f3(MODEL.w[1])}^2} = ${f3(nw)}`, { x: 70, y: 360 }, { size: 30 }), 58.4, 75.6, "write", 1.2);
life(tex(`\\text{width} = \\frac{2}{${f3(nw)}} = \\cB{${f3(marginWidth(MODEL))}}`, { x: 70, y: 430 }, { size: 36 }), 59.8, 75.6, "write", 1);
life(text(`${SV.length} {yellow:support vectors} (circled):`, { x: 70, y: 550 }, { size: 30 }), 62, 75.6, "fade");
SV.forEach((i, k) => {
  const m = Y[i] * decision(MODEL, X1[i], X2[i]);
  const where = m > 0.999 ? "on the edge" : m > 0 ? "inside the street" : "wrong side";
  life(
    text(`(${X1[i]}, ${X2[i]}), $y f = ${m.toFixed(2)}$: ${where}`, { x: 70, y: 600 + k * 44 }, { size: 26, color: m > 0.999 ? C.ink : m > 0 ? C.yellow : C.red }),
    62.6 + k * 0.5,
    75.6,
    "fade",
    0.4
  );
});
frame((t) => {
  if (t >= 56 && t < 116.2 && !(t >= 92 && t < 106)) {
    drawStreet(MODEL, span(t, 56.4, 115.6));
    ringSVs(MODEL, span(t, 61.8, 115.6));
  }
});

// ---------------- Scene 6: only support vectors matter (76 – 92) ----------------
v.sectionTitle("Support Vector Machines:", "Only the Edge Matters", 76.2, 91.6);
life(text("The solution is a weighted sum of the support vectors:", { x: 70, y: 260 }, { size: 30, width: 600 }), 76.8, 91.6, "fade");
life(tex("\\w = \\sum_i \\alpha_i\\, \\Yi\\, \\x_i \\qquad 0 \\le \\alpha_i \\le \\Cc", { x: 70, y: 340 }, { size: 38 }), 77.6, 91.6, "write", 1.2);
life(text("Every other visitor has $\\alpha_i = 0$.", { x: 70, y: 440 }, { size: 30 }), 79.6, 91.6, "fade");
SV.forEach((i, k) =>
  life(tex(`\\alpha_{${i + 1}} = ${MODEL.alpha[i].toFixed(3)}`, { x: 70 + (k % 2) * 300, y: 520 + Math.floor(k / 2) * 52 }, { size: 28 }), 80.6 + k * 0.4, 91.6, "fade", 0.4)
);
life(text("Move any other point (outside the street) and the line doesn't budge.", { x: 70, y: 720 }, { size: 28, color: C.dim, width: 620 }), 84, 91.6, "fade");

// ---------------- Scene 7: the C trade-off (92 – 106) ----------------
const CS = [0.05, 0.1, 0.2, 0.5, 1];
const MODELS = CS.map((c) => fitSVM(c));
v.sectionTitle("Support Vector Machines:", "The C Trade-off", 92.2, 105.6);
life(text("Small $\\Cc$: violations are cheap → wide street,", { x: 70, y: 260 }, { size: 30 }), 92.8, 105.6, "fade");
life(text("many support vectors, smoother boundary.", { x: 70, y: 302 }, { size: 30 }), 93, 105.6, "fade");
life(text("Large $\\Cc$: violations are expensive → narrow", { x: 70, y: 380 }, { size: 30 }), 93.4, 105.6, "fade");
life(text("street that bends to fit every point.", { x: 70, y: 422 }, { size: 30 }), 93.6, 105.6, "fade");
const cRead = v.html("", { x: 70, y: 540 }, { size: 34 });
life(cRead, 94, 105.6, "fade", 0.4);
frame((t) => {
  if (t < 92 || t >= 106) return;
  const k = Math.min(CS.length - 1, Math.floor(prog(t, 94.4, 9) * CS.length));
  const m = MODELS[k];
  drawStreet(m, span(t, 92.2, 105.6));
  ringSVs(m, span(t, 92.2, 105.6));
  cRead.el.innerHTML = [
    v.K(`\\Cc = ${CS[k]}`),
    `street width ${v.K(`\\cB{${marginWidth(m).toFixed(2)}}`)}`,
    `${supportVectors(m).length} support vectors`,
  ]
    .map((h) => `<div style="margin-bottom:18px">${h}</div>`)
    .join("");
});
life(text("Pick $\\Cc$ with cross-validation.", { x: 70, y: 800 }, { size: 28, color: C.dim }), 100, 105.6, "fade");

// ---------------- Scene 8: predict (106 – 116) ----------------
const NEWV: [number, number] = [6, 7];
const fN = decision(MODEL, NEWV[0], NEWV[1]);
v.sectionTitle("Support Vector Machines:", "Predicting", 106.2, 115.6);
life(text("A new visitor: 6 minutes, 7 pages", { x: 70, y: 260 }, { size: 30 }), 106.8, 115.6, "fade");
life(tex(`f = ${f3(MODEL.w[0])}(6) + ${f3(MODEL.w[1])}(7) ${f3(MODEL.b)}`, { x: 70, y: 320 }, { size: 30 }), 107.4, 115.6, "write", 1.2);
life(tex(`\\phantom{f} = \\cP{${fN.toFixed(2)}}`, { x: 70, y: 370 }, { size: 30 }), 108.4, 115.6, "write", 0.6);
life(text(`Positive → predict {green:buy}.`, { x: 70, y: 430 }, { size: 30 }), 109, 115.6, "fade");
life(text(`But $f < 1$: inside the street,`, { x: 70, y: 480 }, { size: 30 }), 110, 115.6, "fade");
life(text("a low-confidence call.", { x: 70, y: 522 }, { size: 30 }), 110.2, 115.6, "fade");
life(tex(`\\text{distance} = \\frac{${fN.toFixed(2)}}{${f3(nw)}} = ${(fN / nw).toFixed(2)}`, { x: 70, y: 610 }, { size: 30 }), 111.2, 115.6, "write", 1);
frame((t) => {
  const q = span(t, 106.8, 115.6, 0.4);
  const cx = px(NEWV[0]);
  const cy = py(NEWV[1]);
  let d = "";
  for (let k = 0; k < 10; k++) {
    const a = (Math.PI / 5) * k - Math.PI / 2;
    const rr = (k % 2 ? 8 : 20) * q;
    d += `${k ? "L" : "M"}${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }
  set(star, { d: q > 0 ? d + "Z" : "" });
});

// ---------------- Scene 9: end (116 – 124) ----------------
v.endCard(116.4, 123, [
  { tex: "\\min\\ \\tfrac{1}{2}\\|\\w\\|^2 + \\Cc\\sum_i \\max\\big(0,\\ 1 - \\Yi f(\\x_i)\\big)", size: 54, y: 230 },
  { text: "The widest street, held up by a few support vectors.", size: 36, y: 400 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
