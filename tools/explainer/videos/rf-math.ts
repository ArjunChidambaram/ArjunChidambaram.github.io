import { createVideo, plotFrame, prog, smooth, span, lerp } from "./engine";
import { TRAIN, FOREST, FOREST_CURVE, DEPTH_CURVE, voteShare, regions, predict, oobAccuracy } from "../../../lib/explainers/tree";

const DURATION = 112;
const v = createVideo({
  theme: "dark",
  width: 1920,
  height: 1080,
  duration: DURATION,
  macros: { "\\B": "\\textcolor{#58C4DD}{B}", "\\rh": "\\textcolor{#FC6255}{\\rho}", "\\sg": "\\textcolor{#F4D35E}{\\sigma^2}" },
});
const { C, W, tex, text, life, s, set, frame } = v;
const BUY = C.green;
const NO = "#8A8F98";
const N = TRAIN.length;

// heat map of vote share (cached per forest size)
const GX = 50;
const GY = 36;
const cache = new Map<number, number[]>();
function shares(n: number) {
  if (!cache.has(n)) {
    const f = FOREST.slice(0, n);
    const out: number[] = [];
    for (let j = 0; j < GY; j++)
      for (let i = 0; i < GX; i++) out.push(voteShare(f, [((i + 0.5) / GX) * 12.5, -0.5 + ((j + 0.5) / GY) * 9]));
    cache.set(n, out);
  }
  return cache.get(n)!;
}
function heatLayer(P: ReturnType<typeof plotFrame>) {
  const cells: SVGRectElement[] = [];
  const cw = (P.px(12.5) - P.px(0)) / GX;
  const ch = (P.py(-0.5) - P.py(8.5)) / GY;
  for (let j = 0; j < GY; j++)
    for (let i = 0; i < GX; i++)
      cells.push(s("rect", { x: P.px(0) + i * cw, y: P.py(-0.5) - (j + 1) * ch, width: cw + 0.6, height: ch + 0.6, opacity: 0 }, P.inner));
  return (n: number, alpha: number) => {
    const sh = shares(n);
    cells.forEach((c, k) => set(c, { fill: sh[k] >= 0.5 ? BUY : NO, opacity: alpha * (0.08 + 0.42 * Math.abs(sh[k] - 0.5) * 2) }));
  };
}
const dotsOn = (P: ReturnType<typeof plotFrame>, r = 7) => TRAIN.map((p) => s("circle", { cx: P.px(p.x[0]), cy: P.py(p.x[1]), r, fill: p.y ? BUY : NO, stroke: "#000", "stroke-width": 1.5 }, P.top));

// ---------------- Scene 1: title (0 – 9) ----------------
v.centerTitle("Random Forests", 0.2, 8.4, 70, 64, 520);
life(text("One deep decision tree {red:memorizes noise}, and small changes in the data reshape it.", { x: W / 2, y: 330 }, { size: 36, ax: 0.5 }), 1.4, 8.4, "fade");
life(text("A random forest trains {blue:many different trees} and lets them {green:vote}.", { x: W / 2, y: 400 }, { size: 36, ax: 0.5 }), 3.2, 8.4, "fade");
life(text("Two sources of randomness make the trees different. Let's see both.", { x: W / 2, y: 470 }, { size: 36, ax: 0.5 }), 5, 8.4, "fade");

v.divider([
  [9.2, 25.6],
  [26.2, 41.6],
  [42.2, 61.6],
  [78.2, 95.6],
]);

