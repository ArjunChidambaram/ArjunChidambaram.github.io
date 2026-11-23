import { createVideo, plotFrame, prog, smooth, span, lerp, fmt, clamp } from "./engine";
import { XS, YS, N, sigmoid, BEST, OLS, GD_PATH, GD_STEPS, gradient, logLoss } from "../../../lib/explainers/logistic";

const DURATION = 140;
const v = createVideo({
  theme: "dark",
  width: 1920,
  height: 1080,
  duration: DURATION,
  macros: {
    "\\bz": "\\textcolor{#FF862F}{\\beta_0}",
    "\\bo": "\\textcolor{#58C4DD}{\\beta_1}",
    "\\X": "\\textcolor{#FC6255}{x}",
    "\\Y": "\\textcolor{#83C167}{y}",
    "\\Z": "\\textcolor{#5CD0B3}{z}",
    "\\p": "\\textcolor{#C77DFF}{\\hat{p}}",
    "\\sig": "\\textcolor{#E07A9F}{\\sigma}",
    "\\Lo": "\\textcolor{#F4D35E}{L}",
  },
});
const { C, W, tex, text, life, s, set, frame } = v;
const SHOWN: (number | null)[] = [0, 1, 2, 3, null, 22, 23, 24];
const BUY = C.green;
const NOBUY = "#8A8F98";

// ---------------- Scene 1: title (0 – 9) ----------------
v.centerTitle("Logistic Regression", 0.2, 8.4, 70, 64, 560);
life(tex("\\p = \\sig(\\bz + \\bo\\,\\X)", { x: W / 2, y: 300 }, { size: 66, ax: 0.5 }), 1.2, 8.4, "write", 1.2);
life(text("Logistic regression predicts the {purple:probability} of a yes/no outcome.", { x: W / 2, y: 500 }, { size: 38, ax: 0.5 }), 2.6, 8.4, "fade");
life(text("It's a linear model squeezed through the S-shaped {pink:sigmoid} $\\sig$.", { x: W / 2, y: 570 }, { size: 38, ax: 0.5 }), 4.2, 8.4, "fade");
life(text("Let's see where every number comes from.", { x: W / 2, y: 640 }, { size: 38, ax: 0.5 }), 5.8, 8.4, "fade");

v.divider([
  [9.2, 67.6],
  [84.2, 131.6],
]);

// shared data plot (scenes 2, 3, 8, 9)
const dataPlot = plotFrame(
  v,
  { left: 1100, right: 1830, top: 170, bottom: 860 },
  [0, 12.5],
  [-0.25, 1.35],
  {
    xticks: [0, 2, 4, 6, 8, 10, 12],
    yticks: [0, 0.5, 1],
    yfmt: (y) => (y === 0.5 ? "0.5" : String(y)),
    xlabel: "minutes on product page $\\X$",
    ylabel: "bought? $\\Y$",
    spans: [
      [10, 35.6],
      [104.2, 131.6],
    ],
  }
);
const dpx = dataPlot.px;
const dpy = dataPlot.py;
// shaded "impossible" bands outside [0, 1] for scene 3
const bandHi = s("rect", { x: 1100, y: dpy(1.35), width: 730, height: dpy(1) - dpy(1.35), fill: C.red, opacity: 0 }, dataPlot.g);
const bandLo = s("rect", { x: 1100, y: dpy(0), width: 730, height: dpy(-0.25) - dpy(0), fill: C.red, opacity: 0 }, dataPlot.g);
const curve = s("path", { fill: "none", stroke: C.purple, "stroke-width": 5, opacity: 0 }, dataPlot.inner);
const thresh = s("line", { x1: 1100, x2: 1830, y1: dpy(0.5), y2: dpy(0.5), stroke: C.dim, "stroke-width": 2, "stroke-dasharray": "8 8", opacity: 0 }, dataPlot.g);
const bound = s("line", { stroke: C.yellow, "stroke-width": 3, "stroke-dasharray": "10 8", opacity: 0 }, dataPlot.g);
const dots = XS.map((x, i) => s("circle", { cx: dpx(x), cy: dpy(YS[i]), r: 0, fill: YS[i] ? BUY : NOBUY }, dataPlot.top));

