import { createVideo, plotFrame, prog, smooth, span, easeOut } from "./engine";
import { BOOT_SAMPLE, BOOT_DRAWS, BOOT_MEDIANS, TRUE_MEDIANS, BOOT_N, median, quantile, sd, binned, rng } from "../../../lib/explainers/stats";

const DURATION = 47;
const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: DURATION });
const { C, W, text, life, s, set, frame } = v;
const TEAL = "#007A7A";
const BLUE = "#2B8CBE";
const ORANGE = "#E8772E";
const PURPLE = "#9B59D0";
const GREEN = "#05CE91";
const money = (x: number) => `&#36;${x}`;

life(text("Data science, one concept at a time", { x: W / 2, y: 400 }, { size: 30, ax: 0.5, color: TEAL, weight: 500 }), 0.2, 4.4, "fade", 0.8);
life(text("The Bootstrap", { x: W / 2, y: 460 }, { size: 96, ax: 0.5, weight: 600 }), 0.3, 4.4, "fade", 0.9);
life(text("Error bars from one sample", { x: W / 2, y: 600 }, { size: 36, ax: 0.5, color: C.dim }), 0.6, 4.4, "fade", 0.9);
life(text("The Bootstrap", { x: 100, y: 70 }, { size: 56, weight: 600 }), 4.4, 41, "fade", 0.6);
const bar = s("rect", { x: 100, y: 146, width: 0, height: 6, fill: TEAL });
frame((t) => set(bar, { width: 90 * easeOut(prog(t, 4.6, 0.6)), opacity: 1 - prog(t, 41, 0.5) }));
const head = v.html("", { x: 100, y: 196 }, { size: 28 });
life(head, 5, 41, "fade", 0.3);

// ---- the sample: a strip of 50 orders ----
const S = plotFrame(v, { left: 130, right: 990, top: 300, bottom: 480 }, [0, 240], [0, 1], {
  xticks: [0, 50, 100, 150, 200],
  yticks: [],
  xfmt: money,
  xlabel: "The 50 orders we have",
  spans: [[4.8, 41]],
  plainTicks: true,
});
const jr = rng(5);
const jit = BOOT_SAMPLE.map(() => 0.15 + 0.7 * jr());
const dots = BOOT_SAMPLE.map((x, i) => s("circle", { cx: S.px(x), cy: S.py(jit[i]), r: 0, fill: BLUE, stroke: "#fff", "stroke-width": 2 }, S.top));
const med0 = median(BOOT_SAMPLE);
const medLine = s("line", { x1: S.px(med0), x2: S.px(med0), y1: S.py(0), y2: S.py(1), stroke: ORANGE, "stroke-width": 3, "stroke-dasharray": "8 6", opacity: 0 }, S.inner);
const resLine = s("line", { y1: S.py(0), y2: S.py(1), stroke: PURPLE, "stroke-width": 4, opacity: 0 }, S.top);

// ---- bootstrap medians ----
const XR: [number, number] = [20, 80];
const B = plotFrame(v, { left: 130, right: 990, top: 620, bottom: 850 }, XR, [0, 1], {
  xticks: [20, 30, 40, 50, 60, 70, 80],
  yticks: [],
  xfmt: money,
  xlabel: "Median of each resample",
  spans: [[11.8, 41]],
  plainTicks: true,
});
const BW = 2;
const nb = (XR[1] - XR[0]) / BW;
const bars = Array.from({ length: nb }, (_, i) => s("rect", { x: B.px(XR[0] + i * BW) + 1, width: B.px(BW) - B.px(0) - 2, y: B.py(0), height: 0, fill: PURPLE }, B.inner));
const lo = quantile(BOOT_MEDIANS, 0.025);
const hi = quantile(BOOT_MEDIANS, 0.975);
const ciBand = s("rect", { x: B.px(lo), width: B.px(hi) - B.px(lo), y: B.py(1), height: B.py(0) - B.py(1), fill: GREEN, opacity: 0 }, B.inner);
const trueOutline = s("path", { fill: "none", stroke: ORANGE, "stroke-width": 4, opacity: 0 }, B.top);
const DEMO = BOOT_DRAWS.map((d) => median(d.map((i) => BOOT_SAMPLE[i])));
const ALL = [...DEMO, ...BOOT_MEDIANS];
const STEP = 1.5;
const demoK = (t: number) => Math.floor((t - 12) / STEP);

