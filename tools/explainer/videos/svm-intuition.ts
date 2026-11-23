import { createVideo, plotFrame, prog, smooth, span, easeOut, lerp } from "./engine";
import { X1, X2, Y, MODEL, fitSVM, marginWidth, supportVectors, decision, type SVM } from "../../../lib/explainers/svm";

const DURATION = 47;
const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: DURATION });
const { C, W, text, life, s, set, frame } = v;
const TEAL = "#007A7A";
const GREEN = "#05CE91";
const NO = "#94A3B8";
const BLUE = "#2563EB";
const GOLD = "#E0A100";

life(text("Data science, one concept at a time", { x: W / 2, y: 400 }, { size: 30, ax: 0.5, color: TEAL, weight: 500 }), 0.2, 4.4, "fade", 0.8);
life(text("Support Vector Machines", { x: W / 2, y: 460 }, { size: 80, ax: 0.5, weight: 600 }), 0.3, 4.4, "fade", 0.9);
life(text("Find the widest street", { x: W / 2, y: 590 }, { size: 36, ax: 0.5, color: C.dim }), 0.6, 4.4, "fade", 0.9);
life(text("Support Vector Machines", { x: 100, y: 70 }, { size: 56, weight: 600 }), 4.4, 41, "fade", 0.6);
const bar = s("rect", { x: 100, y: 146, width: 0, height: 6, fill: TEAL });
frame((t) => set(bar, { width: 90 * easeOut(prog(t, 4.6, 0.6)), opacity: 1 - prog(t, 41, 0.5) }));

const P = plotFrame(v, { left: 190, right: 990, top: 300, bottom: 860 }, [0, 12], [0, 12], {
  xticks: [0, 2, 4, 6, 8, 10, 12],
  yticks: [0, 2, 4, 6, 8, 10, 12],
  xlabel: "Minutes on the product page",
  ylabel: "Pages viewed",
  spans: [[4.8, 41]],
  plainTicks: true,
});
const { px, py } = P;
const street = s("path", { fill: BLUE, opacity: 0 }, P.inner);
const edgeA = s("line", { stroke: BLUE, "stroke-width": 3, "stroke-dasharray": "12 9", opacity: 0 }, P.inner);
const edgeB = s("line", { stroke: BLUE, "stroke-width": 3, "stroke-dasharray": "12 9", opacity: 0 }, P.inner);
const mid = s("line", { stroke: BLUE, "stroke-width": 5, opacity: 0 }, P.inner);
const tries = [0, 1, 2].map(() => s("line", { stroke: "#64748B", "stroke-width": 4, opacity: 0 }, P.inner));
const rings = Y.map(() => s("circle", { r: 0, fill: "none", stroke: GOLD, "stroke-width": 4 }, P.top));
const dots = Y.map((y) => s("circle", { r: 0, fill: y === 1 ? GREEN : NO, stroke: "#fff", "stroke-width": 3 }, P.top));
const star = s("path", { fill: "#9B59D0", stroke: "#fff", "stroke-width": 3 }, P.top);
const head = v.html("", { x: 100, y: 196 }, { size: 28 });
life(head, 5, 41, "fade", 0.3);

type Line = { w: [number, number]; b: number };
const seg = (m: Line, level: number) => ({
  x1: px(-1),
  y1: py((level - m.b + m.w[0]) / m.w[1]),
  x2: px(13),
  y2: py((level - m.b - m.w[0] * 13) / m.w[1]),
});
function drawStreet(m: Line, a: number) {
  const p = seg(m, 1);
  const q = seg(m, -1);
  set(street, { d: `M${p.x1},${p.y1}L${p.x2},${p.y2}L${q.x2},${q.y2}L${q.x1},${q.y1}Z`, opacity: 0.14 * a });
  set(edgeA, { ...p, opacity: a });
  set(edgeB, { ...q, opacity: a });
  set(mid, { ...seg(m, 0), opacity: a });
}
const TRIES: Line[] = [
  { w: [0.9, 0.2], b: -6.4 },
  { w: [0.55, 0.6], b: -6.6 },
  { w: [1.0, 0.45], b: -8.3 },
];
const CS = [0.05, 0.1, 0.3, 1];
const MODELS = CS.map((c) => fitSVM(c));
const cAt = (t: number) => Math.min(CS.length - 1, Math.floor(prog(t, 28.6, 6.4) * CS.length));
const SV = new Set(supportVectors(MODEL));
// a far-away buyer that wanders around without touching the street
const MOVER = 8;
const NEW: [number, number] = [6, 7];

