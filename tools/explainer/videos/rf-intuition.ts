import { createVideo, plotFrame, prog, smooth, span, easeOut, lerp } from "./engine";
import { TRAIN, FOREST, FOREST_CURVE, DEPTH_CURVE, voteShare, regions, grow, predict } from "../../../lib/explainers/tree";

const DURATION = 47;
const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: DURATION });
const { C, W, text, life, s, set, frame } = v;
const TEAL = "#007A7A";
const GREEN = "#05CE91";
const NO = "#94A3B8";

life(text("Data science, one concept at a time", { x: W / 2, y: 400 }, { size: 30, ax: 0.5, color: TEAL, weight: 500 }), 0.2, 4.4, "fade", 0.8);
life(text("Random Forests", { x: W / 2, y: 460 }, { size: 96, ax: 0.5, weight: 600 }), 0.3, 4.4, "fade", 0.9);
life(text("Many trees, one vote", { x: W / 2, y: 600 }, { size: 36, ax: 0.5, color: C.dim }), 0.6, 4.4, "fade", 0.9);
life(text("Random Forests", { x: 100, y: 70 }, { size: 56, weight: 600 }), 4.4, 41, "fade", 0.6);
const bar = s("rect", { x: 100, y: 146, width: 0, height: 6, fill: TEAL });
frame((t) => set(bar, { width: 90 * easeOut(prog(t, 4.6, 0.6)), opacity: 1 - prog(t, 41, 0.5) }));

const P = plotFrame(v, { left: 190, right: 990, top: 330, bottom: 850 }, [0, 12.5], [-0.5, 8.5], {
  xticks: [0, 2, 4, 6, 8, 10, 12],
  yticks: [0, 2, 4, 6, 8],
  xlabel: "Minutes on the product page",
  ylabel: "Past purchases",
  spans: [[4.8, 41]],
  plainTicks: true,
});
const { px, py } = P;

// tree regions (for single trees) and a vote-share heat map (for the forest)
const MAXR = 40;
const rects = Array.from({ length: MAXR }, () => s("rect", { opacity: 0, stroke: "#fff", "stroke-width": 1.5 }, P.inner));
const GX = 40;
const GY = 30;
const cw = (px(12.5) - px(0)) / GX;
const ch = (py(-0.5) - py(8.5)) / GY;
const cells: SVGRectElement[] = [];
for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) cells.push(s("rect", { x: px(0) + i * cw, y: py(-0.5) - (j + 1) * ch, width: cw + 0.6, height: ch + 0.6, opacity: 0 }, P.inner));
const cache = new Map<number, number[]>();
const shares = (n: number) => {
  if (!cache.has(n)) {
    const f = FOREST.slice(0, n);
    const out: number[] = [];
    for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) out.push(voteShare(f, [((i + 0.5) / GX) * 12.5, -0.5 + ((j + 0.5) / GY) * 9]));
    cache.set(n, out);
  }
  return cache.get(n)!;
};
const dots = TRAIN.map((p) => s("circle", { cx: px(p.x[0]), cy: py(p.x[1]), r: 0, fill: p.y ? GREEN : NO, stroke: "#fff", "stroke-width": 3 }, P.top));
const star = s("path", { fill: "#9B59D0", stroke: "#fff", "stroke-width": 3 }, P.top);

const head = v.html("", { x: 100, y: 196 }, { size: 28 });
life(head, 5, 41, "fade", 0.3);
const DEEP = grow(TRAIN, 12);
const NEW: [number, number] = [8, 3];
const votes = FOREST.map((f) => predict(f.tree, NEW));

// forest size grows during 20–30
const sizeAt = (t: number) => Math.max(1, Math.round(Math.pow(FOREST.length, smooth(prog(t, 20.4, 8.4)))));
// which single tree is shown during 10–20
const treeAt = (t: number) => Math.min(5, Math.floor((t - 10.4) / 1.6));

