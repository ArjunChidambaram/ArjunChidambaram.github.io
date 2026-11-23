import { createVideo } from "./engine";
import { table, rows, codePanel, type Val, type RowKey } from "./sqlkit";

const DUR = 100;
const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: DUR });
const { C, W, text, life } = v;
const CUR = "rgba(88,196,221,0.30)";
const FRAME = "rgba(244,211,94,0.22)";
const PEER = "rgba(252,98,85,0.24)";

v.centerTitle("Window Frames, Step by Step", 0.2, 7.6, 70, 60, 600);
life(text("With ORDER BY, an aggregate window sees a {yellow:frame}: a range of rows around the current one.", { x: W / 2, y: 330 }, { size: 36, ax: 0.5 }), 1.4, 7.6, "fade");
life(text("Get the frame right and running totals and moving averages are one line.", { x: W / 2, y: 400 }, { size: 36, ax: 0.5, color: C.dim }), 3, 7.6, "fade");

// ---------------- frames on a daily table (8 – 38) ----------------
const D: [string, number][] = [
  ["Dec 1", 13.98],
  ["Dec 2", 254.96],
  ["Dec 3", 392.7],
  ["Dec 4", 530.04],
  ["Dec 5", 434.54],
  ["Dec 6", 181.43],
  ["Dec 7", 354.92],
  ["Dec 8", 312.43],
];
const f2 = (x: number) => x.toFixed(2);
const T = table(v, {
  x: 1050,
  y: 190,
  rowH: 54,
  size: 26,
  title: "daily",
  titleColor: C.blue,
  cols: [
    { key: "day", w: 150 },
    { key: "revenue", w: 180, align: "right" },
    { key: "result", w: 220, align: "right" },
  ],
  rows: D.map((r) => [r[0], f2(r[1]), ""]),
});
const keys: RowKey[] = [];
const sweep = (t0: number, lo: (i: number) => number, hi: (i: number) => number, fn: (vals: number[]) => number) => {
  D.forEach((_, i) => {
    const a = Math.max(0, lo(i));
    const b = Math.min(D.length - 1, hi(i));
    const vals = D.slice(a, b + 1).map((r) => r[1]);
    keys.push({ t: t0 + i * 0.85, bg: D.map((__, j) => (j === i ? CUR : j >= a && j <= b ? FRAME : null)), set: [[i, 2, f2(fn(vals))]] as [number, number, Val][], dur: 0.3 });
  });
};
const clear = (t: number) => keys.push({ t, bg: D.map(() => null), set: D.map((_, i) => [i, 2, ""] as [number, number, Val]), dur: 0.3 });
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
sweep(10, () => 0, (i) => i, sum);
clear(17.6);
sweep(18.4, (i) => i - 2, (i) => i, (a) => sum(a) / a.length);
clear(26);
sweep(26.8, (i) => i - 1, (i) => i + 1, (a) => sum(a) / a.length);
rows(v, T, keys, [8.6, 37.6]);

const c1 = codePanel(v, { x: 60, y: 200, size: 26, width: 880, lines: ["SUM(revenue) OVER (ORDER BY day", "  ROWS BETWEEN UNBOUNDED PRECEDING", "           AND CURRENT ROW)"] });
c1.at([{ t: 9, on: "all" }], [9, 17.6]);
const c2 = codePanel(v, { x: 60, y: 200, size: 26, width: 880, lines: ["AVG(revenue) OVER (ORDER BY day", "  ROWS BETWEEN 2 PRECEDING", "           AND CURRENT ROW)"] });
c2.at([{ t: 17.8, on: "all" }], [17.8, 26]);
const c3 = codePanel(v, { x: 60, y: 200, size: 26, width: 880, lines: ["AVG(revenue) OVER (ORDER BY day", "  ROWS BETWEEN 1 PRECEDING", "           AND 1 FOLLOWING)"] });
c3.at([{ t: 26.2, on: "all" }], [26.2, 37.6]);
const L = (s: string, a: number, b: number, y: number, color?: string) => life(text(s, { x: 60, y }, { size: 30, width: 900, color }), a, b, "fade");
L("{yellow:Running total}: the frame starts at the first row and ends at the current one.", 10, 17.6, 440);
L("{yellow:3-row moving average}: the frame slides, always the current row and the 2 before it.", 18.4, 26, 440);
L("{yellow:Centered average}: one row on each side. Edges use whatever rows exist.", 26.8, 37.6, 440);
L("Frame bounds: UNBOUNDED PRECEDING, n PRECEDING, CURRENT ROW, n FOLLOWING, UNBOUNDED FOLLOWING.", 30, 37.6, 560, C.dim);

