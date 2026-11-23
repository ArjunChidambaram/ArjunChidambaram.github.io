import { createVideo, plotFrame, prog, smooth, span, lerp, easeOut, clamp, fmt } from "./engine";
import { XS, YS, sigmoid, BEST, OLS, GD_PATH, GD_STEPS, logLoss } from "../../../lib/explainers/logistic";

const DURATION = 47;
const v = createVideo({
  theme: "light",
  width: 1080,
  height: 1080,
  duration: DURATION,
  macros: {
    "\\bz": "\\textcolor{#E8772E}{\\beta_0}",
    "\\bo": "\\textcolor{#2B8CBE}{\\beta_1}",
    "\\X": "\\textcolor{#E2483D}{x}",
    "\\p": "\\textcolor{#9B59D0}{\\hat{p}}",
    "\\sig": "\\textcolor{#C2507A}{\\sigma}",
  },
});
const { C, W, text, tex, life, s, set, frame } = v;
const TEAL = "#007A7A";
const GREEN = "#05CE91";
const NOBUY = "#94A3B8";

// ---------- title card, then a small header ----------
life(text("Data science, one concept at a time", { x: W / 2, y: 400 }, { size: 30, ax: 0.5, color: TEAL, weight: 500 }), 0.2, 4.4, "fade", 0.8);
life(text("Logistic Regression", { x: W / 2, y: 460 }, { size: 96, ax: 0.5, weight: 600 }), 0.3, 4.4, "fade", 0.9);
life(text("Predicting yes or no", { x: W / 2, y: 600 }, { size: 36, ax: 0.5, color: C.dim }), 0.6, 4.4, "fade", 0.9);
life(text("Logistic Regression", { x: 100, y: 70 }, { size: 56, weight: 600 }), 4.4, 41, "fade", 0.6);
const bar = s("rect", { x: 100, y: 146, width: 0, height: 6, fill: TEAL });
frame((t) => set(bar, { width: 90 * easeOut(prog(t, 4.6, 0.6)), opacity: 1 - prog(t, 41, 0.5) }));

// ---------- plot ----------
const P = plotFrame(v, { left: 190, right: 990, top: 300, bottom: 840 }, [0, 12.5], [-0.12, 1.18], {
  xticks: [0, 2, 4, 6, 8, 10, 12],
  yticks: [0, 0.5, 1],
  yfmt: (y) => (y === 0 ? "0%" : y === 0.5 ? "50%" : "100%"),
  xlabel: "Minutes on the product page",
  spans: [[4.8, 41]],
  plainTicks: true,
  grid: true,
});
const { px, py } = P;
const bandHi = s("rect", { x: 190, y: py(1.18), width: 800, height: py(1) - py(1.18), fill: C.red, opacity: 0 }, P.g);
// prediction regions for the boundary scene
const regionNo = s("rect", { x: 190, y: py(1.18), width: 0, height: py(-0.12) - py(1.18), fill: NOBUY, opacity: 0 }, P.g);
const regionYes = s("rect", { y: py(1.18), width: 0, height: py(-0.12) - py(1.18), fill: GREEN, opacity: 0 }, P.g);
const thresh = s("line", { x1: 190, x2: 990, y1: py(0.5), y2: py(0.5), stroke: C.ink, "stroke-width": 2, "stroke-dasharray": "10 8", opacity: 0 }, P.g);
const bound = s("line", { stroke: C.ink, "stroke-width": 3, opacity: 0 }, P.g);
const curve = s("path", { fill: "none", stroke: TEAL, "stroke-width": 7, "stroke-linecap": "round", opacity: 0 }, P.inner);
const dots = XS.map((x, i) => s("circle", { cx: px(x), cy: py(YS[i]), r: 0, fill: YS[i] ? GREEN : NOBUY, stroke: "#fff", "stroke-width": 3 }, P.top));
const probe = s("circle", { r: 0, fill: "#9B59D0", stroke: "#fff", "stroke-width": 4 }, P.top);
const probeLine = s("line", { stroke: "#9B59D0", "stroke-width": 3, "stroke-dasharray": "8 7", opacity: 0 }, P.g);
life(text("bought", { x: 1000, y: py(1) }, { size: 22, color: GREEN, ay: 0.5, weight: 500 }), 6.4, 41, "fade");
life(text("didn't", { x: 1000, y: py(0) }, { size: 22, color: NOBUY, ay: 0.5, weight: 500 }), 6.4, 41, "fade");