frame((t) => {
  const fade = 1 - prog(t, 41, 0.5);
  // which model is on screen
  let m: SVM = MODEL;
  if (t >= 28 && t < 36) m = MODELS[cAt(t)];
  const sv = new Set(supportVectors(m));
  dots.forEach((d, i) => {
    const p = prog(t, 5.2 + i * 0.06, 0.3);
    let x = X1[i];
    let y = X2[i];
    if (i === MOVER) {
      const q = smooth(span(t, 21.4, 27.4, 2));
      x -= 2.2 * q;
      y -= 1.8 * q;
    }
    const dim = t >= 20.2 && t < 28 && !SV.has(i) && i !== MOVER ? 0.25 : 1;
    set(d, { cx: px(x), cy: py(y), r: (p <= 0 ? 0 : 11 + Math.sin(p * Math.PI) * 6) * fade, opacity: dim });
    const ra = span(t, 16.4, 41, 0.4) * (sv.has(i) ? 1 : 0);
    set(rings[i], { cx: px(x), cy: py(y), r: 20 * ra * fade });
  });
  tries.forEach((l, k) => set(l, { ...seg(TRIES[k], 0), opacity: span(t, 6.4 + k * 1.6, 12.4, 0.4) }));
  if (t >= 12.4) {
    const g = smooth(prog(t, 12.6, 2.4));
    const sc = lerp(8, 1, g);
    drawStreet({ w: [m.w[0] * sc, m.w[1] * sc], b: m.b * sc }, span(t, 12.4, 41) * fade);
  } else drawStreet(MODEL, 0);

  if (t < 12.4) head.el.innerHTML = `<span style="color:${C.dim}">Many lines split buyers from non-buyers. Which is best?</span>`;
  else if (t < 20.2) {
    const g = smooth(prog(t, 12.6, 2.4));
    head.el.innerHTML = `<span style="color:${C.dim}">Street width</span> <b style="color:${BLUE};font-size:34px">${(marginWidth(MODEL) * g).toFixed(2)}</b>${t > 16.4 ? `&nbsp;&nbsp;<b style="color:${GOLD}">${SV.size}</b> <span style="color:${C.dim}">support vectors</span>` : ""}`;
  } else if (t < 28) head.el.innerHTML = `<span style="color:${C.dim}">Only the</span> <b style="color:${GOLD}">${SV.size} circled points</b> <span style="color:${C.dim}">set the street.</span>`;
  else if (t < 36) {
    const k = cAt(t);
    head.el.innerHTML = `<b>C = ${CS[k]}</b>&nbsp;&nbsp;<span style="color:${C.dim}">width</span> <b style="color:${BLUE};font-size:34px">${marginWidth(MODELS[k]).toFixed(2)}</b>&nbsp;&nbsp;<b style="color:${GOLD}">${supportVectors(MODELS[k]).length}</b> <span style="color:${C.dim}">support vectors</span>`;
  } else {
    const f = decision(MODEL, NEW[0], NEW[1]);
    head.el.innerHTML = `<span style="color:${C.dim}">6 min, 7 pages: score</span> <b style="color:#7C3AED;font-size:34px">${f.toFixed(2)}</b> <span style="color:${C.dim}">→ buyer side, inside the street</span>`;
  }
  const qv = span(t, 36.4, 41, 0.4);
  let d = "";
  for (let k = 0; k < 10; k++) {
    const a = (Math.PI / 5) * k - Math.PI / 2;
    const rr = (k % 2 ? 9 : 22) * qv;
    d += `${k ? "L" : "M"}${(px(NEW[0]) + rr * Math.cos(a)).toFixed(1)},${(py(NEW[1]) + rr * Math.sin(a)).toFixed(1)}`;
  }
  set(star, { d: qv > 0 ? d + "Z" : "" });
});

const CAP: [number, number, string][] = [
  [5, 12.2, "Lots of lines separate the two groups."],
  [12.4, 20, "An SVM picks the one with the widest street around it."],
  [20.2, 28, "Points away from the street can move. The line won't."],
  [28.2, 36, "C sets the price of points inside the street."],
  [36.2, 41, "New visitors are classified by their side of the street."],
];
for (const [a, b, str] of CAP) life(text(str, { x: W / 2, y: 975 }, { size: 32, ax: 0.5, weight: 500 }), a, b, "fade", 0.35);

life(text("SVMs in one line", { x: W / 2, y: 300 }, { size: 34, ax: 0.5, color: C.dim }), 41.4, 48, "fade");
life(text("Draw the widest street", { x: W / 2, y: 380 }, { size: 56, ax: 0.5, weight: 600 }), 41.6, 48, "fade");
life(text("between the two classes.", { x: W / 2, y: 460 }, { size: 56, ax: 0.5, weight: 600 }), 41.7, 48, "fade");
life(text("Arjun Chidambaram Subbiah", { x: W / 2, y: 760 }, { size: 38, ax: 0.5, weight: 600 }), 42.4, 48, "fade");
life(text("Data science, one concept at a time", { x: W / 2, y: 815 }, { size: 28, ax: 0.5, color: TEAL }), 42.7, 48, "fade");
life(text("arjunchidambaram.github.io", { x: W / 2, y: 930 }, { size: 26, ax: 0.5, color: C.dim }), 43, 48, "fade");

v.ready();
