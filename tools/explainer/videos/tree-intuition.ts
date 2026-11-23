import { createVideo, plotFrame, prog, smooth, span, lerp, easeOut } from "./engine";
import { TRAIN, TREE2, candidates, regions, grow, gini, DEPTH_CURVE, type Node } from "../../../lib/explainers/tree";

const DURATION = 47;
const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: DURATION });
const { C, W, text, life, s, set, frame } = v;
const TEAL = "#007A7A";
const GREEN = "#05CE91";
const NO = "#94A3B8";
const SPLIT = "#D4A017";

// ---------- title ----------
life(text("Data science, one concept at a time", { x: W / 2, y: 400 }, { size: 30, ax: 0.5, color: TEAL, weight: 500 }), 0.2, 4.4, "fade", 0.8);
life(text("Decision Trees", { x: W / 2, y: 460 }, { size: 96, ax: 0.5, weight: 600 }), 0.3, 4.4, "fade", 0.9);
life(text("Twenty questions, for data", { x: W / 2, y: 600 }, { size: 36, ax: 0.5, color: C.dim }), 0.6, 4.4, "fade", 0.9);
life(text("Decision Trees", { x: 100, y: 70 }, { size: 56, weight: 600 }), 4.4, 41, "fade", 0.6);
const bar = s("rect", { x: 100, y: 146, width: 0, height: 6, fill: TEAL });
frame((t) => set(bar, { width: 90 * easeOut(prog(t, 4.6, 0.6)), opacity: 1 - prog(t, 41, 0.5) }));

// ---------- plot ----------
const P = plotFrame(v, { left: 190, right: 990, top: 330, bottom: 850 }, [0, 12.5], [-0.5, 8.5], {
  xticks: [0, 2, 4, 6, 8, 10, 12],
  yticks: [0, 2, 4, 6, 8],
  xlabel: "Minutes on the product page",
  ylabel: "Past purchases",
  spans: [[4.8, 41]],
  plainTicks: true,
});
const { px, py } = P;
const MAXR = 16;
const rects = Array.from({ length: MAXR }, () => s("rect", { opacity: 0, stroke: "#fff", "stroke-width": 1 }, P.inner));
const lines = Array.from({ length: MAXR }, () => s("line", { stroke: SPLIT, "stroke-width": 4, opacity: 0 }, P.g));
const sweep = s("line", { stroke: SPLIT, "stroke-width": 4, "stroke-dasharray": "10 8", opacity: 0 }, P.g);
const dots = TRAIN.map((p) => s("circle", { cx: px(p.x[0]), cy: py(p.x[1]), r: 0, fill: p.y ? GREEN : NO, stroke: "#fff", "stroke-width": 3 }, P.top));
const star = s("path", { fill: "#9B59D0", stroke: "#fff", "stroke-width": 3 }, P.top);

// readouts in the header row
const meter = v.html("", { x: 100, y: 196 }, { size: 26 });
life(meter, 10.4, 16.8, "fade", 0.4);
const chips = v.html("", { x: 100, y: 196 }, { size: 26 });
life(chips, 29.4, 35.2, "fade", 0.4);
const acc = v.html("", { x: 100, y: 196 }, { size: 26 });
life(acc, 35.6, 41, "fade", 0.4);

const root = TREE2 as Extract<Node, { leaf: false }>;
const cands = candidates(TRAIN, [0]);
const sweepT = (t: number) => {
  if (t < 15) return lerp(1.2, 11.6, smooth(prog(t, 10.6, 4.4)));
  return lerp(11.6, root.threshold, smooth(prog(t, 15, 1.4)));
};
const DEEP = grow(TRAIN, 8);

// splits of a tree as line segments within bounds
function splitLines(node: Node, b = { x0: 0, x1: 12.5, y0: -0.5, y1: 8.5 }, out: { x1: number; x2: number; y1: number; y2: number; depth: number }[] = []) {
  if (node.leaf) return out;
  if (node.feature === 0) {
    out.push({ x1: node.threshold, x2: node.threshold, y1: b.y0, y2: b.y1, depth: node.depth });
    splitLines(node.left, { ...b, x1: node.threshold }, out);
    splitLines(node.right, { ...b, x0: node.threshold }, out);
  } else {
    out.push({ x1: b.x0, x2: b.x1, y1: node.threshold, y2: node.threshold, depth: node.depth });
    splitLines(node.left, { ...b, y1: node.threshold }, out);
    splitLines(node.right, { ...b, y0: node.threshold }, out);
  }
  return out;
}
const L2 = splitLines(TREE2);
const LD = splitLines(DEEP);
const R1 = [
  { x0: 0, x1: root.threshold, y0: -0.5, y1: 8.5, pred: root.left.pred },
  { x0: root.threshold, x1: 12.5, y0: -0.5, y1: 8.5, pred: root.right.pred },
];
const R2 = regions(TREE2);
const RD = regions(DEEP);