// ---------------- the default frame trap (38 – 60) ----------------
const O: Val[][] = [
  [1392, "Dec 19"],
  [1393, "Dec 19"],
  [1394, "Dec 19"],
  [1395, "Dec 19"],
  [1396, "Dec 19"],
  [1397, "Dec 19"],
  [1398, "Dec 20"],
  [1399, "Dec 20"],
  [1400, "Dec 20"],
];
const T2 = table(v, {
  x: 1000,
  y: 190,
  rowH: 52,
  size: 25,
  title: "orders",
  titleColor: C.blue,
  cols: [
    { key: "order_id", w: 140 },
    { key: "order_date", w: 170 },
    { key: "default (RANGE)", w: 230, align: "center" },
    { key: "ROWS", w: 140, align: "center" },
  ],
  rows: O.map((r) => [r[0], r[1], "", ""]),
});
const rangeVals = [6, 6, 6, 6, 6, 6, 9, 9, 9];
const k2: RowKey[] = [{ t: 0, cols: [true, true, true, false], dur: 0.01 }];
O.forEach((_, i) => k2.push({ t: 42 + i * 0.7, bg: O.map((__, j) => (j === i ? CUR : O[j][1] === O[i][1] && j > i ? PEER : j < i || O[j][1] === O[i][1] ? FRAME : null)), set: [[i, 2, rangeVals[i]]] as [number, number, Val][], dur: 0.3 }));
k2.push({ t: 49, bg: O.map(() => null), cols: [true, true, true, true] });
O.forEach((_, i) => k2.push({ t: 49.6 + i * 0.5, set: [[i, 3, i + 1]] as [number, number, Val][], dur: 0.2 }));
rows(v, T2, k2, [38.6, 59.6]);
codePanel(v, { x: 60, y: 200, size: 26, width: 860, lines: ["COUNT(*) OVER (ORDER BY order_date)", "-- default frame:", "--   RANGE BETWEEN UNBOUNDED PRECEDING", "--         AND CURRENT ROW"] }).at([{ t: 38.6, on: "all" }], [38.6, 59.6]);
L("Add ORDER BY and the {red:default} frame is RANGE … CURRENT ROW.", 40, 59.6, 480);
L("RANGE includes every {red:peer}: rows tied on the ORDER BY value. All six Dec 19 orders count as 'current', so each gets 6.", 42, 59.6, 560, C.dim);
L("Say ROWS (or make ORDER BY unique) for a true row-by-row running count.", 50, 59.6, 760, C.green);

// ---------------- LAST_VALUE ----------------
v.centerTitle("Two More Frame Gotchas", 60.2, 77.6, 70, 52, 520);
life(text("{yellow:1. LAST_VALUE} with the default frame returns the current row, because the frame stops there.", { x: W / 2, y: 230 }, { size: 34, ax: 0.5 }), 61, 77.6, "fade");
life(text("LAST_VALUE(name) OVER (PARTITION BY category ORDER BY price DESC", { x: W / 2, y: 300 }, { size: 30, ax: 0.5, font: "'DejaVu Sans Mono',monospace" }), 62, 77.6, "fade");
life(text("  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)", { x: W / 2, y: 345 }, { size: 30, ax: 0.5, font: "'DejaVu Sans Mono',monospace", color: C.green }), 63, 77.6, "fade");
life(text("{yellow:2. ROWS counts rows, not days.} With no orders Nov 5–7, '6 PRECEDING' reaches back more than a week.", { x: W / 2, y: 480 }, { size: 34, ax: 0.5 }), 66, 77.6, "fade");
life(text("Fix: join to a full calendar (generate_series) and fill zeros, or", { x: W / 2, y: 550 }, { size: 32, ax: 0.5, color: C.dim }), 68, 77.6, "fade");
life(text("RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW", { x: W / 2, y: 610 }, { size: 30, ax: 0.5, font: "'DejaVu Sans Mono',monospace", color: C.green }), 69, 77.6, "fade");
life(text("RANGE with an interval works in PostgreSQL 11+, DuckDB, Oracle; others need the calendar join.", { x: W / 2, y: 690 }, { size: 30, ax: 0.5, color: C.dim }), 71, 77.6, "fade");

// ---------------- LAG / LEAD ----------------
v.centerTitle("LAG and LEAD", 78.2, 92.6, 70, 52, 360);
life(text("LAG(x, n, default) looks n rows back; LEAD(x, n, default) looks n rows ahead. No frame involved.", { x: W / 2, y: 230 }, { size: 34, ax: 0.5 }), 79, 92.6, "fade");
life(text("order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date)", { x: W / 2, y: 320 }, { size: 29, ax: 0.5, font: "'DejaVu Sans Mono',monospace" }), 80.5, 92.6, "fade");
life(text("= days since that customer's previous order. Across all repeat orders: average 41, median 19.", { x: W / 2, y: 390 }, { size: 32, ax: 0.5, color: C.dim }), 82, 92.6, "fade");
life(text("The first row of each partition has nothing before it, so LAG gives NULL (or your default).", { x: W / 2, y: 500 }, { size: 32, ax: 0.5 }), 84, 92.6, "fade");
life(text("Month-over-month growth: (revenue − LAG(revenue)) / LAG(revenue).", { x: W / 2, y: 600 }, { size: 34, ax: 0.5, color: C.green }), 86, 92.6, "fade");

v.endCard(93.2, 99.6, [
  { text: "LAG and LEAD look sideways. Frames decide what an aggregate sees.", size: 40, y: 260 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
