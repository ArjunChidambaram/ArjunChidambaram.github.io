import { createVideo, plotFrame, prog, smooth, span, easeOut } from "./engine";
import { ORDERS, ORDER_MEAN, ORDER_SD, MEANS, binned, normPDF, rng } from "../../../lib/explainers/stats";

const DURATION = 47;
const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: DURATION });
const { C, W, text, life, s, set, frame } = v;
const TEAL = "#007A7A";
const BLUE = "#2B8CBE";
const ORANGE = "#E8772E";
const PURPLE = "#9B59D0";

life(text("Data science, one concept at a time", { x: W / 2, y: 400 }, { size: 30, ax: 0.5, color: TEAL, weight: 500 }), 0.2, 4.4, "fade", 0.8);
life(text("The Central Limit Theorem", { x: W / 2, y: 460 }, { size: 76, ax: 0.5, weight: 600 }), 0.3, 4.4, "fade", 0.9);
life(text("Why averages are bell-shaped", { x: W / 2, y: 590 }, { size: 36, ax: 0.5, color: C.dim }), 0.6, 4.4, "fade", 0.9);
life(text("The Central Limit Theorem", { x: 100, y: 70 }, { size: 52, weight: 600 }), 4.4, 41, "fade", 0.6);
const bar = s("rect", { x: 100, y: 146, width: 0, height: 6, fill: TEAL });
frame((t) => set(bar, { width: 90 * easeOut(prog(t, 4.6, 0.6)), opacity: 1 - prog(t, 41, 0.5) }));

const XR: [number, number] = [0, 200];
const money = (x: number) => `&#36;${x}`;
const A = plotFrame(v, { left: 130, right: 990, top: 290, bottom: 500 }, XR, [0, 1], {
  xticks: [0, 50, 100, 150, 200],
  yticks: [],
  xfmt: money,
  xlabel: "One order's value",
  spans: [[4.8, 41]],
  plainTicks: true,
});
const B = plotFrame(v, { left: 130, right: 990, top: 640, bottom: 850 }, XR, [0, 1], {
  xticks: [0, 50, 100, 150, 200],
  yticks: [],
  xfmt: money,
  xlabel: "Average of the sample",
  spans: [[11.8, 41]],
  plainTicks: true,
});
// population histogram, $5 bins
const PW = 5;
const popH = binned(ORDERS, 0, 200, PW);
const popTop = Math.max(...popH) * 1.1;
const popBars = popH.map((c, i) => s("rect", { x: A.px(i * PW) + 1, width: A.px(PW) - A.px(0) - 2, y: A.py(0), height: 0, fill: "#94A3B8" }, A.inner));
const meanLine = s("line", { x1: A.px(ORDER_MEAN), x2: A.px(ORDER_MEAN), y1: A.py(0), y2: A.py(1), stroke: ORANGE, "stroke-width": 3, "stroke-dasharray": "8 6", opacity: 0 }, A.top);
// sampled orders (n = 5 demo)
const r = rng(1);
const DEMO = Array.from({ length: 6 }, () => Array.from({ length: 5 }, () => ORDERS[Math.floor(r() * ORDERS.length)]));
const chips = Array.from({ length: 5 }, () => s("circle", { r: 0, fill: PURPLE, stroke: "#fff", "stroke-width": 2 }, A.top));
const drop = s("circle", { r: 0, fill: PURPLE, stroke: "#fff", "stroke-width": 2 }, B.top);
const MEANS5 = [...DEMO.map((d) => d.reduce((a, b) => a + b, 0) / 5), ...MEANS[5]];
// sample-means histogram, $2.5 bins
const MW = 2.5;
const mBars = Array.from({ length: 200 / MW }, (_, i) => s("rect", { x: B.px(i * MW) + 0.5, width: B.px(MW) - B.px(0) - 1, y: B.py(0), height: 0, fill: BLUE }, B.inner));
const curve = s("path", { fill: "none", stroke: ORANGE, "stroke-width": 4, opacity: 0 }, B.top);
const head = v.html("", { x: 100, y: 196 }, { size: 28 });
life(head, 5, 41, "fade", 0.3);

const phase = (t: number): { n: number; count: number } => {
  if (t < 12) return { n: 5, count: 0 };
  if (t < 21.8) {
    if (t < 17.6) return { n: 5, count: Math.min(6, Math.floor((t - 12) / 0.95)) };
    return { n: 5, count: Math.round(6 + 1994 * smooth(prog(t, 17.6, 3.8))) };
  }
  if (t < 36) return { n: 30, count: Math.round(2000 * smooth(prog(t, 22, 5))) };
  return { n: 100, count: Math.round(2000 * smooth(prog(t, 36.2, 2.4))) };
};