frame((t) => {
  const fade = 1 - prog(t, 41, 0.5);
  const k = demoK(t);
  const inDemo = t >= 12 && t < 12 + STEP * BOOT_DRAWS.length;
  const counts = new Array(BOOT_N).fill(0);
  if (inDemo) for (const i of BOOT_DRAWS[k]) counts[i]++;
  dots.forEach((d, i) => {
    const p = prog(t, 5.2 + i * 0.03, 0.3);
    const base = p > 0 ? 9 + Math.sin(p * Math.PI) * 5 : 0;
    const r = inDemo ? (counts[i] === 0 ? 7 : 7 + counts[i] * 4) : base;
    set(d, { r: r * fade, opacity: inDemo && counts[i] === 0 ? 0.25 : 1, fill: inDemo && counts[i] > 0 ? PURPLE : BLUE });
  });
  set(medLine, { opacity: span(t, 7, 41) * fade });
  const f = (t - 12) / STEP - k;
  set(resLine, { x1: S.px(inDemo ? DEMO[k] : 0), x2: S.px(inDemo ? DEMO[k] : 0), opacity: inDemo && f > 0.35 ? 1 : 0 });
  // histogram fill
  let n = 0;
  if (t >= 12) n = inDemo ? Math.min(DEMO.length, k + (f > 0.6 ? 1 : 0)) : Math.round(DEMO.length + (ALL.length - DEMO.length) * smooth(prog(t, 24, 5)));
  const h = binned(ALL.slice(0, n), XR[0], XR[1], BW);
  const top = Math.max(4, ...h) * 1.12;
  bars.forEach((b, i) => {
    const y = B.py(h[i] / top);
    set(b, { y, height: B.py(0) - y, opacity: fade });
  });
  set(ciBand, { opacity: 0.18 * span(t, 30.2, 41) * fade });
  const tv = span(t, 36.2, 41, 0.5) * fade;
  if (tv > 0) {
    const th = binned(TRUE_MEDIANS, XR[0], XR[1], BW);
    const sc = top / ((ALL.length / TRUE_MEDIANS.length) * 1);
    let d = "";
    th.forEach((c, i) => {
      const y = B.py((c * (ALL.length / TRUE_MEDIANS.length)) / top);
      d += `${i ? "L" : "M"}${B.px(XR[0] + i * BW).toFixed(1)},${y.toFixed(1)}L${B.px(XR[0] + (i + 1) * BW).toFixed(1)},${y.toFixed(1)}`;
    });
    void sc;
    set(trueOutline, { d, opacity: tv });
  } else set(trueOutline, { opacity: 0 });

  if (t < 12) head.el.innerHTML = `<span style="color:${C.dim}">50 orders. Median</span> <b style="color:${ORANGE};font-size:36px">$${med0.toFixed(2)}</b><span style="color:${C.dim}">. How sure can we be?</span>`;
  else if (inDemo) {
    const distinct = counts.filter((c) => c > 0).length;
    head.el.innerHTML = `<span style="color:${C.dim}">Resample ${k + 1}: draw 50 <i>with replacement</i>.</span> <b>${distinct}</b> <span style="color:${C.dim}">distinct orders → median</span> <b style="color:${PURPLE}">$${DEMO[k].toFixed(2)}</b>`;
  } else if (t < 30.2) head.el.innerHTML = `<b style="color:${PURPLE};font-size:36px">${n.toLocaleString("en-US")}</b> <span style="color:${C.dim}">resamples, each with its own median</span>`;
  else if (t < 36.2) head.el.innerHTML = `<span style="color:${C.dim}">Middle 95%:</span> <b style="color:#047857">$${lo.toFixed(2)} to $${hi.toFixed(2)}</b><span style="color:${C.dim}">. Spread (SE):</span> <b>$${sd(BOOT_MEDIANS, 1).toFixed(2)}</b>`;
  else head.el.innerHTML = `<span style="color:${C.dim}">The true spread (knowable only in a simulation):</span> <b style="color:${ORANGE}">$${sd(TRUE_MEDIANS, 1).toFixed(2)}</b>`;
});

const CAP: [number, number, string][] = [
  [5, 11.8, "One sample, one median. No formula for its error bar."],
  [12, 24, "So treat the sample as the population, and resample it."],
  [24.2, 30, "The resampled medians show how much the median wobbles."],
  [30.2, 36, "Their middle 95% is a confidence interval."],
  [36.2, 41, "Same spread as the real thing, centered on our sample."],
];
for (const [a, b, str] of CAP) life(text(str, { x: W / 2, y: 975 }, { size: 32, ax: 0.5, weight: 500 }), a, b, "fade", 0.35);

life(text("The bootstrap in one line", { x: W / 2, y: 300 }, { size: 34, ax: 0.5, color: C.dim }), 41.4, 48, "fade");
life(text("Resample your data", { x: W / 2, y: 380 }, { size: 56, ax: 0.5, weight: 600 }), 41.6, 48, "fade");
life(text("to see how much it could vary.", { x: W / 2, y: 460 }, { size: 56, ax: 0.5, weight: 600 }), 41.7, 48, "fade");
life(text("Arjun Chidambaram Subbiah", { x: W / 2, y: 760 }, { size: 38, ax: 0.5, weight: 600 }), 42.4, 48, "fade");
life(text("Data science, one concept at a time", { x: W / 2, y: 815 }, { size: 28, ax: 0.5, color: TEAL }), 42.7, 48, "fade");
life(text("arjunchidambaram.github.io", { x: W / 2, y: 930 }, { size: 26, ax: 0.5, color: C.dim }), 43, 48, "fade");

v.ready();