function curvePath(f: (x: number) => number) {
  let d = "";
  for (let k = 0; k <= 120; k++) {
    const x = (12.5 * k) / 120;
    d += `${k ? "L" : "M"}${dpx(x).toFixed(1)},${dpy(clamp(f(x), -0.6, 1.7)).toFixed(1)}`;
  }
  return d;
}

// ---------------- Scene 2: data (9 – 21) ----------------
v.sectionTitle("Logistic Regression:", "The Data", 9.2, 20.6);
life(text("$\\X_i$: minutes on the product page", { x: 70, y: 290 }, { size: 32 }), 9.8, 20.6);
life(text("$\\Y_i$: {green:1} = bought, 0 = didn't", { x: 70, y: 345 }, { size: 32 }), 10.2, 20.6);
life(text("$n = 25$ visitors, 12 bought", { x: 70, y: 400 }, { size: 32 }), 10.6, 20.6);
life(text("Long visits tend to end in a purchase, but not always.", { x: 70, y: 540 }, { size: 30, color: C.dim, width: 600 }), 15, 20.6, "fade");
{
  const tx = 790;
  life(tex("\\X_i", { x: tx + 45, y: 175 }, { size: 32, ax: 0.5 }), 10.8, 20.6, "fade");
  life(tex("\\Y_i", { x: tx + 140, y: 175 }, { size: 32, ax: 0.5 }), 10.8, 20.6, "fade");
  SHOWN.forEach((i, r) => {
    const a = 11.3 + r * 0.45;
    const y = 240 + r * 60;
    if (i === null) return void life(tex("\\vdots", { x: tx + 92, y }, { size: 30, ax: 0.5 }), a, 20.6, "fade", 0.4);
    life(tex(`\\cR{${XS[i]}}`, { x: tx + 45, y }, { size: 30, ax: 0.5 }), a, 20.6, "write", 0.4);
    life(tex(YS[i] ? `\\cG{1}` : `\\cD{0}`, { x: tx + 140, y }, { size: 30, ax: 0.5 }), a + 0.1, 20.6, "write", 0.4);
  });
}
frame((t) => {
  dots.forEach((d, i) => {
    const p = prog(t, 11.5 + i * 0.18, 0.3);
    set(d, { r: p >= 1 ? 9 : p > 0 ? 9 + Math.sin(p * Math.PI) * 6 : 0 });
  });
});

// ---------------- Scene 3: why not a line (21 – 36) ----------------
v.sectionTitle("Logistic Regression:", "Why Not a Line?", 21.2, 35.6);
life(tex("\\Z = \\bz + \\bo\\,\\X", { x: 70, y: 280 }, { size: 44 }), 21.8, 35.6);
life(text("A straight line through 0s and 1s", { x: 70, y: 390 }, { size: 30 }), 23, 35.6, "fade");
life(
  text(`predicts {red:${(OLS.b0 + OLS.b1 * 12).toFixed(2)}} at 12 minutes and keeps`, { x: 70, y: 432 }, { size: 30 }),
  23.4,
  35.6,
  "fade"
);
life(text(`climbing past 1. Probabilities can't do that.`, { x: 70, y: 474 }, { size: 30 }), 23.6, 35.6, "fade");
life(tex("\\p = \\sig(\\Z) = \\sig(\\bz + \\bo\\,\\X)", { x: 70, y: 600 }, { size: 44 }), 29, 35.6);
life(text("Squash it into (0, 1) with the sigmoid.", { x: 70, y: 700 }, { size: 30, color: C.dim }), 30, 35.6, "fade");
frame((t) => {
  const lineVis = span(t, 22, 35.6);
  const bands = span(t, 24, 29.4, 0.6) * 0.18;
  set(bandHi, { opacity: bands });
  set(bandLo, { opacity: bands });
  // morph the line into the sigmoid
  const m = smooth(prog(t, 30, 2.5));
  const fitted = smooth(prog(t, 32.5, 2));
  const coef = { b0: lerp(-0.9, BEST.b0, fitted), b1: lerp(0.18, BEST.b1, fitted) };
  if (t >= 22 && t < 36) {
    set(curve, {
      d: curvePath((x) => lerp(OLS.b0 + OLS.b1 * x, sigmoid(coef.b0 + coef.b1 * x), m)),
      opacity: lineVis,
      stroke: m > 0.5 ? C.purple : C.teal,
    });
  }
});