frame((t) => {
  const fade = 1 - prog(t, 41, 0.5);
  const g = smooth(prog(t, 5.4, 1.2));
  popBars.forEach((b, i) => {
    const h = (popH[i] / popTop) * g;
    set(b, { y: A.py(h), height: A.py(0) - A.py(h), opacity: fade });
  });
  set(meanLine, { opacity: span(t, 8, 41) * fade });
  const { n, count } = phase(t);
  const src = n === 5 ? MEANS5 : MEANS[n];
  const h = binned(src.slice(0, count), 0, 200, MW);
  const top = n === 5 && count <= 6 ? 4 : Math.max(...h, 1) * 1.1;
  mBars.forEach((b, i) => {
    const y = B.py(h[i] / top);
    set(b, { y, height: B.py(0) - y, opacity: fade });
  });
  // demo samples: chips light up the five orders, then their average drops
  const k = Math.floor((t - 12) / 0.95);
  const live = t >= 12 && t < 17.6 && k < 6;
  const f = (t - 12) / 0.95 - k;
  chips.forEach((c, j) => {
    const val = live ? DEMO[k][j] : 0;
    set(c, { cx: A.px(Math.min(198, val)), cy: A.py(0.12 + j * 0.08), r: live && f < 0.75 ? 10 : 0 });
  });
  const avg = live ? DEMO[k].reduce((a, b) => a + b, 0) / 5 : 0;
  set(drop, { cx: B.px(avg), cy: B.py(0.5 - 0.5 * smooth(prog(f, 0.4, 0.4))), r: live && f > 0.35 ? 11 : 0 });
  // normal curve
  const cv = t >= 30 ? span(t, 30.2, 41, 0.6) : 0;
  if (cv > 0) {
    const sd = ORDER_SD / Math.sqrt(n);
    const binsTop = top / (count * MW);
    let d = "";
    for (let i = 0; i <= 200; i++) {
      const x = i;
      d += `${i ? "L" : "M"}${B.px(x).toFixed(1)},${B.py(Math.min(1.05, normPDF(x, ORDER_MEAN, sd) / binsTop)).toFixed(1)}`;
    }
    set(curve, { d, opacity: cv * fade });
  } else set(curve, { opacity: 0 });

  if (t < 11.8) head.el.innerHTML = `<span style="color:${C.dim}">20,000 past orders: median</span> <b>$40</b><span style="color:${C.dim}">, average</span> <b style="color:${ORANGE}">$${ORDER_MEAN.toFixed(0)}</b><span style="color:${C.dim}">, a long tail of big ones</span>`;
  else if (t < 21.8)
    head.el.innerHTML = live
      ? `<span style="color:${C.dim}">Pick 5 orders at random:</span> <b style="color:${PURPLE}">average $${avg.toFixed(0)}</b>`
      : `<span style="color:${C.dim}">Averages of 5 orders:</span> <b>${count.toLocaleString("en-US")}</b> <span style="color:${C.dim}">samples</span>`;
  else head.el.innerHTML = `<span style="color:${C.dim}">Averages of</span> <b style="color:${BLUE};font-size:36px">${n}</b> <span style="color:${C.dim}">orders: spread</span> <b>±$${(ORDER_SD / Math.sqrt(n)).toFixed(1)}</b> <span style="color:${C.dim}">(1 SD)</span>`;
});

const CAP: [number, number, string][] = [
  [5, 11.8, "Order values are lopsided, nothing like a bell."],
  [12, 21.8, "Average a few at a time. The averages are less lopsided."],
  [22, 30, "Average 30 at a time: a bell curve appears."],
  [30.2, 36, "It matches the normal curve predicted by the theorem."],
  [36.2, 41, "Bigger samples: same bell, narrower by √n."],
];
for (const [a, b, str] of CAP) life(text(str, { x: W / 2, y: 975 }, { size: 32, ax: 0.5, weight: 500 }), a, b, "fade", 0.35);

life(text("The theorem in one line", { x: W / 2, y: 300 }, { size: 34, ax: 0.5, color: C.dim }), 41.4, 48, "fade");
life(text("Averages are bell-shaped,", { x: W / 2, y: 380 }, { size: 56, ax: 0.5, weight: 600 }), 41.6, 48, "fade");
life(text("whatever the data looks like.", { x: W / 2, y: 460 }, { size: 56, ax: 0.5, weight: 600 }), 41.7, 48, "fade");
life(text("Arjun Chidambaram Subbiah", { x: W / 2, y: 760 }, { size: 38, ax: 0.5, weight: 600 }), 42.4, 48, "fade");
life(text("Data science, one concept at a time", { x: W / 2, y: 815 }, { size: 28, ax: 0.5, color: TEAL }), 42.7, 48, "fade");
life(text("arjunchidambaram.github.io", { x: W / 2, y: 930 }, { size: 26, ax: 0.5, color: C.dim }), 43, 48, "fade");

v.ready();
