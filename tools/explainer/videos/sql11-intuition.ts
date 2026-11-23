import { createVideo } from "./engine";
import { table, rows, codePanel, shorts, type Val } from "./sqlkit";

const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: 48 });
const R = ["rgba(43,140,190,0.22)", "rgba(5,206,145,0.22)", "rgba(212,160,23,0.28)", "rgba(226,72,61,0.18)", "rgba(140,90,200,0.2)"];

shorts(
  v,
  "Analytics Patterns",
  "Funnels, sessions, cohorts and A/B tests",
  "In one line",
  ["Most product analytics is", "GROUP BY plus a window function."],
  [
    [5, 13.8, "A funnel: count distinct sessions that reach each step."],
    [14, 22.8, "Sessions: a gap of more than 30 minutes starts a new one. A running sum numbers them."],
    [23, 30.8, "Cohorts: group customers by first-order month, then count who comes back."],
    [31, 41, "A/B test: conversion per variant, then the z-score. Here, no real difference."],
  ]
);

// funnel
const F: Val[][] = [
  ["view_product", 1897, "100%", ""],
  ["add_to_cart", 825, "43%", ""],
  ["checkout", 473, "25%", ""],
  ["purchase", 322, "17%", ""],
];
const FT = table(v, {
  x: 120,
  y: 330,
  rowH: 62,
  size: 28,
  cols: [
    { key: "step", w: 260 },
    { key: "sessions", w: 160, align: "right" },
    { key: "of top", w: 140, align: "right" },
    { key: "", w: 280 },
  ],
  rows: F,
});
rows(
  v,
  FT,
  [{ t: 0, slot: [0, null, null, null], bg: R.slice(0, 4), dur: 0.01 }, ...[1, 2, 3].map((k) => ({ t: 6.5 + k * 1.6, slot: [0, 1, 2, 3].map((i) => (i <= k ? i : null)) }))],
  [5.3, 13.8]
);
// bars beside funnel rows
[1897, 825, 473, 322].forEach((n, i) => {
  const bar = v.s("rect", { x: 700, y: 330 + 62 * (i + 1) + 14, width: 0, height: 34, rx: 4, fill: "#2B8CBE", opacity: 0 });
  const t0 = i === 0 ? 5.6 : 6.5 + i * 1.6;
  v.frame((t) => v.set(bar, { width: (250 * n) / 1897 * Math.min(1, Math.max(0, (t - t0) / 0.7)), opacity: t > t0 && t < 13.8 ? 1 : 0 }));
});
codePanel(v, { x: 120, y: 175, size: 22, width: 840, lines: ["COUNT(DISTINCT session_id)", "  FILTER (WHERE event_type = 'add_to_cart') AS carted"] }).at([{ t: 5, on: "all" }], [5.2, 13.8]);

// sessionize
const EV: Val[][] = [
  ["Nov 3 18:19", "26 h", 1, 3],
  ["Nov 3 18:20", "2 min", 0, 3],
  ["Nov 3 18:24", "4 min", 0, 3],
  ["Nov 4 17:36", "23 h", 1, 4],
  ["Nov 4 17:40", "5 min", 0, 4],
  ["Nov 4 17:47", "6 min", 0, 4],
  ["Nov 5 15:15", "21 h", 1, 5],
];
const ET = table(v, {
  x: 110,
  y: 260,
  rowH: 58,
  size: 26,
  title: "customer 127's events (Nov 3–5)",
  cols: [
    { key: "event_time", w: 250 },
    { key: "gap", w: 160, align: "right" },
    { key: "new?", w: 140, align: "center" },
    { key: "session", w: 300, align: "center" },
  ],
  rows: EV,
});
rows(
  v,
  ET,
  [
    { t: 0, cols: [true, false, false, false], dur: 0.01 },
    { t: 15.2, cols: [true, true, false, false] },
    { t: 17, cols: [true, true, true, false] },
    { t: 19, cols: [true, true, true, true], bg: EV.map((r) => R[(r[3] as number) - 3]) },
  ],
  [14.3, 22.8]
);
v.life(v.text("new? = gap > 30 min.  session = running SUM(new?)", { x: 540, y: 790 }, { size: 28, ax: 0.5, color: "#444" }), 17.5, 22.8, "fade");

// cohorts
const CO: Val[][] = [
  ["2025-09", 6, "0%", "33%", "33%"],
  ["2025-10", 11, "36%", "36%", null],
  ["2025-11", 20, "30%", null, null],
  ["2025-12", 21, null, null, null],
];
const CT = table(v, {
  x: 110,
  y: 330,
  rowH: 64,
  size: 27,
  title: "retention by first-order month",
  cols: [
    { key: "cohort", w: 200 },
    { key: "customers", w: 170, align: "right" },
    { key: "month 1", w: 160, align: "right" },
    { key: "month 2", w: 160, align: "right" },
    { key: "month 3", w: 160, align: "right" },
  ],
  rows: CO,
});
rows(
  v,
  CT,
  [
    { t: 0, cols: [true, true, false, false, false], dur: 0.01 },
    { t: 25, cols: [true, true, true, false, false] },
    { t: 26.2, cols: [true, true, true, true, false] },
    { t: 27.4, cols: [true, true, true, true, true] },
  ],
  [23.3, 30.8]
);
v.life(v.text("NULL = that month hasn't happened yet", { x: 540, y: 740 }, { size: 28, ax: 0.5, color: "#555" }), 28, 30.8, "fade");

// A/B
const AB = table(v, {
  x: 190,
  y: 330,
  rowH: 64,
  size: 28,
  cols: [
    { key: "variant", w: 160 },
    { key: "sessions", w: 180, align: "right" },
    { key: "converted", w: 190, align: "right" },
    { key: "rate", w: 170, align: "right" },
  ],
  rows: [
    ["A", 947, 157, "16.6%"],
    ["B", 950, 165, "17.4%"],
  ],
});
rows(v, AB, [{ t: 0, bg: [R[0], R[1]], dur: 0.01 }], [31.3, 41]);
v.life(v.text("lift +0.8 pts,  z = 0.46,  95% CI −2.6 to +4.2 pts", { x: 540, y: 600 }, { size: 32, ax: 0.5, weight: 500 }), 33.5, 41, "fade");
v.life(v.text("The interval includes 0: not enough evidence that B is better.", { x: 540, y: 670 }, { size: 28, ax: 0.5, color: "#C0392B" }), 35.5, 41, "fade");

v.ready();