// ---------------- Scene 4: the sigmoid (36 – 52) ----------------
v.sectionTitle("Logistic Regression:", "The Sigmoid", 36.2, 51.6);
life(tex("\\sig(\\Z) = \\frac{1}{1 + e^{-\\Z}}", { x: 70, y: 270 }, { size: 52 }), 36.8, 51.6, "write", 1.2);
life(text("very negative $\\Z$ → close to 0", { x: 70, y: 450 }, { size: 32 }), 39, 51.6);
life(text("$\\Z = 0$ → exactly 0.5", { x: 70, y: 505 }, { size: 32 }), 40.2, 51.6);
life(text("very positive $\\Z$ → close to 1", { x: 70, y: 560 }, { size: 32 }), 41.4, 51.6);
life(text("Any number in, a probability out.", { x: 70, y: 690 }, { size: 30, color: C.dim }), 47, 51.6, "fade");
{
  const sp = plotFrame(v, { left: 1100, right: 1830, top: 200, bottom: 820 }, [-6, 6], [0, 1], {
    xticks: [-6, -4, -2, 0, 2, 4, 6],
    yticks: [0, 0.5, 1],
    yfmt: (y) => (y === 0.5 ? "0.5" : String(y)),
    xlabel: "$\\Z$",
    ylabel: "$\\sig(\\Z)$",
    spans: [[36.6, 51.6]],
    grid: true,
  });
  const path = s("path", { fill: "none", stroke: C.pink, "stroke-width": 5 }, sp.inner);
  const examples = [-2, 0, 2];
  const marks = examples.map(() => s("circle", { r: 0, fill: C.teal }, sp.top));
  examples.forEach((z, k) => {
    const sv = sigmoid(z);
    life(
      tex(`\\sig(${z})=${sv.toFixed(2)}`, { x: sp.px(z) + (z < 0 ? -20 : 20), y: sp.py(sv) + (z < 0 ? 12 : -12) }, { size: 28, ax: z < 0 ? 1 : 0, ay: z < 0 ? 0 : 1 }),
      42.6 + k * 1.2,
      51.6,
      "pop",
      0.4
    );
  });
  frame((t) => {
    const g = smooth(prog(t, 37.4, 1.6));
    let d = "";
    for (let k = 0; k <= 100 * g; k++) {
      const z = -6 + (12 * k) / 100;
      d += `${k ? "L" : "M"}${sp.px(z).toFixed(1)},${sp.py(sigmoid(z)).toFixed(1)}`;
    }
    set(path, { d });
    examples.forEach((z, k) => {
      const p = prog(t, 42.4 + k * 1.2, 0.3) * (1 - prog(t, 51.6, 0.4));
      set(marks[k], { cx: sp.px(z), cy: sp.py(sigmoid(z)), r: p > 0 ? 9 : 0 });
    });
  });
}

