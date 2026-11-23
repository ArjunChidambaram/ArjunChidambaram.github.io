import { createVideo, plotFrame, prog, smooth, span, easeOut } from "./engine";
import { DAYS, DAY_GRID, DAY_N, P_BUY, binomPMF, histogram } from "../../../lib/explainers/stats";

const DURATION = 47;
const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: DURATION });
const { C, W, text, life, s, set, frame } = v;
const TEAL = "#007A7A";
const GREEN = "#05CE91";
const NO = "#CBD5E1";
const BAR = "#2B8CBE";

life(text("Data science, one concept at a time", { x: W / 2, y: 400 }, { size: 30, ax: 0.5, color: TEAL, weight: 500 }), 0.2, 4.4, "fade", 0.8);
life(text("Probability", { x: W / 2, y: 460 }, { size: 96, ax: 0.5, weight: 600 }), 0.3, 4.4, "fade", 0.9);
life(text("What does “10%” really mean?", { x: W / 2, y: 600 }, { size: 36, ax: 0.5, color: C.dim }), 0.6, 4.4, "fade", 0.9);
life(text("Probability", { x: 100, y: 70 }, { size: 56, weight: 600 }), 4.4, 41, "fade", 0.6);
const bar = s("rect", { x: 100, y: 146, width: 0, height: 6, fill: TEAL });
frame((t) => set(bar, { width: 90 * easeOut(prog(t, 4.6, 0.6)), opacity: 1 - prog(t, 41, 0.5) }));

// ---- visitor grid (one day of 100 visitors) ----
const G0 = { x: 120, y: 230, cell: 36 };
const people = Array.from({ length: DAY_N }, (_, i) =>
  s("circle", { cx: G0.x + (i % 10) * G0.cell + G0.cell / 2, cy: G0.y + Math.floor(i / 10) * G0.cell + G0.cell / 2, r: 0, fill: NO })
);
const dayLbl = v.html("", { x: 560, y: 250 }, { size: 30 });
life(dayLbl, 5.4, 41, "fade", 0.3);

// ---- histogram of buyers per day ----
const P = plotFrame(v, { left: 150, right: 990, top: 640, bottom: 855 }, [-0.5, 24.5], [0, 1], {
  xticks: [0, 4, 8, 12, 16, 20, 24],
  yticks: [],
  xlabel: "Buyers in a day (out of 100 visitors)",
  spans: [[12.6, 41]],
  plainTicks: true,
});
const bw = P.px(1) - P.px(0);
const bars = Array.from({ length: 25 }, (_, k) => s("rect", { x: P.px(k - 0.42), width: bw * 0.84, y: P.py(0), height: 0, fill: BAR, rx: 3 }, P.inner));
const curve = Array.from({ length: 25 }, (_, k) => s("circle", { cx: P.px(k), r: 0, fill: "#E8772E", stroke: "#fff", "stroke-width": 2 }, P.top));
const band = s("rect", { y: P.py(1), height: P.py(0) - P.py(1), x: P.px(3.5), width: P.px(16.5) - P.px(3.5), fill: GREEN, opacity: 0 }, P.inner);

// how many days are on the histogram at time t
const daysAt = (t: number) => {
  if (t < 13) return 0;
  if (t < 21) return Math.min(10, 1 + Math.floor((t - 13) / 0.8));
  return Math.max(10, Math.round(10 * Math.pow(100, smooth(prog(t, 21.2, 7.6)))));
};
// which day's grid is shown
const gridDay = (t: number) => (t < 13 ? 0 : t < 21 ? Math.min(9, Math.floor((t - 13) / 0.8)) : Math.max(0, daysAt(t) - 1));

frame((t) => {
  const fade = 1 - prog(t, 41, 0.5);
  const d = gridDay(t);
  const grid = DAY_GRID(d);
  people.forEach((c, i) => {
    const p = prog(t, 5.2 + i * 0.012, 0.25);
    const lit = t > 7.6 + (t < 13 ? i * 0.02 : 0);
    set(c, { r: (p > 0 ? 13 + Math.sin(p * Math.PI) * 4 : 0) * fade, fill: lit && grid[i] ? GREEN : NO });
  });
  const n = daysAt(t);
  const h = histogram(DAYS.slice(0, n), 0, 24);
  // y scale: stacked days early, then shrink to fit
  const top = Math.max(6, ...h) * 1.08;
  bars.forEach((b, k) => {
    const y = P.py(h[k] / top);
    set(b, { y, height: P.py(0) - y, opacity: fade });
  });
  const cv = span(t, 30.4, 41, 0.6);
  curve.forEach((c, k) => set(c, { cy: P.py((binomPMF(DAY_N, P_BUY, k) * n) / top), r: 7 * cv * fade }));
  set(band, { opacity: 0.16 * span(t, 36.2, 41, 0.4) });

  if (t < 7.6) dayLbl.el.innerHTML = `<div style="color:${C.dim}">100 visitors.</div><div style="color:${C.dim}">Each buys with</div><div style="color:${C.dim}">probability <b style="color:${C.ink}">10%</b>.</div>`;
  else {
    const k = DAYS[d];
    dayLbl.el.innerHTML = `<div style="color:${C.dim}">Day <b style="color:${C.ink}">${(d + 1).toLocaleString("en-US")}</b></div><div style="margin-top:6px"><b style="color:#047857;font-size:64px;line-height:1">${k}</b> <span style="color:${C.dim}">buyers</span></div>${
      t > 21 ? `<div style="margin-top:14px;color:${C.dim}">${n.toLocaleString("en-US")} days so far</div>` : ""
    }${t > 36.2 ? `<div style="margin-top:8px;color:#047857">98% of days: 4 to 16 buyers</div>` : ""}`;
  }
});

const CAP: [number, number, string][] = [
  [5, 12.6, "10% doesn't mean exactly 10 buyers out of 100."],
  [12.8, 21, "Each day comes out different."],
  [21.2, 30.2, "But over many days a pattern appears."],
  [30.4, 36, "Probability predicts that pattern exactly."],
  [36.2, 41, "Single outcomes vary. Their spread is predictable."],
];
for (const [a, b, str] of CAP) life(text(str, { x: W / 2, y: 975 }, { size: 32, ax: 0.5, weight: 500 }), a, b, "fade", 0.35);

life(text("Probability in one line", { x: W / 2, y: 300 }, { size: 34, ax: 0.5, color: C.dim }), 41.4, 48, "fade");
life(text("One outcome is a surprise.", { x: W / 2, y: 380 }, { size: 56, ax: 0.5, weight: 600 }), 41.6, 48, "fade");
life(text("Many outcomes form a pattern.", { x: W / 2, y: 460 }, { size: 56, ax: 0.5, weight: 600 }), 41.7, 48, "fade");
life(text("Arjun Chidambaram Subbiah", { x: W / 2, y: 760 }, { size: 38, ax: 0.5, weight: 600 }), 42.4, 48, "fade");
life(text("Data science, one concept at a time", { x: W / 2, y: 815 }, { size: 28, ax: 0.5, color: TEAL }), 42.7, 48, "fade");
life(text("arjunchidambaram.github.io", { x: W / 2, y: 930 }, { size: 26, ax: 0.5, color: C.dim }), 43, 48, "fade");

v.ready();
