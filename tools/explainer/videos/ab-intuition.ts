import { createVideo, plotFrame, prog, smooth, span, easeOut } from "./engine";
import { AB, AB_RESULT as R, AA_ZS, AA_EXAMPLE, AA_PEEK_FP, AB_DAYS, normCDF, binned } from "../../../lib/explainers/stats";

const DURATION = 47;
const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: DURATION });
const { C, W, text, life, s, set, frame } = v;
const TEAL = "#007A7A";
const A_COL = "#94A3B8";
const B_COL = "#05CE91";
const BLUE = "#2B8CBE";
const ORANGE = "#E8772E";
const RED = "#E2483D";

life(text("Data science, one concept at a time", { x: W / 2, y: 400 }, { size: 30, ax: 0.5, color: TEAL, weight: 500 }), 0.2, 4.4, "fade", 0.8);
life(text("A/B Testing", { x: W / 2, y: 460 }, { size: 96, ax: 0.5, weight: 600 }), 0.3, 4.4, "fade", 0.9);
life(text("Is the difference real, or just noise?", { x: W / 2, y: 600 }, { size: 36, ax: 0.5, color: C.dim }), 0.6, 4.4, "fade", 0.9);
life(text("A/B Testing", { x: 100, y: 70 }, { size: 56, weight: 600 }), 4.4, 41, "fade", 0.6);
const bar = s("rect", { x: 100, y: 146, width: 0, height: 6, fill: TEAL });
frame((t) => set(bar, { width: 90 * easeOut(prog(t, 4.6, 0.6)), opacity: 1 - prog(t, 41, 0.5) }));
const head = v.html("", { x: 100, y: 196 }, { size: 28 });
life(head, 5, 41, "fade", 0.3);
const pts = (x: number, d = 2) => `${(x * 100).toFixed(d)}`;

// ---- scene 1: two bars (5 – 13) ----
{
  const P = plotFrame(v, { left: 250, right: 830, top: 320, bottom: 820 }, [-0.6, 1.6], [0, 0.12], {
    xticks: [0, 1],
    yticks: [0, 0.04, 0.08, 0.12],
    xfmt: (x) => (x ? "B: new checkout" : "A: current"),
    yfmt: (y) => `${Math.round(y * 100)}%`,
    spans: [[4.8, 12.8]],
    plainTicks: true,
  });
  const bs = [R.pA, R.pB].map((p, k) => s("rect", { x: P.px(k - 0.3), width: P.px(0.6) - P.px(0), y: P.py(0), height: 0, fill: k ? B_COL : A_COL, rx: 6 }, P.inner));
  [R.pA, R.pB].forEach((p, k) => life(text(`${pts(p)}%`, { x: P.px(k), y: P.py(p) - 56 }, { size: 40, ax: 0.5, weight: 600 }), 6.6 + k * 0.3, 12.8, "fade"));
  frame((t) => {
    const g = smooth(prog(t, 5.6, 1));
    [R.pA, R.pB].forEach((p, k) => set(bs[k], { y: P.py(p * g), height: P.py(0) - P.py(p * g) }));
  });
}