// ---------------- Scene 5: log loss (52 – 68) ----------------
v.sectionTitle("Logistic Regression:", "The Loss", 52.2, 67.6);
life(
  tex("\\Lo = -\\frac{1}{n}\\sum_{i=1}^{n}\\Big[\\Y_i \\log \\p_i + (1-\\Y_i)\\log(1-\\p_i)\\Big]", { x: 70, y: 270 }, { size: 30 }),
  52.8,
  67.6,
  "write",
  1.4
);
life(text("If the visitor bought ($\\Y_i = 1$),", { x: 70, y: 400 }, { size: 30 }), 55, 67.6, "fade");
life(text("their cost is $-\\log \\p_i$:", { x: 70, y: 442 }, { size: 30 }), 55.3, 67.6, "fade");
life(text("confident and right costs almost nothing,", { x: 70, y: 520 }, { size: 30 }), 57.5, 67.6, "fade");
life(text("confident and {red:wrong} costs a lot.", { x: 70, y: 562 }, { size: 30 }), 58, 67.6, "fade");
life(text("(For $\\Y_i = 0$ it's the mirror image, $-\\log(1-\\p_i)$.)", { x: 70, y: 680 }, { size: 28, color: C.dim }), 62, 67.6, "fade");
{
  const lp = plotFrame(v, { left: 1100, right: 1830, top: 200, bottom: 820 }, [0, 1], [0, 4], {
    xticks: [0, 0.5, 1],
    yticks: [0, 1, 2, 3, 4],
    xfmt: (x) => (x === 0.5 ? "0.5" : String(x)),
    xlabel: "predicted probability $\\p_i$ (visitor did buy)",
    ylabel: "cost $-\\log \\p_i$",
    spans: [[52.6, 67.6]],
    grid: true,
  });
  const path = s("path", { fill: "none", stroke: C.yellow, "stroke-width": 5 }, lp.inner);
  const ex = [0.9, 0.5, 0.1];
  const marks = ex.map(() => s("circle", { r: 0, fill: C.purple }, lp.top));
  ex.forEach((p, k) => {
    life(
      tex(`\\p = ${p}:\\ ${(-Math.log(p)).toFixed(3)}`, { x: lp.px(p) + (p > 0.6 ? -10 : 22), y: lp.py(-Math.log(p)) - (p > 0.6 ? 26 : 10) }, { size: 28, ay: 1, ax: p > 0.6 ? 1 : 0 }),
      59 + k * 1.1,
      67.6,
      "pop",
      0.4
    );
  });
  frame((t) => {
    const g = smooth(prog(t, 53.2, 1.6));
    let d = "";
    for (let k = 0; k <= 100 * g; k++) {
      const p = 0.015 + (0.985 * k) / 100;
      d += `${k ? "L" : "M"}${lp.px(p).toFixed(1)},${lp.py(Math.min(4.2, -Math.log(p))).toFixed(1)}`;
    }
    set(path, { d });
    ex.forEach((p, k) => {
      const q = prog(t, 58.8 + k * 1.1, 0.3) * (1 - prog(t, 67.6, 0.4));
      set(marks[k], { cx: lp.px(p), cy: lp.py(-Math.log(p)), r: q > 0 ? 9 : 0 });
    });
  });
}

// ---------------- Scene 6: gradient (68 – 84) ----------------
v.centerTitle("The Gradient: Which Way Is Downhill?", 68.2, 83.6, 60, 46, 560);
life(text("Chain rule, one visitor at a time:", { x: W / 2, y: 190 }, { size: 32, ax: 0.5 }), 68.8, 83.6, "fade");
life(
  tex("\\frac{\\partial \\Lo_i}{\\partial \\beta} = \\frac{\\partial \\Lo_i}{\\partial \\p_i}\\cdot\\frac{\\partial \\p_i}{\\partial \\Z_i}\\cdot\\frac{\\partial \\Z_i}{\\partial \\beta}", { x: W / 2, y: 260 }, { size: 44, ax: 0.5 }),
  69.6,
  83.6,
  "write",
  1.2
);
life(
  tex("\\frac{\\partial \\Lo_i}{\\partial \\p_i} = -\\frac{\\Y_i}{\\p_i} + \\frac{1-\\Y_i}{1-\\p_i} \\qquad \\frac{\\partial \\p_i}{\\partial \\Z_i} = \\p_i(1-\\p_i)", { x: W / 2, y: 410 }, { size: 40, ax: 0.5 }),
  71.8,
  83.6,
  "write",
  1.2
);
life(tex("\\Longrightarrow\\quad \\frac{\\partial \\Lo_i}{\\partial \\Z_i} = \\p_i - \\Y_i", { x: W / 2, y: 545 }, { size: 46, ax: 0.5 }), 74.4, 83.6, "write", 1);
life(text("prediction minus truth", { x: W / 2, y: 630 }, { size: 28, ax: 0.5, color: C.dim }), 75.4, 83.6, "fade");
life(
  tex("\\frac{\\partial \\Lo}{\\partial \\bz} = \\frac{1}{n}\\sum_i (\\p_i - \\Y_i) \\qquad \\frac{\\partial \\Lo}{\\partial \\bo} = \\frac{1}{n}\\sum_i (\\p_i - \\Y_i)\\,\\X_i", { x: W / 2, y: 720 }, { size: 44, ax: 0.5 }),
  77,
  83.6,
  "write",
  1.2
);
life(text("No closed-form answer this time, so we walk downhill, one step at a time.", { x: W / 2, y: 910 }, { size: 32, ax: 0.5 }), 79.6, 83.6, "fade");

