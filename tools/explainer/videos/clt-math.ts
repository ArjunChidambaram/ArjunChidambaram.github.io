import { createVideo, plotFrame, prog, smooth, span } from "./engine";
import { ORDERS, ORDER_MEAN, ORDER_SD, MEANS, CLT_NS, INTERVALS, binned, normPDF, skewness, sd } from "../../../lib/explainers/stats";

const DURATION = 120;
const v = createVideo({
  theme: "dark",
  width: 1920,
  height: 1080,
  duration: DURATION,
  macros: {
    "\\MU": "\\textcolor{#F4D35E}{\\mu}",
    "\\sig": "\\textcolor{#E07A9F}{\\sigma}",
    "\\nn": "\\textcolor{#58C4DD}{n}",
    "\\Xn": "\\textcolor{#83C167}{\\bar{X}_n}",
  },
});
const { C, W, tex, text, life, s, set, frame } = v;
const D = (x: number, d = 2) => `\\$${x.toFixed(d)}`;
const money = (x: number) => `&#36;${x}`;
const box = { left: 1100, right: 1830, top: 200, bottom: 860 };

// ---------------- 1: title (0 – 9) ----------------
v.centerTitle("The Central Limit Theorem", 0.2, 8.4, 70, 64, 760);
life(text("Data can be any shape. {green:Averages} of it are almost always {blue:bell-shaped}.", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 8.4, "fade");
life(text("That one fact powers confidence intervals and A/B tests.", { x: W / 2, y: 400 }, { size: 38, ax: 0.5 }), 3.2, 8.4, "fade");

v.divider([
  [9.2, 61.6],
  [78.2, 99.6],
]);

// ---------------- 2: population (9 – 24) ----------------
v.sectionTitle("Central Limit Theorem:", "Lopsided Data", 9.2, 23.6);
life(text("20,000 past order values from the checkout page:", { x: 70, y: 250 }, { size: 28, width: 600 }), 9.8, 23.6, "fade");
life(tex(`\\text{mean } \\MU = ${D(ORDER_MEAN)}`, { x: 90, y: 320 }, { size: 32 }), 10.6, 23.6, "write", 0.8);
life(tex(`\\text{SD } \\sig = ${D(ORDER_SD)}`, { x: 90, y: 380 }, { size: 32 }), 11.2, 23.6, "write", 0.8);
life(tex("\\text{median} = \\$39.94", { x: 90, y: 440 }, { size: 32 }), 11.8, 23.6, "write", 0.8);
life(tex(`\\text{skewness} = ${skewness(ORDERS).toFixed(1)}`, { x: 90, y: 500 }, { size: 32 }), 12.4, 23.6, "write", 0.8);
life(text("Most orders are small; a few are huge (the largest: $1,534).", { x: 70, y: 610 }, { size: 26, color: C.dim, width: 600 }), 14, 23.6, "fade");
life(text("Nothing about this looks normal. Watch what averages do.", { x: 70, y: 700 }, { size: 28, width: 600 }), 17, 23.6, "fade");
{
  const A = plotFrame(v, box, [0, 250], [0, 1], {
    xticks: [0, 50, 100, 150, 200, 250],
    yticks: [],
    xfmt: money,
    xlabel: "one order's value",
    spans: [[9.6, 23.6]],
    plainTicks: true,
  });
  const h = binned(ORDERS, 0, 250, 5);
  const top = Math.max(...h) * 1.1;
  const bars = h.map((c, i) => s("rect", { x: A.px(i * 5) + 1, width: A.px(5) - A.px(0) - 2, y: A.py(0), height: 0, fill: "#888" }, A.inner));
  const ml = s("line", { x1: A.px(ORDER_MEAN), x2: A.px(ORDER_MEAN), y1: A.py(0), y2: A.py(1), stroke: C.yellow, "stroke-width": 3, "stroke-dasharray": "10 8", opacity: 0 }, A.top);
  frame((t) => {
    const g = smooth(prog(t, 10, 1.2));
    bars.forEach((b, i) => set(b, { y: A.py((h[i] / top) * g), height: A.py(0) - A.py((h[i] / top) * g) }));
    set(ml, { opacity: span(t, 10.8, 23.6) });
  });
  life(text("$\\MU$", { x: A.px(ORDER_MEAN) + 10, y: A.py(1) - 6 }, { size: 30 }), 10.8, 23.6, "fade");
}

// ---------------- shared sample-means plot (24 – 62) ----------------
const Bp = plotFrame(v, box, [0, 150], [0, 1], {
  xticks: [0, 25, 50, 75, 100, 125, 150],
  yticks: [],
  xfmt: money,
  xlabel: "average of $\\nn$ orders, $\\Xn$",
  spans: [[24.4, 61.6]],
  plainTicks: true,
});
const BW = 2;
const mbars = Array.from({ length: 150 / BW }, (_, i) => s("rect", { x: Bp.px(i * BW) + 0.5, width: Bp.px(BW) - Bp.px(0) - 1, y: Bp.py(0), height: 0, fill: C.blue }, Bp.inner));
const ncurve = s("path", { fill: "none", stroke: C.orange, "stroke-width": 4, opacity: 0 }, Bp.top);
const nLbl = v.html("", { x: 1500, y: 240 }, { size: 34 });
life(nLbl, 42.4, 61.6, "fade", 0.3);
const nAt = (t: number) => {
  if (t < 42) return 30;
  const k = Math.min(CLT_NS.length - 1, Math.floor(prog(t, 42.6, 15) * CLT_NS.length));
  return CLT_NS[k];
};
frame((t) => {
  if (t < 24 || t > 62) return;
  const n = nAt(t);
  const m = MEANS[n];
  const g = smooth(prog(t, 25, 1.2));
  const h = binned(m, 0, 150, BW);
  const top = Math.max(...h) * 1.1;
  mbars.forEach((b, i) => set(b, { y: Bp.py((h[i] / top) * g), height: Bp.py(0) - Bp.py((h[i] / top) * g) }));
  const cv = span(t, 29, 61.6);
  const sdn = ORDER_SD / Math.sqrt(n);
  const scale = top / (m.length * BW);
  let d = "";
  for (let x = 0; x <= 150; x += 0.5) d += `${x ? "L" : "M"}${Bp.px(x).toFixed(1)},${Bp.py(Math.min(1.08, normPDF(x, ORDER_MEAN, sdn) / scale)).toFixed(1)}`;
  set(ncurve, { d, opacity: cv });
  nLbl.el.innerHTML = `<span style="color:${C.dim}">n =</span> <b style="color:${C.blue}">${n}</b>`;
});

// ---------------- 3: statement (24 – 42) ----------------
v.sectionTitle("Central Limit Theorem:", "The Statement", 24.2, 41.6);
life(text("Average $\\nn$ independent draws with mean $\\MU$ and SD $\\sig$:", { x: 70, y: 250 }, { size: 26, width: 620 }), 24.8, 41.6, "fade");
life(tex("\\Xn \\;\\approx\\; \\mathcal{N}\\!\\left(\\MU,\\ \\frac{\\sig^2}{\\nn}\\right)", { x: 70, y: 330 }, { size: 42 }), 25.6, 41.6, "write", 1.2);
life(text("More precisely, the standardized average approaches a standard normal:", { x: 70, y: 460 }, { size: 26, width: 600, color: C.dim }), 28, 41.6, "fade");
life(tex("Z = \\frac{\\Xn - \\MU}{\\sig / \\sqrt{\\nn}} \\;\\longrightarrow\\; \\mathcal{N}(0, 1)", { x: 70, y: 540 }, { size: 38 }), 29, 41.6, "write", 1.2);
life(text(`Here, $\\nn = 30$: the {orange:orange curve} is the normal with mean ${"$"}${ORDER_MEAN.toFixed(2)} and SD ${"$"}${(ORDER_SD / Math.sqrt(30)).toFixed(2)}.`.replace(/\$(\d)/g, "&#36;$1"), { x: 70, y: 690 }, { size: 26, width: 600 }), 32, 41.6, "fade");
life(text("2,000 simulated averages (blue) follow it closely.", { x: 70, y: 780 }, { size: 26, width: 600 }), 34, 41.6, "fade");

// ---------------- 4: watch it happen (42 – 62) ----------------
v.sectionTitle("Central Limit Theorem:", "Watch It Happen", 42.2, 61.6);
life(text("2,000 averages for each sample size:", { x: 70, y: 250 }, { size: 26 }), 42.8, 61.6, "fade");
life(text("$\\nn$", { x: 90, y: 310 }, { size: 26, color: C.dim }), 43.2, 61.6, "fade");
life(text("SD of averages", { x: 190, y: 310 }, { size: 26, color: C.dim }), 43.2, 61.6, "fade");
life(text("$\\sig / \\sqrt{\\nn}$", { x: 400, y: 310 }, { size: 26, color: C.dim }), 43.2, 61.6, "fade");
life(text("skewness", { x: 540, y: 310 }, { size: 26, color: C.dim }), 43.2, 61.6, "fade");
CLT_NS.forEach((n, k) => {
  const y = 370 + k * 56;
  const at = 42.6 + (15 / CLT_NS.length) * k;
  life(text(String(n), { x: 90, y }, { size: 28 }), at, 61.6, "fade", 0.3);
  life(text(`&#36;${sd(MEANS[n]).toFixed(2)}`, { x: 190, y }, { size: 28 }), at, 61.6, "fade", 0.3);
  life(text(`&#36;${(ORDER_SD / Math.sqrt(n)).toFixed(2)}`, { x: 400, y }, { size: 28, color: C.orange }), at, 61.6, "fade", 0.3);
  life(text(skewness(MEANS[n]).toFixed(2), { x: 540, y }, { size: 28 }), at, 61.6, "fade", 0.3);
});
life(text("The spread follows $\\sig/\\sqrt{\\nn}$ exactly. The skew fades like $1/\\sqrt{\\nn}$.", { x: 70, y: 690 }, { size: 26, width: 600 }), 52, 61.6, "fade");
life(text("Very lopsided data needs bigger $\\nn$ before the bell is accurate.", { x: 70, y: 780 }, { size: 26, color: C.dim, width: 600 }), 56, 61.6, "fade");

// ---------------- 5: standard error (62 – 78) ----------------
v.centerTitle("The Standard Error", 62.2, 77.6, 60, 46, 420);
life(text("The SD of an average has its own name: the {blue:standard error}.", { x: W / 2, y: 220 }, { size: 34, ax: 0.5 }), 62.8, 77.6, "fade");
life(tex("\\text{SE}(\\Xn) = \\frac{\\sig}{\\sqrt{\\nn}} \\quad \\approx \\quad \\frac{s}{\\sqrt{\\nn}} \\qquad (s = \\text{the sample's own SD})", { x: W / 2, y: 290 }, { size: 42, ax: 0.5 }), 63.6, 77.6, "write", 1.4);
life(text("Average order value from 100 orders:", { x: W / 2, y: 430 }, { size: 32, ax: 0.5, color: C.dim }), 66, 77.6, "fade");
life(tex(`\\text{SE} = \\frac{${ORDER_SD.toFixed(2)}}{\\sqrt{100}} = \\$${(ORDER_SD / 10).toFixed(2)}`, { x: W / 2, y: 490 }, { size: 42, ax: 0.5 }), 66.6, 77.6, "write", 1);
life(text("Conversion rate from 1,000 visitors (a 0/1 average, $\\sig = \\sqrt{p(1-p)}$):", { x: W / 2, y: 630 }, { size: 32, ax: 0.5, color: C.dim }), 69, 77.6, "fade");
life(tex("\\text{SE} = \\sqrt{\\frac{0.1 \\times 0.9}{1000}} = 0.0095 \\;\\;(\\text{about 1 point})", { x: W / 2, y: 690 }, { size: 42, ax: 0.5 }), 69.6, 77.6, "write", 1.2);
life(text("The CLT says the error of an average is about normal, with this SD.", { x: W / 2, y: 840 }, { size: 32, ax: 0.5 }), 72.4, 77.6, "fade");

// ---------------- 6: confidence intervals (78 – 100) ----------------
const cover = INTERVALS.filter((i) => i.lo <= ORDER_MEAN && i.hi >= ORDER_MEAN).length;
v.sectionTitle("Central Limit Theorem:", "Confidence Intervals", 78.2, 99.6);
life(text("95% of a standard normal lies within ±1.96:", { x: 70, y: 250 }, { size: 26 }), 78.8, 99.6, "fade");
life(tex("P(-1.96 \\le Z \\le 1.96) = 0.95", { x: 70, y: 310 }, { size: 34 }), 79.4, 99.6, "write", 1);
life(text("Unwrap $Z$ and you get an interval that catches $\\MU$ 95% of the time:", { x: 70, y: 400 }, { size: 26, width: 600 }), 81.4, 99.6, "fade");
life(tex("\\Xn \\pm 1.96 \\times \\frac{s}{\\sqrt{\\nn}}", { x: 70, y: 490 }, { size: 40 }), 82.4, 99.6, "write", 1);
const I0 = INTERVALS[0];
life(text(`Sample 1 (100 orders): &#36;${I0.m.toFixed(2)}, interval &#36;${I0.lo.toFixed(2)} to &#36;${I0.hi.toFixed(2)}`, { x: 70, y: 600 }, { size: 26, width: 620 }), 85, 99.6, "fade");
life(text(`100 samples, 100 intervals: {green:${cover} contain the true mean}, {red:${100 - cover} miss}.`, { x: 70, y: 690 }, { size: 26, width: 600 }), 90, 99.6, "fade");
life(text("\"95%\" describes the method, not any one interval.", { x: 70, y: 790 }, { size: 26, color: C.dim, width: 600 }), 93, 99.6, "fade");
{
  const Cp = plotFrame(v, box, [-1, 100], [30, 85], {
    xticks: [],
    yticks: [30, 40, 50, 60, 70, 80],
    yfmt: money,
    xlabel: "100 samples of 100 orders",
    spans: [[78.4, 99.6]],
    plainTicks: true,
  });
  const ml = s("line", { x1: Cp.px(-1), x2: Cp.px(100), y1: Cp.py(ORDER_MEAN), y2: Cp.py(ORDER_MEAN), stroke: C.yellow, "stroke-width": 3, "stroke-dasharray": "10 8" }, Cp.top);
  const segs = INTERVALS.map((iv) => {
    const hit = iv.lo <= ORDER_MEAN && iv.hi >= ORDER_MEAN;
    return [
      s("line", { stroke: hit ? C.green : C.red, "stroke-width": hit ? 3 : 4 }, Cp.inner),
      s("circle", { r: 0, fill: hit ? C.green : C.red }, Cp.inner),
    ] as const;
  });
  frame((t) => {
    set(ml, { opacity: span(t, 79, 99.6) });
    INTERVALS.forEach((iv, i) => {
      const on = prog(t, 83.6 + i * 0.05, 0.3);
      const [ln, dot] = segs[i];
      set(ln, { x1: Cp.px(i), x2: Cp.px(i), y1: Cp.py(iv.m + (iv.lo - iv.m) * on), y2: Cp.py(iv.m + (iv.hi - iv.m) * on), opacity: on > 0 ? 1 : 0 });
      set(dot, { cx: Cp.px(i), cy: Cp.py(iv.m), r: on > 0 ? 3.5 : 0 });
    });
  });
}

// ---------------- 7: caveats (100 – 111) ----------------
v.centerTitle("When the Bell Needs Care", 100.2, 110.6, 60, 46, 520);
life(text("{yellow:Independence}: repeat customers or clustered traffic break it.", { x: W / 2, y: 250 }, { size: 34, ax: 0.5 }), 101, 110.6, "fade");
life(text("{yellow:Finite variance}: with extreme outliers the average converges slowly, or not at all.", { x: W / 2, y: 360 }, { size: 34, ax: 0.5 }), 102.2, 110.6, "fade");
life(text("{yellow:Enough data}: \"n ≥ 30\" is folklore. Skewed data needs more.", { x: W / 2, y: 470 }, { size: 34, ax: 0.5 }), 103.4, 110.6, "fade");
life(text("For conversion rates, aim for at least 10 buyers and 10 non-buyers.", { x: W / 2, y: 530 }, { size: 30, ax: 0.5, color: C.dim }), 103.8, 110.6, "fade");
life(text("When in doubt, check with a simulation or the {green:bootstrap} (coming up in this series).", { x: W / 2, y: 660 }, { size: 34, ax: 0.5 }), 105.4, 110.6, "fade");

// ---------------- 8: end (111 – 120) ----------------
v.endCard(111.2, 119, [
  { tex: "\\Xn \\approx \\mathcal{N}\\!\\left(\\MU,\\ \\frac{\\sig^2}{\\nn}\\right) \\qquad \\Xn \\pm 1.96\\,\\frac{s}{\\sqrt{\\nn}}", size: 54, y: 230 },
  { text: "Whatever the data looks like, its averages are bell-shaped.", size: 36, y: 400 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