frame((t) => {
  const fade = 1 - prog(t, 41, 0.5);
  dots.forEach((d, i) => {
    const p = prog(t, 5.4 + i * 0.09, 0.35);
    set(d, { r: p <= 0 ? 0 : (11 + Math.sin(p * Math.PI) * 6) * fade });
  });
  // sweep and meter
  const sv = span(t, 10.4, 16.6, 0.4);
  const th = sweepT(t);
  set(sweep, { x1: px(th), x2: px(th), y1: py(-0.5), y2: py(8.5), opacity: sv });
  if (sv > 0) {
    const c = cands.reduce((a, b) => (Math.abs(b.threshold - th) < Math.abs(a.threshold - th) ? b : a));
    const purity = 1 - c.score / 0.5;
    meter.el.innerHTML = `<div style="display:flex;justify-content:space-between;width:500px;color:${C.dim}">Split at ${th.toFixed(1)} min <b style="color:${SPLIT};font-size:32px">impurity ${c.score.toFixed(3)}</b></div>
      <div style="margin-top:8px;width:500px;height:12px;border-radius:6px;background:${C.grid}"><div style="height:12px;border-radius:6px;background:${SPLIT};width:${Math.max(6, ((c.score - 0.38) / (0.5 - 0.38)) * 500)}px"></div></div>`;
    void purity;
  }
  // which partition to show
  const stage = t < 16.6 ? 0 : t < 22.4 ? 1 : t < 35.6 ? 2 : 3;
  const regs = stage === 1 ? R1 : stage === 2 ? R2 : stage === 3 ? RD : [];
  const ls = stage === 1 ? L2.slice(0, 1) : stage === 2 ? L2 : stage === 3 ? LD : [];
  const shade = stage === 1 ? smooth(prog(t, 17.4, 0.8)) : stage === 2 ? 1 : stage === 3 ? 1 : 0;
  rects.forEach((r, i) => {
    const q = regs[i];
    if (!q) return set(r, { opacity: 0 });
    set(r, { x: px(q.x0), width: px(q.x1) - px(q.x0), y: py(q.y1), height: py(q.y0) - py(q.y1), fill: q.pred ? GREEN : NO, opacity: 0.18 * shade * fade });
  });
  lines.forEach((l, i) => {
    const q = ls[i];
    if (!q) return set(l, { opacity: 0 });
    // second-level lines draw in during 23–25
    const g = stage === 2 && i > 0 ? smooth(prog(t, 23 + (i - 1) * 1.2, 0.9)) : stage === 3 ? smooth(prog(t, 36 + q.depth * 0.5, 0.6)) : 1;
    set(l, { x1: px(q.x1), x2: lerp(px(q.x1), px(q.x2), g), y1: py(q.y1), y2: lerp(py(q.y1), py(q.y2), g), opacity: fade, "stroke-width": stage === 3 && q.depth > 1 ? 2.5 : 4 });
  });
  // new visitor
  const qv = span(t, 29.6, 35.2, 0.4);
  const cx = px(8);
  const cy = py(3);
  let d = "";
  for (let k = 0; k < 10; k++) {
    const a = (Math.PI / 5) * k - Math.PI / 2;
    const rr = (k % 2 ? 9 : 22) * qv;
    d += `${k ? "L" : "M"}${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }
  set(star, { d: qv > 0 ? d + "Z" : "" });
  const chip = (txt2: string, on: boolean, color: string) =>
    `<span style="display:inline-block;margin-right:10px;padding:6px 14px;border-radius:999px;background:${on ? color : C.grid};color:${on ? "#fff" : C.dim};font-weight:500">${txt2}</span>`;
  if (t > 29 && t < 35.6)
    chips.el.innerHTML = [
      chip("Over 5.8 min? Yes", t > 30.6, SPLIT),
      chip("2+ past purchases? Yes", t > 31.8, SPLIT),
      chip("→ will buy", t > 33, GREEN),
    ].join("");
  if (t > 35.4) {
    const deep = DEPTH_CURVE[DEPTH_CURVE.length - 1];
    const two = DEPTH_CURVE[1];
    const p = smooth(prog(t, 36.4, 2.4));
    acc.el.innerHTML = `<div style="color:${C.dim}">Training accuracy <b style="color:${C.ink}">${Math.round(lerp(two.train, deep.train, p) * 100)}%</b>&nbsp;&nbsp;&nbsp;New visitors <b style="color:${C.red};font-size:32px">${Math.round(
      lerp(two.test, deep.test, p) * 100
    )}%</b></div>`;
  }
});
void gini;

// ---------- captions ----------
const CAP: [number, number, string][] = [
  [5, 10.2, "40 visitors. Who bought, and can we predict it?"],
  [10.4, 16.6, "Try every question. Keep the one that best separates the groups."],
  [16.8, 22.4, "Each side gets its majority answer."],
  [22.6, 29.4, "Then ask another question inside each side."],
  [29.6, 35.4, "A new visitor just answers the questions."],
  [35.6, 41, "Too many questions memorize noise. Keep trees shallow."],
];
for (const [a, b, str] of CAP) life(text(str, { x: W / 2, y: 975 }, { size: 32, ax: 0.5, weight: 500 }), a, b, "fade", 0.35);

// ---------- end card ----------
life(text("Decision trees in one line", { x: W / 2, y: 300 }, { size: 34, ax: 0.5, color: C.dim }), 41.4, 48, "fade");
life(text("Ask the question that makes", { x: W / 2, y: 380 }, { size: 56, ax: 0.5, weight: 600 }), 41.6, 48, "fade");
life(text("the groups purest. Repeat.", { x: W / 2, y: 460 }, { size: 56, ax: 0.5, weight: 600 }), 41.7, 48, "fade");
life(text("Arjun Chidambaram Subbiah", { x: W / 2, y: 760 }, { size: 38, ax: 0.5, weight: 600 }), 42.4, 48, "fade");
life(text("Data science, one concept at a time", { x: W / 2, y: 815 }, { size: 28, ax: 0.5, color: TEAL }), 42.7, 48, "fade");
life(text("arjunchidambaram.github.io", { x: W / 2, y: 930 }, { size: 26, ax: 0.5, color: C.dim }), 43, 48, "fade");

v.ready();