// ---------------- Scene 7: one step by hand (84 – 104) ----------------
const G0 = gradient({ b0: 0, b1: 0 });
const sumR = YS.reduce((s2, y) => s2 + (0.5 - y), 0);
const sumRX = YS.reduce((s2, y, i) => s2 + (0.5 - y) * XS[i], 0);
v.sectionTitle("Gradient Descent:", "One Step by Hand", 84.2, 103.6);
life(text("Start at $\\bz = 0,\\ \\bo = 0$:", { x: 70, y: 260 }, { size: 32 }), 84.8, 103.6);
life(tex("\\p_i = \\sig(0) = 0.5 \\ \\text{for everyone}", { x: 70, y: 320 }, { size: 32 }), 85.6, 103.6);
life(tex(`\\frac{\\partial \\Lo}{\\partial \\bz} = \\frac{${fmt(sumR, 1)}}{25} = ${G0.g0.toFixed(3)}`, { x: 70, y: 470 }, { size: 32 }), 95, 103.6, "write", 1);
life(tex(`\\frac{\\partial \\Lo}{\\partial \\bo} = \\frac{${fmt(sumRX, 1)}}{25} = ${G0.g1.toFixed(3)}`, { x: 70, y: 570 }, { size: 32 }), 96.2, 103.6, "write", 1);
life(text("Step with learning rate $\\alpha = 0.1$:", { x: 70, y: 690 }, { size: 30 }), 98, 103.6, "fade");
life(tex(`\\bz \\leftarrow 0 - 0.1 \\times ${G0.g0.toFixed(3)} = \\cO{${(-0.1 * G0.g0).toFixed(3)}}`, { x: 70, y: 745 }, { size: 32 }), 98.8, 103.6, "write", 1);
life(tex(`\\bo \\leftarrow 0 - 0.1 \\times (${G0.g1.toFixed(3)}) = \\cB{${(-0.1 * G0.g1).toFixed(4)}}`, { x: 70, y: 820 }, { size: 32 }), 100, 103.6, "write", 1);
{
  const cols = [
    { x: 790, w: 110, head: "\\X_i", val: (i: number) => `\\cR{${XS[i]}}` },
    { x: 900, w: 90, head: "\\Y_i", val: (i: number) => (YS[i] ? "\\cG{1}" : "\\cD{0}") },
    { x: 990, w: 120, head: "\\p_i", val: () => "\\cP{0.5}" },
    { x: 1120, w: 200, head: "\\p_i - \\Y_i", val: (i: number) => (0.5 - YS[i]).toFixed(1).replace("-", "\\text{−}") },
    { x: 1330, w: 260, head: "(\\p_i - \\Y_i)\\,\\X_i", val: (i: number) => ((0.5 - YS[i]) * XS[i]).toFixed(2).replace("-", "\\text{−}") },
  ];
  const starts = [86.4, 86.4, 87.4, 88.6, 90.2];
  const rowY = (r: number) => 250 + r * 62;
  cols.forEach((c, ci) => {
    life(tex(c.head, { x: c.x + c.w / 2, y: 180 }, { size: 28, ax: 0.5, ay: 0.5 }), starts[ci] - 0.3, 103.6, "fade", 0.4);
    SHOWN.forEach((i, r) => {
      const at = starts[ci] + r * (ci < 2 ? 0.06 : 0.16);
      if (i === null) return void life(tex("\\vdots", { x: c.x + c.w / 2, y: rowY(r) }, { size: 28, ax: 0.5, ay: 0.5 }), at, 103.6, "fade", 0.3);
      life(tex(c.val(i), { x: c.x + c.w / 2, y: rowY(r) }, { size: 28, ax: 0.5, ay: 0.5 }), at, 103.6, "write", 0.3);
    });
  });
  const hr = s("line", { x1: 790, y1: 212, x2: 790, y2: 212, stroke: C.ink, "stroke-width": 2 });
  const sr = s("line", { x1: 1120, y1: rowY(8) - 30, x2: 1120, y2: rowY(8) - 30, stroke: C.ink, "stroke-width": 2 });
  frame((t) => {
    const g = smooth(prog(t, 86.1, 0.7)) * (1 - prog(t, 103.6, 0.5));
    set(hr, { x2: 790 + 800 * g, opacity: g > 0 ? 1 : 0 });
    const g2 = smooth(prog(t, 92.4, 0.5)) * (1 - prog(t, 103.6, 0.5));
    set(sr, { x2: 1120 + 470 * g2, opacity: g2 > 0 ? 1 : 0 });
  });
  life(text("sum of all 25", { x: 1100, y: rowY(8) + 8 }, { size: 24, ax: 1, ay: 0.5, color: C.dim }), 92.6, 103.6, "fade");
  life(tex(fmt(sumR, 1), { x: 1220, y: rowY(8) + 8 }, { size: 32, ax: 0.5, ay: 0.5 }), 93, 103.6, "pop", 0.4);
  life(tex(fmt(sumRX, 1).replace("-", "\\text{−}"), { x: 1460, y: rowY(8) + 8 }, { size: 32, ax: 0.5, ay: 0.5 }), 93.5, 103.6, "pop", 0.4);
}