// ---- scene 2–4: the A/A world (13 – 31) ----
const se0 = R.se0;
const AA = AA_ZS.map((z) => z[AB_DAYS - 1] * se0);
const XR: [number, number] = [-0.02, 0.02];
const N2 = plotFrame(v, { left: 150, right: 990, top: 330, bottom: 800 }, XR, [0, 1], {
  xticks: [-0.02, -0.01, 0, 0.01, 0.02],
  yticks: [],
  xfmt: (x) => `${x > 0 ? "+" : ""}${(x * 100).toFixed(1)}`,
  xlabel: "Gap B − A (percentage points)",
  spans: [[13, 36]],
  plainTicks: true,
});
const BW = 0.0005;
const nb = Math.round((XR[1] - XR[0]) / BW);
const aaBars = Array.from({ length: nb }, (_, i) => s("rect", { x: N2.px(XR[0] + i * BW) + 1, width: N2.px(BW) - N2.px(0) - 2, y: N2.py(0), height: 0, fill: A_COL }, N2.inner));
const obs = s("line", { x1: N2.px(R.diff), x2: N2.px(R.diff), y1: N2.py(0), y2: N2.py(1), stroke: B_COL, "stroke-width": 5, opacity: 0 }, N2.top);
const obsL = text(`ours: +${pts(R.diff)}`, { x: N2.px(R.diff) + 12, y: N2.py(0.98) }, { size: 28, color: "#047857", weight: 600 });
life(obsL, 17.6, 30.8, "fade");
// ---- scene 4: confidence interval (31 – 36) ----
const ci = s("line", { x1: N2.px(R.lo), x2: N2.px(R.hi), y1: N2.py(0.45), y2: N2.py(0.45), stroke: BLUE, "stroke-width": 10, "stroke-linecap": "round", opacity: 0 }, N2.top);
const ciDot = s("circle", { cx: N2.px(R.diff), cy: N2.py(0.45), r: 0, fill: "#fff", stroke: BLUE, "stroke-width": 5 }, N2.top);
const zero = s("line", { x1: N2.px(0), x2: N2.px(0), y1: N2.py(0), y2: N2.py(1), stroke: C.ink, "stroke-width": 2, "stroke-dasharray": "6 6", opacity: 0 }, N2.top);
const cnt = (t: number) => Math.round(AA.length * smooth(prog(t, 13.8, 3.6)));
frame((t) => {
  const n = cnt(t);
  const h = binned(AA.slice(0, Math.max(1, n)), XR[0], XR[1], BW);
  const top = Math.max(8, ...h) * 1.12;
  const shade = span(t, 24.2, 30.8, 0.4);
  const ciOn = span(t, 31, 36, 0.4);
  aaBars.forEach((b, i) => {
    const mid = XR[0] + (i + 0.5) * BW;
    const tail = Math.abs(mid) >= Math.abs(R.diff) - BW / 2;
    const y = N2.py(h[i] / top);
    set(b, { y, height: N2.py(0) - y, fill: shade > 0.5 && tail ? RED : A_COL, opacity: t < 31 ? 1 : 1 - ciOn * 0.75 });
  });
  set(obs, { opacity: span(t, 17.4, 30.8) });
  set(ci, { opacity: ciOn });
  set(ciDot, { r: 9 * ciOn });
  set(zero, { opacity: ciOn });
});
// ---- scene 5: peeking (36 – 41) ----
{
  const Q = plotFrame(v, { left: 170, right: 990, top: 330, bottom: 800 }, [0.5, 14.5], [0, 1], {
    xticks: [1, 4, 7, 10, 14],
    yticks: [0.05, 0.25, 0.5, 0.75, 1],
    yfmt: (y) => (y === 0.05 ? "0.05" : y.toFixed(2)),
    xlabel: "Day of the test",
    ylabel: "p-value",
    spans: [[36.2, 41]],
    plainTicks: true,
  });
  const zs = AA_ZS[AA_EXAMPLE];
  const pv = zs.map((z) => 2 * (1 - normCDF(Math.abs(z))));
  const zone = s("rect", { x: Q.px(0.5), width: Q.px(14.5) - Q.px(0.5), y: Q.py(0.05), height: Q.py(0) - Q.py(0.05), fill: RED, opacity: 0.15 }, Q.inner);
  const line = s("path", { fill: "none", stroke: BLUE, "stroke-width": 5 }, Q.inner);
  const dots = pv.map((p, d) => s("circle", { cx: Q.px(d + 1), cy: Q.py(p), r: 0, fill: p < 0.05 ? RED : BLUE, stroke: "#fff", "stroke-width": 2 }, Q.top));
  frame((t) => {
    const g = prog(t, 36.6, 3);
    const k = Math.floor(g * 14);
    set(zone, { opacity: 0.15 * span(t, 36.2, 41) });
    set(line, { d: pv.slice(0, Math.max(1, k)).map((p, d) => `${d ? "L" : "M"}${Q.px(d + 1).toFixed(1)},${Q.py(p).toFixed(1)}`).join("") });
    dots.forEach((c, d) => set(c, { r: d < k ? 8 : 0 }));
  });
}

frame((t) => {
  if (t < 13) head.el.innerHTML = `<span style="color:${C.dim}">15,000 visitors each. B converts</span> <b style="color:#047857">+${pts(R.diff)} points</b> <span style="color:${C.dim}">higher.</span>`;
  else if (t < 24) head.el.innerHTML = `<span style="color:${C.dim}">If A and B were identical, how big would gaps be?</span> <b>${cnt(t).toLocaleString("en-US")}</b> <span style="color:${C.dim}">A/A tests</span>`;
  else if (t < 31) head.el.innerHTML = `<span style="color:${C.dim}">A gap this big happens by chance only</span> <b style="color:${RED};font-size:36px">${(R.p * 100).toFixed(1)}%</b> <span style="color:${C.dim}">of the time: p = ${R.p.toFixed(3)}</span>`;
  else if (t < 36) head.el.innerHTML = `<span style="color:${C.dim}">95% confidence interval:</span> <b style="color:${BLUE}">+${pts(R.lo)} to +${pts(R.hi)} points</b>`;
  else head.el.innerHTML = `<span style="color:${C.dim}">An A/A test, checked daily. Stop at the first p &lt; 0.05?</span>`;
});

const CAP: [number, number, string][] = [
  [5, 12.8, "B looks better. But every number here is noisy."],
  [13, 24, "So ask: what if B made no difference at all?"],
  [24.2, 30.8, "Gaps this big are rare under \"no difference\": a small p-value."],
  [31, 36, "The interval shows how big the real gain could be."],
  [36.2, 41, `Peeking every day: ${Math.round(AA_PEEK_FP * 100)}% false alarms instead of 5%.`],
];
for (const [a, b, str] of CAP) life(text(str, { x: W / 2, y: 975 }, { size: 32, ax: 0.5, weight: 500 }), a, b, "fade", 0.35);

life(text("A/B testing in one line", { x: W / 2, y: 300 }, { size: 34, ax: 0.5, color: C.dim }), 41.4, 48, "fade");
life(text("Is the gap bigger than", { x: W / 2, y: 380 }, { size: 56, ax: 0.5, weight: 600 }), 41.6, 48, "fade");
life(text("the noise would make?", { x: W / 2, y: 460 }, { size: 56, ax: 0.5, weight: 600 }), 41.7, 48, "fade");
life(text("Arjun Chidambaram Subbiah", { x: W / 2, y: 760 }, { size: 38, ax: 0.5, weight: 600 }), 42.4, 48, "fade");
life(text("Data science, one concept at a time", { x: W / 2, y: 815 }, { size: 28, ax: 0.5, color: TEAL }), 42.7, 48, "fade");
life(text("arjunchidambaram.github.io", { x: W / 2, y: 930 }, { size: 26, ax: 0.5, color: C.dim }), 43, 48, "fade");

void AB;
v.ready();
