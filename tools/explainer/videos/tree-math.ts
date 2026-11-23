import { createVideo, plotFrame, prog, smooth, span, lerp, fmt, type Video } from "./engine";
import { TRAIN, TREE2, gini, candidates, regions, path, DEPTH_CURVE, countBuy, type Node } from "../../../lib/explainers/tree";

const DURATION = 130;
const v = createVideo({
  theme: "dark",
  width: 1920,
  height: 1080,
  duration: DURATION,
  macros: {
    "\\Xa": "\\textcolor{#FC6255}{x_1}",
    "\\Xb": "\\textcolor{#58C4DD}{x_2}",
    "\\Y": "\\textcolor{#83C167}{y}",
    "\\G": "\\textcolor{#F4D35E}{G}",
  },
});
const { C, W, tex, text, life, s, set, frame } = v;
const BUY = C.green;
const NO = "#8A8F98";
const N = TRAIN.length;
const B = countBuy(TRAIN);
const g = (n: number, b: number) => 1 - (b / n) ** 2 - ((n - b) / n) ** 2;

// ---------------- Scene 1: title (0 – 9) ----------------
v.centerTitle("Decision Trees", 0.2, 8.4, 70, 64, 520);
life(text("A decision tree predicts by asking a series of {yellow:yes/no questions}.", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 8.4, "fade");
life(text("Each question splits the data into groups that are {green:purer} than before.", { x: W / 2, y: 400 }, { size: 38, ax: 0.5 }), 3.2, 8.4, "fade");
life(text("Let's see exactly how it picks each question.", { x: W / 2, y: 470 }, { size: 38, ax: 0.5 }), 5, 8.4, "fade");

v.divider([
  [9.2, 39.6],
  [62.2, 121.6],
]);

// ---------------- shared scatter ----------------
const P = plotFrame(v, { left: 1100, right: 1830, top: 160, bottom: 860 }, [0, 12.5], [-0.5, 8.5], {
  xticks: [0, 2, 4, 6, 8, 10, 12],
  yticks: [0, 2, 4, 6, 8],
  xlabel: "minutes on page $\\Xa$",
  ylabel: "past purchases $\\Xb$",
  spans: [
    [9.6, 39.6],
    [62.2, 109.6],
  ],
});
const { px, py } = P;
// shaded regions (up to 4 leaves for the depth-2 tree)
const regionRects = [0, 1, 2, 3].map(() => s("rect", { opacity: 0 }, P.inner));
const split1 = s("line", { stroke: C.yellow, "stroke-width": 4, opacity: 0 }, P.g);
const split2a = s("line", { stroke: C.yellow, "stroke-width": 4, opacity: 0 }, P.g);
const split2b = s("line", { stroke: C.yellow, "stroke-width": 4, opacity: 0 }, P.g);
const dots = TRAIN.map((p) => s("circle", { cx: px(p.x[0]), cy: py(p.x[1]), r: 0, fill: p.y ? BUY : NO }, P.top));
const star = s("path", { d: "", fill: C.purple, stroke: "#fff", "stroke-width": 2 }, P.top);

frame((t) => {
  dots.forEach((d, i) => {
    const p = prog(t, 10.4 + i * 0.09, 0.3);
    set(d, { r: p >= 1 ? 8.5 : p > 0 ? 8.5 + Math.sin(p * Math.PI) * 5 : 0 });
  });
});

// ---------------- Scene 2: data (9 – 22) ----------------
v.sectionTitle("Decision Trees:", "The Data", 9.2, 21.6);
life(text("$\\Xa$: minutes on the product page", { x: 70, y: 290 }, { size: 32 }), 9.8, 21.6);
life(text("$\\Xb$: past purchases", { x: 70, y: 345 }, { size: 32 }), 10.2, 21.6);
life(text("$\\Y$: {green:bought} or {dim:didn't}", { x: 70, y: 400 }, { size: 32 }), 10.6, 21.6);
life(text(`$n = ${N}$ visitors, ${B} bought`, { x: 70, y: 455 }, { size: 32 }), 11, 21.6);
life(text("Goal: a few simple questions that sort buyers from non-buyers.", { x: 70, y: 600 }, { size: 30, color: C.dim, width: 600 }), 15, 21.6, "fade");

// ---------------- Scene 3: Gini (22 – 40) ----------------
v.sectionTitle("Measuring Purity:", "Gini Impurity", 22.2, 39.6);
life(tex("\\G = 1 - \\sum_k p_k^{\\,2}", { x: 70, y: 260 }, { size: 46 }), 22.8, 39.6, "write", 1);
life(text("$p_k$: share of the group in class $k$", { x: 70, y: 360 }, { size: 30 }), 23.8, 39.6);
life(text("Two classes: $\\G = 1 - p^2 - (1-p)^2$", { x: 70, y: 410 }, { size: 30 }), 24.6, 39.6);
life(text("$\\G = 0$: everyone in the group agrees", { x: 70, y: 500 }, { size: 30 }), 26, 39.6);
life(text("$\\G = 0.5$: a 50/50 mix, as impure as it gets", { x: 70, y: 550 }, { size: 30 }), 26.8, 39.6);
life(text("All 40 visitors, 19 bought:", { x: 70, y: 680 }, { size: 30 }), 33, 39.6, "fade");
life(tex(`\\G = 1 - \\left(\\tfrac{19}{40}\\right)^2 - \\left(\\tfrac{21}{40}\\right)^2 = \\cY{${gini(TRAIN).toFixed(3)}}`, { x: 70, y: 740 }, { size: 34 }), 33.6, 39.6, "write", 1);
life(text("Almost as mixed as possible. Let's split it.", { x: 70, y: 840 }, { size: 28, color: C.dim }), 35.6, 39.6, "fade");
// little example groups on the right while the scatter is hidden? keep scatter, draw three mini groups beneath title area
{
  const groups = [
    { label: "pure", buy: 8, n: 8, x: 820 },
    { label: "50/50", buy: 4, n: 8, x: 820 },
  ];
  void groups;
}

// ---------------- Scene 4: trying splits (40 – 62) ----------------
// full-width layout: sweep plot on the left, Gini-vs-threshold curve on the right
v.centerTitle("Trying Every Question", 40.2, 61.6, 50, 44, 420);
const P2 = plotFrame(v, { left: 160, right: 860, top: 210, bottom: 860 }, [0, 12.5], [-0.5, 8.5], {
  xticks: [0, 2, 4, 6, 8, 10, 12],
  yticks: [0, 2, 4, 6, 8],
  xlabel: "minutes on page $\\Xa$",
  ylabel: "past purchases $\\Xb$",
  spans: [[40.4, 61.6]],
});
const dots2 = TRAIN.map((p) => s("circle", { cx: P2.px(p.x[0]), cy: P2.py(p.x[1]), r: 8, fill: p.y ? BUY : NO }, P2.top));
void dots2;
const sweep = s("line", { stroke: C.yellow, "stroke-width": 4, opacity: 0 }, P2.g);
const cands0 = candidates(TRAIN, [0]);
const cands1 = candidates(TRAIN, [1]);
const best0 = cands0.reduce((a, b) => (b.score < a.score ? b : a));
const P3 = plotFrame(v, { left: 1100, right: 1800, top: 260, bottom: 700 }, [0, 12.5], [0.35, 0.52], {
  xticks: [0, 2, 4, 6, 8, 10, 12],
  yticks: [0.4, 0.45, 0.5],
  yfmt: (y) => y.toFixed(2),
  xlabel: "threshold $t$ on $\\Xa$",
  ylabel: "weighted $\\G$ after the split",
  spans: [[40.6, 61.6]],
  grid: true,
});
const gcurve = s("path", { fill: "none", stroke: C.yellow, "stroke-width": 4 }, P3.inner);
const gdot = s("circle", { r: 0, fill: C.yellow }, P3.top);
const sweepReadout = v.html("", { x: 1100, y: 830 }, { size: 30 });
life(sweepReadout, 41.6, 56, "fade", 0.4);
life(tex("\\text{weighted } \\G = \\tfrac{n_L}{n}\\,\\G_L + \\tfrac{n_R}{n}\\,\\G_R", { x: 1450, y: 150 }, { size: 34, ax: 0.5 }), 41, 61.6, "write", 1);
const SWEEP0 = 42.4;
const SWEEP1 = 52.4;
const sweepT = (t: number) => lerp(1.2, 11.6, smooth(prog(t, SWEEP0, SWEEP1 - SWEEP0)));
const atT = (th: number) => {
  const L = TRAIN.filter((p) => p.x[0] <= th);
  const R = TRAIN.filter((p) => p.x[0] > th);
  return { L, R, score: (L.length * gini(L) + R.length * gini(R)) / N };
};
frame((t) => {
  if (t < 40 || t > 62) return;
  let th = sweepT(t);
  if (t > 53) th = lerp(11.6, best0.threshold, smooth(prog(t, 53, 1.4)));
  const vis = span(t, 41.8, 61.6);
  set(sweep, { x1: P2.px(th), x2: P2.px(th), y1: P2.py(-0.5), y2: P2.py(8.5), opacity: vis });
  // curve drawn up to current sweep position
  let d = "";
  const upto = t > 53 ? 11.6 : th;
  cands0
    .filter((c) => c.threshold <= upto)
    .forEach((c, i) => (d += `${i ? "L" : "M"}${P3.px(c.threshold).toFixed(1)},${P3.py(c.score).toFixed(1)}`));
  set(gcurve, { d, opacity: vis });
  const cur = atT(th);
  set(gdot, { cx: P3.px(th), cy: P3.py(cur.score), r: vis > 0 ? 9 : 0 });
  if (t < 56)
    sweepReadout.el.innerHTML = `<div>${v.K(`t = ${th.toFixed(1)}`)}&nbsp;&nbsp;&nbsp;${v.K(
      `n_L = ${cur.L.length},\\ n_R = ${cur.R.length}`
    )}&nbsp;&nbsp;&nbsp;${v.K(`\\G = \\cY{${cur.score.toFixed(3)}}`)}</div>`;
});
life(text(`Lowest: $\\Xa \\le ${best0.threshold}$, weighted $\\G = ${best0.score.toFixed(3)}$`, { x: 1100, y: 830 }, { size: 32 }), 56.2, 61.6, "fade");
life(
  text(`(Splitting on past purchases instead does no better than ${Math.min(...cands1.map((c) => c.score)).toFixed(3)}.)`, { x: 1100, y: 890 }, { size: 26, color: C.dim }),
  57.4,
  61.6,
  "fade"
);

// ---------------- Scene 5: the best first question (62 – 80) ----------------
const L = TRAIN.filter((p) => p.x[0] <= best0.threshold);
const R = TRAIN.filter((p) => p.x[0] > best0.threshold);
const bL = countBuy(L);
const bR = countBuy(R);
v.sectionTitle("Decision Trees:", "The Best First Question", 62.2, 79.6);
life(tex(`\\Xa \\le ${best0.threshold}\\,?`, { x: 70, y: 250 }, { size: 46 }), 62.8, 79.6, "write", 0.8);
life(text(`Yes: ${L.length} visitors, ${bL} bought`, { x: 70, y: 360 }, { size: 30 }), 64, 79.6, "fade");
life(tex(`\\G_L = 1 - \\left(\\tfrac{${bL}}{${L.length}}\\right)^2 - \\left(\\tfrac{${L.length - bL}}{${L.length}}\\right)^2 = ${g(L.length, bL).toFixed(3)}`, { x: 70, y: 410 }, { size: 30 }), 64.6, 79.6, "write", 1);
life(text(`No: ${R.length} visitors, ${bR} bought`, { x: 70, y: 510 }, { size: 30 }), 66.4, 79.6, "fade");
life(tex(`\\G_R = 1 - \\left(\\tfrac{${bR}}{${R.length}}\\right)^2 - \\left(\\tfrac{${R.length - bR}}{${R.length}}\\right)^2 = ${g(R.length, bR).toFixed(3)}`, { x: 70, y: 560 }, { size: 30 }), 67, 79.6, "write", 1);
life(
  tex(`\\tfrac{${L.length}}{40}(${g(L.length, bL).toFixed(3)}) + \\tfrac{${R.length}}{40}(${g(R.length, bR).toFixed(3)}) = \\cY{${best0.score.toFixed(3)}}`, { x: 70, y: 680 }, { size: 32 }),
  69.4,
  79.6,
  "write",
  1.2
);
life(text(`Impurity drops from ${gini(TRAIN).toFixed(3)} to ${best0.score.toFixed(3)}.`, { x: 70, y: 780 }, { size: 30, color: C.dim }), 71.4, 79.6, "fade");

// ---------------- Scene 6: repeat inside each group (80 – 96) ----------------
const n1 = TREE2 as Extract<Node, { leaf: false }>;
const nl = n1.left as Extract<Node, { leaf: false }>;
const nr = n1.right as Extract<Node, { leaf: false }>;
v.sectionTitle("Decision Trees:", "Repeat Inside Each Group", 80.2, 109.6);
// tree diagram on the left panel
function treeDiagram(vv: Video, a: number, b: number) {
  const box = (cx: number, cy: number, html: string, at: number, color = C.ink, w = 250, size = 26) => {
    const r = vv.s("rect", { x: cx - w / 2, y: cy - 34, width: w, height: 68, rx: 12, fill: "#111", stroke: color, "stroke-width": 2.5, opacity: 0 });
    const it = vv.html(html, { x: cx, y: cy }, { size, ax: 0.5, ay: 0.5 });
    vv.life(it, at, b, "fade", 0.4);
    vv.frame((t) => vv.set(r, { opacity: span(t, at, b, 0.4) }));
    return r;
  };
  const edge = (x1: number, y1: number, x2: number, y2: number, at: number, label: string) => {
    const l = vv.s("line", { x1, y1, x2, y2, stroke: C.dim, "stroke-width": 2, opacity: 0 });
    vv.frame((t) => vv.set(l, { opacity: span(t, at, b, 0.4) }));
    vv.life(vv.text(label, { x: (x1 + x2) / 2 + (x2 < x1 ? -14 : 14), y: (y1 + y2) / 2 }, { size: 22, ax: x2 < x1 ? 1 : 0, ay: 0.5, color: C.dim }), at, b, "fade", 0.4);
  };
  const leafHtml = (n: Node) => `${n.buy} of ${n.n} bought → <b style="color:${n.pred ? BUY : NO}">${n.pred ? "buy" : "no"}</b>`;
  const Y0 = 300, Y1 = 470, Y2 = 640;
  box(370, Y0, vv.K(`\\Xa \\le ${n1.threshold}\\,?`), a, C.yellow);
  edge(330, Y0 + 34, 200, Y1 - 34, a + 0.8, "yes");
  edge(410, Y0 + 34, 540, Y1 - 34, a + 0.8, "no");
  box(200, Y1, vv.K(`\\Xb \\le ${nl.threshold}\\,?`), a + 1.2, C.yellow, 220);
  box(540, Y1, vv.K(`\\Xb \\le ${nr.threshold}\\,?`), a + 3.2, C.yellow, 220);
  edge(170, Y1 + 34, 140, Y2 - 34, a + 2, "yes");
  edge(230, Y1 + 34, 300, Y2 + 66, a + 2, "no");
  edge(510, Y1 + 34, 440, Y2 - 34, a + 4, "yes");
  edge(570, Y1 + 34, 590, Y2 + 66, a + 4, "no");
  const leafBoxes = [
    box(140, Y2, leafHtml(nl.left), a + 2.4, C.dim, 250, 21),
    box(300, Y2 + 100, leafHtml(nl.right), a + 2.4, C.dim, 250, 21),
    box(440, Y2, leafHtml(nr.left), a + 4.4, C.dim, 250, 21),
    box(590, Y2 + 100, leafHtml(nr.right), a + 4.4, C.dim, 250, 21),
  ];
  return leafBoxes;
}
const leafBoxes = treeDiagram(v, 80.8, 109.6);
life(text("Same recipe in each group: try every question, keep the purest split.", { x: 70, y: 880 }, { size: 26, color: C.dim, width: 600 }), 86.4, 95.6, "fade");

// regions + split lines for scenes 5–7
const RG = regions(TREE2);
frame((t) => {
  // first split line
  const s1 = span(t, 62.4, 109.6);
  const g1 = smooth(prog(t, 62.6, 0.8));
  set(split1, { x1: px(n1.threshold), x2: px(n1.threshold), y1: py(-0.5), y2: lerp(py(-0.5), py(8.5), g1), opacity: s1 });
  const g2a = smooth(prog(t, 82, 0.8));
  const g2b = smooth(prog(t, 84, 0.8));
  set(split2a, { y1: py(nl.threshold), y2: py(nl.threshold), x1: px(0), x2: lerp(px(0), px(n1.threshold), g2a), opacity: span(t, 82, 109.6) });
  set(split2b, { y1: py(nr.threshold), y2: py(nr.threshold), x1: px(n1.threshold), x2: lerp(px(n1.threshold), px(12.5), g2b), opacity: span(t, 84, 109.6) });
  // shading: two regions after the first split, four after the second
  const second = t >= 85;
  const rects = second
    ? RG
    : [
        { x0: 0, x1: n1.threshold, y0: -0.5, y1: 8.5, pred: n1.left.pred },
        { x0: n1.threshold, x1: 12.5, y0: -0.5, y1: 8.5, pred: n1.right.pred },
      ];
  const shade = Math.max(span(t, 64, 109.6) * (second ? 1 : 1), 0);
  regionRects.forEach((r, i) => {
    const q = rects[i];
    if (!q || t < 63.5) return set(r, { opacity: 0 });
    set(r, {
      x: px(q.x0),
      width: px(q.x1) - px(q.x0),
      y: py(q.y1),
      height: py(q.y0) - py(q.y1),
      fill: q.pred ? BUY : NO,
      opacity: 0.16 * shade,
    });
  });
});

// ---------------- Scene 7: predict a new visitor (96 – 110) ----------------
const NEW: [number, number] = [8, 3];
const pth = path(TREE2, NEW);
life(text("A new visitor: 8 minutes, 3 past purchases", { x: 70, y: 880 }, { size: 28 }), 96.2, 109.6, "fade");
pth.steps.forEach((st, i) => {
  life(
    text(`${st.feature === 0 ? "$\\Xa$" : "$\\Xb$"} $\\le ${st.threshold}$? {yellow:${st.yes ? "yes" : "no"}}`, { x: 70, y: 935 + i * 0 }, { size: 26 }),
    97.4 + i * 2,
    98.9 + i * 2,
    "fade",
    0.3
  );
});
life(
  text(`Leaf: ${pth.leaf.buy} of ${pth.leaf.n} similar visitors bought → predict {green:buy} (${Math.round((pth.leaf.buy / pth.leaf.n) * 100)}%)`, { x: 70, y: 935 }, { size: 26 }),
  101.6,
  109.6,
  "fade"
);
frame((t) => {
  const q = span(t, 96.6, 109.6, 0.4);
  const cx = px(NEW[0]);
  const cy = py(NEW[1]);
  const r = 18 * q;
  let d = "";
  for (let k = 0; k < 10; k++) {
    const a = (Math.PI / 5) * k - Math.PI / 2;
    const rr = k % 2 ? r * 0.45 : r;
    d += `${k ? "L" : "M"}${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }
  set(star, { d: q > 0 ? d + "Z" : "" });
  // highlight the leaf box the visitor lands in
  const hit = 3;
  leafBoxes.forEach((b2, i) => set(b2, { stroke: t > 101.6 && t < 109.6 && i === hit ? C.purple : C.dim, "stroke-width": t > 101.6 && i === hit ? 5 : 2.5 }));
});

// ---------------- Scene 8: how deep? (110 – 123) ----------------
v.sectionTitle("Decision Trees:", "How Deep?", 110.2, 122.6);
life(text("Keep asking questions and the tree can fit", { x: 70, y: 260 }, { size: 30 }), 110.8, 122.6, "fade");
life(text("every training visitor, noise and all.", { x: 70, y: 302 }, { size: 30 }), 111, 122.6, "fade");
DEPTH_CURVE.forEach((d, i) => {
  const y = 400 + i * 52;
  life(
    text(`depth ${d.depth}: training {green:${Math.round(d.train * 100)}%}, new visitors {yellow:${Math.round(d.test * 100)}%}`, { x: 70, y }, { size: 28 }),
    112 + i * 0.35,
    122.6,
    "fade",
    0.3
  );
});
{
  const AP = plotFrame(v, { left: 1100, right: 1800, top: 220, bottom: 820 }, [0.5, 8.5], [0.6, 1.02], {
    xticks: [1, 2, 3, 4, 5, 6, 7, 8],
    yticks: [0.6, 0.7, 0.8, 0.9, 1],
    yfmt: (y) => `${Math.round(y * 100)}\\%`,
    xlabel: "tree depth",
    ylabel: "accuracy",
    spans: [[110.4, 122.6]],
    grid: true,
  });
  const tr = s("path", { fill: "none", stroke: C.green, "stroke-width": 5 }, AP.inner);
  const te = s("path", { fill: "none", stroke: C.yellow, "stroke-width": 5 }, AP.inner);
  life(text("training", { x: AP.px(6.8), y: AP.py(1) - 44 }, { size: 26, color: C.green, ax: 0.5 }), 114, 122.6, "fade");
  life(text("new visitors", { x: AP.px(8.4), y: AP.py(DEPTH_CURVE[7].test) + 30 }, { size: 26, color: C.yellow, ax: 1 }), 114.4, 122.6, "fade");
  frame((t) => {
    const k = 1 + 7 * smooth(prog(t, 111.6, 3));
    const pts = (key: "train" | "test") =>
      DEPTH_CURVE.filter((d) => d.depth <= k).map((d, i) => `${i ? "L" : "M"}${AP.px(d.depth)},${AP.py(d[key])}`).join("");
    set(tr, { d: pts("train") });
    set(te, { d: pts("test") });
  });
  life(text("Best on new data at depth 2. Deeper trees memorize noise.", { x: 1100, y: 940 }, { size: 28, color: C.dim }), 116.4, 122.6, "fade");
}

// ---------------- Scene 9: end (123 – 130) ----------------
v.endCard(123.2, 129, [
  { tex: "\\G = 1 - \\sum_k p_k^{\\,2}", size: 70, y: 230 },
  { text: "Try every question. Keep the one that makes the groups purest. Repeat.", size: 36, y: 420 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);

void fmt;
v.ready();