// ---------------- Scene 2: bootstrap (9 – 26) ----------------
v.sectionTitle("Randomness #1:", "Bootstrap Samples", 9.2, 25.6);
life(text("Each tree trains on its own sample:", { x: 70, y: 260 }, { size: 30 }), 9.8, 25.6);
life(text(`draw $n = ${N}$ visitors {yellow:with replacement}.`, { x: 70, y: 302 }, { size: 30 }), 10.1, 25.6);
life(text("Some get picked twice or more; some not at all.", { x: 70, y: 380 }, { size: 30 }), 13, 25.6, "fade");
life(text("Chance a visitor is never picked:", { x: 70, y: 480 }, { size: 30 }), 17, 25.6, "fade");
life(tex(`\\left(1 - \\tfrac{1}{${N}}\\right)^{${N}} = ${Math.pow(1 - 1 / N, N).toFixed(3)} \\approx \\tfrac{1}{e}`, { x: 70, y: 540 }, { size: 36 }), 17.6, 25.6, "write", 1);
life(text("So each tree never sees about {yellow:37%} of the visitors.", { x: 70, y: 640 }, { size: 30 }), 19.4, 25.6, "fade");
life(text("Those are its {yellow:out-of-bag} visitors.", { x: 70, y: 682 }, { size: 30 }), 19.8, 25.6, "fade");
{
  // a grid of 40 visitors, three bootstrap draws one after another
  const cols = 8;
  const cx = (i: number) => 900 + (i % cols) * 115;
  const cy = (i: number) => 260 + Math.floor(i / cols) * 120;
  const circles = TRAIN.map((p, i) => s("circle", { cx: cx(i), cy: cy(i), r: 0, fill: p.y ? BUY : NO }));
  const badges = TRAIN.map((_, i) => v.html("", { x: cx(i) + 26, y: cy(i) - 26 }, { size: 24, ax: 0.5, ay: 0.5 }));
  badges.forEach((b) => life(b, 12, 25.6, "fade", 0.2));
  const label = v.html("", { x: 1360, y: 900 }, { size: 32, ax: 0.5 });
  life(label, 12, 25.6, "fade", 0.3);
  // the real bootstrap samples of the first three trees
  const mult = [0, 1, 2].map((k) => FOREST[k].counts);
  frame((t) => {
    const vis = span(t, 9.6, 25.6, 0.4);
    const draw = t < 12 ? -1 : Math.min(2, Math.floor((t - 12) / 4.2));
    circles.forEach((c, i) => {
      const p = prog(t, 10 + i * 0.04, 0.3);
      const m = draw >= 0 ? mult[draw][i] : 1;
      set(c, { r: (p > 0 ? 16 : 0) * vis, opacity: draw >= 0 && m === 0 ? 0.18 : 1 });
      badges[i].el.innerHTML = draw >= 0 && m > 1 ? `<span style="color:${C.yellow};font-weight:600">×${m}</span>` : "";
    });
    if (draw >= 0) {
      const out = mult[draw].filter((m) => m === 0).length;
      label.el.innerHTML = `tree ${draw + 1}'s sample: <span style="color:${C.yellow}">${out} of ${N}</span> visitors left out`;
    }
  });
}

// ---------------- Scene 3: random features (26 – 42) ----------------
v.sectionTitle("Randomness #2:", "Random Features", 26.2, 41.6);
life(text("At every split, a tree may only choose", { x: 70, y: 260 }, { size: 30 }), 26.8, 41.6);
life(text("among a {blue:random subset} of the features", { x: 70, y: 302 }, { size: 30 }), 27, 41.6);
life(text("(here: 1 of the 2, picked at random).", { x: 70, y: 344 }, { size: 30, color: C.dim }), 27.2, 41.6);
life(text("Different samples + different questions", { x: 70, y: 460 }, { size: 30 }), 30, 41.6, "fade");
life(text("= trees that make {red:different mistakes}.", { x: 70, y: 502 }, { size: 30 }), 30.3, 41.6, "fade");
life(text("Each one alone is a poor model.", { x: 70, y: 600 }, { size: 30, color: C.dim }), 33, 41.6, "fade");
{
  const boxes = [0, 1, 2].map((k) => ({ left: 800 + k * 370, right: 800 + k * 370 + 330, top: 330, bottom: 680 }));
  boxes.forEach((bx, k) => {
    const P = plotFrame(v, bx, [0, 12.5], [-0.5, 8.5], { spans: [[27 + k * 1.5, 41.6]] });
    const rg = regions(FOREST[k].tree);
    rg.forEach((q) =>
      s("rect", { x: P.px(q.x0), y: P.py(q.y1), width: P.px(q.x1) - P.px(q.x0), height: P.py(q.y0) - P.py(q.y1), fill: q.pred ? BUY : NO, opacity: 0.35, stroke: "#000", "stroke-width": 1 }, P.inner)
    );
    dotsOn(P, 4.5);
    life(text(`tree ${k + 1}`, { x: (bx.left + bx.right) / 2, y: 720 }, { size: 28, ax: 0.5, color: C.dim }), 27.4 + k * 1.5, 41.6, "fade");
  });
}