function path(f: (x: number) => number) {
  let d = "";
  for (let k = 0; k <= 120; k++) {
    const x = (12.5 * k) / 120;
    d += `${k ? "L" : "M"}${px(x).toFixed(1)},${py(clamp(f(x), -0.4, 1.5)).toFixed(1)}`;
  }
  return d;
}

// ---------- equation + loss meter (header row) ----------
const eq = tex("\\p = \\sig(\\bz + \\bo\\,\\X)", { x: 100, y: 200 }, { size: 38 });
life(eq, 15.4, 41, "fade", 0.6);
const meter = v.html("", { x: 640, y: 196 }, { size: 24 });
life(meter, 20.4, 28.6, "fade", 0.5);
const prob = v.html("", { x: 640, y: 196 }, { size: 24 });
life(prob, 28.8, 34.2, "fade", 0.4);

// ---------- timeline ----------
const FIT0 = 20.6;
const FIT1 = 27.6;
const stepAt = (t: number) => Math.round(Math.pow(GD_STEPS, smooth(prog(t, FIT0, FIT1 - FIT0))));
const flat = { b0: 0, b1: 0 };
const probeX = (t: number) => lerp(1.5, 10.5, smooth(prog(t, 29.2, 4.2)));

frame((t) => {
  // dots
  dots.forEach((d, i) => {
    const p = prog(t, 5.4 + i * 0.12, 0.35);
    set(d, { r: p <= 0 ? 0 : 11 + Math.sin(p * Math.PI) * 6, opacity: 1 - prog(t, 41, 0.5) });
  });

  // curve: line → sigmoid (flat) → gradient descent → fit
  let f: (x: number) => number = () => 0;
  let vis = 0;
  if (t >= 10.2 && t < 41.6) {
    vis = Math.min(prog(t, 10.4, 0.5), 1 - prog(t, 41, 0.5));
    const m = smooth(prog(t, 15.2, 2.2));
    if (t < FIT0) {
      const target = { b0: lerp(-1.6, flat.b0, 0), b1: 0.29 };
      f = (x) => lerp(OLS.b0 + OLS.b1 * x, sigmoid(target.b0 + target.b1 * x), m);
    } else {
      const c = t < FIT1 ? GD_PATH[stepAt(t)] : BEST;
      // blend from the morph target into the GD path quickly so there's no jump
      const into = smooth(prog(t, FIT0, 0.8));
      const start = { b0: -1.6, b1: 0.29 };
      const b0 = lerp(start.b0, c.b0, into);
      const b1 = lerp(start.b1, c.b1, into);
      f = (x) => sigmoid(b0 + b1 * x);
    }
  }
  set(curve, { d: path(f), opacity: vis, stroke: t < 16.2 ? "#2B8CBE" : TEAL });
  set(bandHi, { opacity: span(t, 11, 15.6, 0.5) * 0.16 });

  // loss meter during fitting
  if (t >= 20 && t < 29) {
    const k = stepAt(t);
    const c = t < FIT1 ? GD_PATH[k] : BEST;
    const L = logLoss(c);
    const L0 = logLoss({ b0: 0, b1: 0 });
    meter.el.innerHTML = `<div style="display:flex;justify-content:space-between;width:340px;color:${C.dim}">Log loss <b style="color:${C.red};font-size:30px">${L.toFixed(3)}</b></div>
      <div style="margin-top:8px;width:340px;height:12px;border-radius:6px;background:${C.grid}"><div style="height:12px;border-radius:6px;background:${C.red};width:${Math.max(4, ((L - 0.45) / (L0 - 0.45)) * 340)}px"></div></div>`;
  }
  // probability probe
  const pv = span(t, 28.8, 34.2, 0.4);
  if (pv > 0) {
    const x = probeX(t);
    const p = sigmoid(BEST.b0 + BEST.b1 * x);
    set(probe, { cx: px(x), cy: py(p), r: 14 * pv });
    set(probeLine, { x1: px(x), x2: px(x), y1: py(0), y2: py(p), opacity: pv });
    prob.el.innerHTML = `<div style="color:${C.dim}">${x.toFixed(1)} minutes →</div><div style="font-size:40px;font-weight:600;color:#9B59D0">${Math.round(p * 100)}% chance to buy</div>`;
  } else {
    set(probe, { r: 0 });
    set(probeLine, { opacity: 0 });
  }
  // decision boundary
  const bx = px(-BEST.b0 / BEST.b1);
  const bv = span(t, 34.4, 41, 0.5);
  const grow = smooth(prog(t, 35, 1));
  set(thresh, { opacity: bv });
  set(bound, { x1: bx, x2: bx, y1: py(-0.12), y2: lerp(py(-0.12), py(1.18), grow), opacity: bv });
  const rg = smooth(prog(t, 36.2, 1)) * bv;
  set(regionNo, { width: (bx - 190) * rg, opacity: 0.12 * (rg > 0 ? 1 : 0) });
  set(regionYes, { x: bx, width: (990 - bx) * rg, opacity: 0.14 * (rg > 0 ? 1 : 0) });
});
life(text("predict: won't buy", { x: (190 + px(-BEST.b0 / BEST.b1)) / 2, y: py(0.82) }, { size: 26, ax: 0.5, color: C.dim, weight: 500 }), 36.8, 41, "fade");
life(text("predict: will buy", { x: (990 + px(-BEST.b0 / BEST.b1)) / 2, y: py(0.18) }, { size: 26, ax: 0.5, color: "#047857", weight: 500 }), 37.1, 41, "fade");
life(text(`${(-BEST.b0 / BEST.b1).toFixed(1)} min`, { x: px(-BEST.b0 / BEST.b1), y: py(1.18) - 8 }, { size: 24, ax: 0.5, ay: 1, weight: 600 }), 36, 41, "pop", 0.4);