// ---------------- Scene 8: repeat (104 – 118) ----------------
// step counter runs 1 → 5000 on a log scale
const stepAt = (t: number) => Math.round(Math.pow(GD_STEPS, smooth(prog(t, 105.5, 10))));
v.sectionTitle("Gradient Descent:", "Repeat", 104.2, 117.6);
const readout = v.html("", { x: 70, y: 280 }, { size: 36 });
life(readout, 104.8, 117.6, "fade", 0.5);
life(text("Each step: compute $\\p_i$, the two sums, and nudge.", { x: 70, y: 640 }, { size: 30, color: C.dim, width: 600 }), 106, 117.6, "fade");
life(text("The loss stops falling at the best fit.", { x: 70, y: 720 }, { size: 30, color: C.dim, width: 600 }), 114, 117.6, "fade");
frame((t) => {
  if (t < 104 || t > 118.2) return;
  const k = stepAt(t);
  const c = GD_PATH[k];
  readout.el.innerHTML = [
    `step ${fmt(k)}`,
    v.K(`\\bz = \\cO{${c.b0.toFixed(3)}}`),
    v.K(`\\bo = \\cB{${c.b1.toFixed(4)}}`),
    v.K(`\\Lo = \\cY{${logLoss(c).toFixed(4)}}`),
  ]
    .map((h) => `<div style="margin-bottom:20px">${h}</div>`)
    .join("");
});