// ---------------- Scene 4: voting (42 – 62) ----------------
const NEW: [number, number] = [8, 3];
const votes = FOREST.map((f) => predict(f.tree, NEW));
const share = voteShare(FOREST, NEW);
v.sectionTitle("Random Forests:", "Let Them Vote", 42.2, 61.6);
life(text("A new visitor: 8 minutes, 3 past purchases", { x: 70, y: 250 }, { size: 30 }), 42.8, 61.6, "fade");
const voteList = v.html("", { x: 70, y: 310 }, { size: 26, width: 600 });
life(voteList, 43.4, 61.6, "fade", 0.4);
life(tex(`\\text{share voting buy} = \\tfrac{${votes.reduce((a, b) => a + b, 0)}}{${FOREST.length}} = \\cG{${share.toFixed(2)}}`, { x: 70, y: 640 }, { size: 36 }), 51, 61.6, "write", 1);
life(text("Majority says {green:buy}. The share works as a probability.", { x: 70, y: 740 }, { size: 28 }), 52.4, 61.6, "fade");
life(text("Across the whole map, the votes give a smooth boundary.", { x: 70, y: 830 }, { size: 28, color: C.dim, width: 620 }), 55, 61.6, "fade");
const PV = plotFrame(v, { left: 1100, right: 1830, top: 170, bottom: 860 }, [0, 12.5], [-0.5, 8.5], {
  xticks: [0, 2, 4, 6, 8, 10, 12],
  yticks: [0, 2, 4, 6, 8],
  xlabel: "minutes on page",
  ylabel: "past purchases",
  spans: [[42.4, 61.6]],
});
const heatV = heatLayer(PV);
dotsOn(PV);
const starV = s("circle", { cx: PV.px(NEW[0]), cy: PV.py(NEW[1]), r: 0, fill: C.purple, stroke: "#fff", "stroke-width": 3 }, PV.top);
frame((t) => {
  if (t < 42 || t > 62) return;
  const k = Math.max(1, Math.round(Math.pow(FOREST.length, smooth(prog(t, 44, 6)))));
  heatV(k, span(t, 43, 61.6));
  set(starV, { r: span(t, 43, 61.6) * 13 });
  const shown = Math.min(20, Math.floor((t - 43.6) / 0.25));
  if (shown > 0) {
    const chips = votes
      .slice(0, shown)
      .map((vv, i) => `<span style="display:inline-block;width:150px;margin:3px 0;font-size:23px;color:${vv ? BUY : NO}">tree ${i + 1}: ${vv ? "buy" : "no"}</span>`)
      .join("");
    voteList.el.innerHTML = chips + (shown >= 20 ? `<div style="color:${C.dim};margin-top:6px">… and ${FOREST.length - 20} more trees</div>` : "");
  }
});
const treeCount = v.html("", { x: 1830, y: 104 }, { size: 30, ax: 1 });
life(treeCount, 44, 61.6, "fade", 0.3);
frame((t) => {
  if (t < 44 || t > 62) return;
  const k = Math.max(1, Math.round(Math.pow(FOREST.length, smooth(prog(t, 44, 6)))));
  treeCount.el.innerHTML = `vote share from <span style="color:${C.blue}">${k}</span> tree${k > 1 ? "s" : ""}`;
});