// ---------- captions ----------
const CAP: [number, number, string][] = [
  [5, 10.2, "25 visitors. Did they buy after viewing the product?"],
  [10.4, 15.2, "A straight line overshoots: it predicts over 100%."],
  [15.4, 20.4, "Squash it into an S-curve. Every output is a probability."],
  [20.6, 28.6, "Training tunes the curve so the real outcomes look most likely."],
  [28.8, 34.2, "Read off the chance of buying at any visit length."],
  [34.4, 41, "Above 50%, predict “buy”. That's the decision boundary."],
];
for (const [a, b, str] of CAP) life(text(str, { x: W / 2, y: 975 }, { size: 32, ax: 0.5, weight: 500 }), a, b, "fade", 0.35);

// ---------- end card ----------
life(text("Logistic regression in one line", { x: W / 2, y: 290 }, { size: 34, ax: 0.5, color: C.dim }), 41.4, 48, "fade");
life(tex("\\p = \\sig(\\bz + \\bo\\,\\X)", { x: W / 2, y: 360 }, { size: 80, ax: 0.5 }), 41.6, 48, "fade");
life(text("A line, squashed into a probability.", { x: W / 2, y: 540 }, { size: 36, ax: 0.5 }), 41.9, 48, "fade");
life(text("Arjun Chidambaram Subbiah", { x: W / 2, y: 760 }, { size: 38, ax: 0.5, weight: 600 }), 42.4, 48, "fade");
life(text("Data science, one concept at a time", { x: W / 2, y: 815 }, { size: 28, ax: 0.5, color: TEAL }), 42.7, 48, "fade");
life(text("arjunchidambaram.github.io", { x: W / 2, y: 930 }, { size: 26, ax: 0.5, color: C.dim }), 43, 48, "fade");

v.ready();
// silence unused-import lint in this file
void fmt;