// ---------------- Scene 9: fitted model (118 – 132) ----------------
const z7 = BEST.b0 + BEST.b1 * 7;
v.sectionTitle("Logistic Regression:", "The Fitted Model", 118.2, 131.6);
life(tex(`\\p = \\sig(\\cO{${BEST.b0.toFixed(3)}} + \\cB{${BEST.b1.toFixed(4)}}\\,\\X)`, { x: 70, y: 270 }, { size: 40 }), 118.8, 131.6, "write", 1.2);
life(text("A 7-minute visitor:", { x: 70, y: 400 }, { size: 32 }), 120.4, 131.6, "fade");
life(tex(`\\Z = ${BEST.b0.toFixed(3)} + ${BEST.b1.toFixed(4)} \\times \\cR{7} = \\cT{${z7.toFixed(2)}}`, { x: 70, y: 455 }, { size: 32 }), 121, 131.6, "write", 1);
life(tex(`\\p = \\sig(${z7.toFixed(2)}) = \\cP{${sigmoid(z7).toFixed(2)}}`, { x: 70, y: 530 }, { size: 32 }), 122.4, 131.6, "write", 1);
life(text("→ a {purple:66%} chance they buy", { x: 70, y: 600 }, { size: 30 }), 123.4, 131.6, "fade");
life(text("Decision boundary, where $\\p = 0.5$, i.e. $\\Z = 0$:", { x: 70, y: 720 }, { size: 30 }), 125, 131.6, "fade");
life(
  tex(`\\X = -\\frac{\\bz}{\\bo} = \\frac{${(-BEST.b0).toFixed(3)}}{${BEST.b1.toFixed(4)}} = \\cY{${(-BEST.b0 / BEST.b1).toFixed(2)}}\\ \\text{min}`, { x: 70, y: 780 }, { size: 32 }),
  125.8,
  131.6,
  "write",
  1
);
const p7 = s("circle", { r: 0, fill: C.purple }, dataPlot.top);
const g7 = s("line", { stroke: C.purple, "stroke-width": 3, "stroke-dasharray": "8 7", opacity: 0 }, dataPlot.g);
frame((t) => {
  // curve during scenes 8–9 follows gradient descent, then the fit
  if (t >= 104 && t < 132.2) {
    const c = t < 118 ? GD_PATH[stepAt(t)] : BEST;
    set(curve, { d: curvePath((x) => sigmoid(c.b0 + c.b1 * x)), opacity: span(t, 104.6, 131.6), stroke: C.purple });
  } else if (t >= 36 && t < 104) set(curve, { opacity: 0 });
  set(thresh, { opacity: span(t, 124.6, 131.6) });
  const bx = -BEST.b0 / BEST.b1;
  const gb = smooth(prog(t, 125.8, 0.8));
  set(bound, { x1: dataPlot.px(bx), x2: dataPlot.px(bx), y1: dpy(-0.25), y2: lerp(dpy(-0.25), dpy(1.35), gb), opacity: span(t, 125.8, 131.6) });
  const q = prog(t, 122.4, 0.4) * (1 - prog(t, 131.6, 0.4));
  set(p7, { cx: dataPlot.px(7), cy: dpy(sigmoid(z7)), r: q > 0 ? 10 : 0 });
  set(g7, { x1: dataPlot.px(7), x2: dataPlot.px(7), y1: dpy(0), y2: dpy(sigmoid(z7)), opacity: q > 0 ? q : 0 });
  // dots fade between data scenes
  dots.forEach((d) => set(d, { opacity: Math.max(span(t, 10, 35.6), span(t, 104.2, 131.6)) }));
});

// ---------------- Scene 10: end (132 – 140) ----------------
v.endCard(132.4, 139, [
  { tex: "\\p = \\sig(\\bz + \\bo\\,\\X)", size: 72, y: 250 },
  { tex: "\\frac{\\partial \\Lo}{\\partial \\bz} = \\frac{1}{n}\\sum (\\p_i - \\Y_i) \\qquad \\frac{\\partial \\Lo}{\\partial \\bo} = \\frac{1}{n}\\sum (\\p_i - \\Y_i)\\,\\X_i", size: 38, y: 420 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 740 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 810 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 900 },
]);

v.ready();