// ---------------- Scene 5: why averaging works (62 – 78) ----------------
v.centerTitle("Why Averaging Works", 62.2, 77.6, 60, 46, 420);
life(text("Average $\\B$ trees, each with variance $\\sg$ and pairwise correlation $\\rh$:", { x: W / 2, y: 200 }, { size: 32, ax: 0.5 }), 63, 77.6, "fade");
life(tex("\\operatorname{Var}\\big(\\text{average}\\big) = \\rh\\,\\sg + \\frac{1 - \\rh}{\\B}\\,\\sg", { x: W / 2, y: 270 }, { size: 56, ax: 0.5 }), 63.8, 77.6, "write", 1.4);
life(text("More trees shrink the second term. Random features lower $\\rh$, shrinking the first.", { x: W / 2, y: 420 }, { size: 30, ax: 0.5, color: C.dim }), 66, 77.6, "fade");
{
  const AP = plotFrame(v, { left: 560, right: 1360, top: 520, bottom: 940 }, [0, 8.6], [0.6, 0.92], {
    xticks: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    xfmt: (x) => String(FOREST_CURVE[Math.round(x)]?.trees ?? ""),
    yticks: [0.6, 0.7, 0.8, 0.9],
    yfmt: (y) => `${Math.round(y * 100)}\\%`,
    xlabel: "number of trees",
    ylabel: "accuracy on 500 new visitors",
    spans: [[66.6, 77.6]],
    grid: true,
  });
  const pathEl = s("path", { fill: "none", stroke: C.blue, "stroke-width": 5 }, AP.inner);
  const deep = DEPTH_CURVE[DEPTH_CURVE.length - 1].test;
  const ref = s("line", { x1: AP.px(0), x2: AP.px(8.6), y1: AP.py(deep), y2: AP.py(deep), stroke: C.red, "stroke-width": 3, "stroke-dasharray": "10 8" }, AP.inner);
  void ref;
  life(text(`one deep tree: ${Math.round(deep * 100)}%`, { x: AP.px(8.5), y: AP.py(deep) + 30 }, { size: 26, ax: 1, color: C.red }), 68, 77.6, "fade");
  life(text(`forest of 200: ${Math.round(FOREST_CURVE[8].test * 100)}%`, { x: AP.px(8.5), y: AP.py(FOREST_CURVE[8].test) - 44 }, { size: 26, ax: 1, color: C.blue }), 72, 77.6, "fade");
  frame((t) => {
    const k = 8 * smooth(prog(t, 67.4, 4));
    set(pathEl, { d: FOREST_CURVE.filter((_, i) => i <= k).map((d, i) => `${i ? "L" : "M"}${AP.px(i)},${AP.py(d.test)}`).join("") });
  });
}

// ---------------- Scene 6: out-of-bag (78 – 96) ----------------
const oob = oobAccuracy(FOREST);
v.sectionTitle("Random Forests:", "A Free Test Set", 78.2, 95.6);
life(text("Every visitor was left out of about 37% of the trees.", { x: 70, y: 260 }, { size: 30, width: 620 }), 78.8, 95.6, "fade");
life(text("Let only {yellow:those} trees vote on that visitor,", { x: 70, y: 350 }, { size: 30 }), 80.4, 95.6, "fade");
life(text("then check the answer against the truth.", { x: 70, y: 392 }, { size: 30 }), 80.6, 95.6, "fade");
life(text(`Out-of-bag accuracy: {yellow:${Math.round(oob * 100)}%}`, { x: 70, y: 500 }, { size: 36 }), 83, 95.6, "fade");
life(text(`Accuracy on 500 truly new visitors: {blue:${Math.round(FOREST_CURVE[8].test * 100)}%}`, { x: 70, y: 560 }, { size: 32 }), 84.4, 95.6, "fade");
life(text("An honest estimate without holding data back.", { x: 70, y: 660 }, { size: 28, color: C.dim }), 86, 95.6, "fade");
life(text("(With only 40 visitors it's a noisy one.)", { x: 70, y: 702 }, { size: 28, color: C.dim }), 86.3, 95.6, "fade");
{
  const cols = 8;
  const cx = (i: number) => 900 + (i % cols) * 115;
  const cy = (i: number) => 260 + Math.floor(i / cols) * 120;
  const marks = TRAIN.map((p, i) => {
    const judges = FOREST.filter((f) => !f.inBag[i]);
    const sh = judges.reduce((a, f) => a + predict(f.tree, p.x), 0) / judges.length;
    const right = (sh >= 0.5 ? 1 : 0) === p.y;
    const c = s("circle", { cx: cx(i), cy: cy(i), r: 0, fill: p.y ? BUY : NO });
    const m = v.html(right ? `<span style="color:${C.green}">✓</span>` : `<span style="color:${C.red}">✗</span>`, { x: cx(i) + 26, y: cy(i) - 24 }, { size: 28, ax: 0.5, ay: 0.5 });
    life(m, 88 + i * 0.08, 95.6, "pop", 0.3);
    return { c, judges: judges.length };
  });
  frame((t) => marks.forEach(({ c }, i) => set(c, { r: span(t, 79 + i * 0.03, 95.6, 0.3) * 16 })));
}

// ---------------- Scene 7: end (96 – 112) ----------------
v.endCard(96.4, 111, [
  { text: "Random forest = bootstrap samples + random features + a vote", size: 40, y: 230 },
  { tex: "\\operatorname{Var} = \\rh\\,\\sg + \\frac{1 - \\rh}{\\B}\\,\\sg", size: 60, y: 330 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
void lerp;
v.ready();