frame((t) => {
  const fade = 1 - prog(t, 41, 0.5);
  dots.forEach((d, i) => {
    const p = prog(t, 5.2 + i * 0.06, 0.3);
    let r = p <= 0 ? 0 : 11 + Math.sin(p * Math.PI) * 6;
    // during the bootstrap scene, size dots by how often the current tree drew them
    if (t >= 10.4 && t < 20) {
      const c = FOREST[treeAt(t)].counts[i];
      r = c === 0 ? 6 : 8 + c * 4;
      set(d, { opacity: c === 0 ? 0.3 : 1 });
    } else set(d, { opacity: 1 });
    set(d, { r: r * fade });
  });
  // single trees
  let regs: ReturnType<typeof regions> = [];
  if (t >= 6.4 && t < 10.4) regs = regions(DEEP);
  else if (t >= 10.4 && t < 20) regs = regions(FOREST[treeAt(t)].tree);
  rects.forEach((r, i) => {
    const q = regs[i];
    if (!q) return set(r, { opacity: 0 });
    set(r, { x: px(q.x0), width: px(q.x1) - px(q.x0), y: py(q.y1), height: py(q.y0) - py(q.y1), fill: q.pred ? GREEN : NO, opacity: 0.22 * fade * Math.min(prog(t, 6.6, 0.5), 1) });
  });
  // heat map
  const hv = span(t, 20.2, 41, 0.4);
  if (hv > 0) {
    const sh = shares(sizeAt(t));
    cells.forEach((c, k) => set(c, { fill: sh[k] >= 0.5 ? GREEN : NO, opacity: hv * (0.05 + 0.35 * Math.abs(sh[k] - 0.5) * 2) }));
  } else cells.forEach((c) => set(c, { opacity: 0 }));
  // header readouts
  if (t >= 6.4 && t < 10.4) head.el.innerHTML = `<span style="color:${C.dim}">One deep tree. New-visitor accuracy</span> <b style="color:${C.red};font-size:34px">${Math.round(DEPTH_CURVE[7].test * 100)}%</b>`;
  else if (t >= 10.4 && t < 20) {
    const k = treeAt(t);
    const out = FOREST[k].counts.filter((c) => c === 0).length;
    head.el.innerHTML = `<b>Tree ${k + 1}</b> <span style="color:${C.dim}">sees a random resample: ${out} of 40 visitors left out</span>`;
  } else if (t >= 20 && t < 30.4) {
    const n = sizeAt(t);
    const acc = FOREST_CURVE.reduce((a, b) => (b.trees <= n ? b : a)).test;
    head.el.innerHTML = `<span style="color:${C.dim}">Votes from</span> <b style="color:${TEAL};font-size:34px">${n}</b> <span style="color:${C.dim}">tree${n > 1 ? "s" : ""}. New-visitor accuracy</span> <b style="font-size:34px">${Math.round(acc * 100)}%</b>`;
  } else if (t >= 30.4 && t < 36) {
    const shown = Math.min(FOREST.length, Math.round(lerp(0, FOREST.length, smooth(prog(t, 31, 3)))));
    const yes = votes.slice(0, shown).reduce((a, b) => a + b, 0);
    const w = 600;
    head.el.innerHTML = `<div><span style="color:${C.dim}">8 min, 3 past purchases:</span> <b style="color:#047857;font-size:32px">${yes}</b> <span style="color:${C.dim}">of ${shown} trees say buy</span></div>
      <div style="margin-top:8px;width:${w}px;height:12px;border-radius:6px;background:${C.grid}"><div style="height:12px;border-radius:6px;background:${GREEN};width:${(yes / FOREST.length) * w}px"></div></div>`;
  } else if (t >= 36) {
    head.el.innerHTML = `<span style="color:${C.dim}">One deep tree</span> <b style="color:${C.red};font-size:34px">${Math.round(DEPTH_CURVE[7].test * 100)}%</b>&nbsp;&nbsp;<span style="color:${C.dim}">→ forest of 200</span> <b style="color:${TEAL};font-size:34px">${Math.round(FOREST_CURVE[8].test * 100)}%</b>`;
  }
  // new visitor
  const qv = span(t, 30.6, 36, 0.4);
  let d = "";
  const cx = px(NEW[0]);
  const cy = py(NEW[1]);
  for (let k = 0; k < 10; k++) {
    const a = (Math.PI / 5) * k - Math.PI / 2;
    const rr = (k % 2 ? 9 : 22) * qv;
    d += `${k ? "L" : "M"}${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }
  set(star, { d: qv > 0 ? d + "Z" : "" });
});

const CAP: [number, number, string][] = [
  [5, 10.2, "One deep tree chases every point, noise included."],
  [10.4, 20, "So grow many trees, each on a random resample of the data."],
  [20.2, 30.4, "Average their votes. Their different mistakes cancel out."],
  [30.6, 36, "Every prediction is a vote."],
  [36.2, 41, "Many noisy trees, one far steadier model."],
];
for (const [a, b, str] of CAP) life(text(str, { x: W / 2, y: 975 }, { size: 32, ax: 0.5, weight: 500 }), a, b, "fade", 0.35);

life(text("Random forests in one line", { x: W / 2, y: 300 }, { size: 34, ax: 0.5, color: C.dim }), 41.4, 48, "fade");
life(text("Grow many different trees.", { x: W / 2, y: 380 }, { size: 56, ax: 0.5, weight: 600 }), 41.6, 48, "fade");
life(text("Let them vote.", { x: W / 2, y: 460 }, { size: 56, ax: 0.5, weight: 600 }), 41.7, 48, "fade");
life(text("Arjun Chidambaram Subbiah", { x: W / 2, y: 760 }, { size: 38, ax: 0.5, weight: 600 }), 42.4, 48, "fade");
life(text("Data science, one concept at a time", { x: W / 2, y: 815 }, { size: 28, ax: 0.5, color: TEAL }), 42.7, 48, "fade");
life(text("arjunchidambaram.github.io", { x: W / 2, y: 930 }, { size: 26, ax: 0.5, color: C.dim }), 43, 48, "fade");

v.ready();
