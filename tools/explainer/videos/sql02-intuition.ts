import { createVideo } from "./engine";
import { table, rows, codePanel, shorts, type Val } from "./sqlkit";

const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: 48 });
const GREEN = "rgba(5,206,145,0.22)";
const DUP = "rgba(226,72,61,0.14)";
const TIER: Record<string, string> = { premium: "rgba(155,89,208,0.22)", standard: "rgba(43,140,190,0.18)", budget: "rgba(212,160,23,0.24)" };

shorts(
  v,
  "Sorting, LIMIT, DISTINCT, CASE",
  "Shaping what comes back",
  "In one line",
  ["Sort it, cut it, dedupe it,", "and label it with CASE."],
  [
    [5, 14.8, "ORDER BY sorts the rows. DESC means largest first."],
    [15, 21.8, "LIMIT keeps only the first few rows after sorting."],
    [22, 30.8, "DISTINCT collapses identical rows into one."],
    [31, 41, "CASE adds a label: the first WHEN that's true wins."],
  ]
);

const P: Val[][] = [
  ["Trail Running Shoes", "Footwear", 89.99],
  ["Everyday Sneakers", "Footwear", 59.99],
  ["Rain Boots", "Footwear", 44.5],
  ["Water Bottle", "Outdoor", 24.99],
  ["Daypack 20L", "Outdoor", 64.0],
  ["Two-Person Tent", "Outdoor", 179.0],
  ["Wireless Earbuds", "Electronics", 79.0],
  ["Coffee Beans 1lb", "Grocery", 12.49],
];
const rank = P.map((r) => P.filter((q) => (q[2] as number) > (r[2] as number)).length);
const COLS = [
  { key: "name", w: 370 },
  { key: "category", w: 250 },
  { key: "price", w: 160, align: "right" as const },
];

// A + B: sort then limit
const money = (r: Val[]) => [r[0], r[1], (r[2] as number).toFixed(2)];
const T1 = table(v, { x: 140, y: 380, cols: COLS, rows: P.map(money), rowH: 54, size: 27 });
rows(
  v,
  T1,
  [
    { t: 8, slot: rank },
    { t: 16.5, slot: rank.map((r) => (r < 3 ? r : null)), bg: rank.map((r) => (r < 3 ? GREEN : null)) },
  ],
  [5.2, 21.6]
);
codePanel(v, { x: 140, y: 165, lines: ["SELECT name, category, price", "FROM products", "ORDER BY price DESC;"], size: 27, width: 800 }).at([{ t: 5, on: [2] }], [5.2, 15]);
codePanel(v, { x: 140, y: 165, lines: ["SELECT name, category, price", "FROM products", "ORDER BY price DESC", "LIMIT 3;"], size: 27, width: 800 }).at([{ t: 15, on: [3] }], [15, 21.6]);

// C: distinct
const cats = P.map((r) => r[1] as string);
const firstIdx = cats.map((c, i) => cats.indexOf(c) === i);
const order = ["Electronics", "Footwear", "Grocery", "Outdoor"];
const T2 = table(v, { x: 290, y: 345, cols: [{ key: "category", w: 500 }], rows: P.map((r) => [r[1]]), rowH: 54, size: 27 });
const sortedSlots = (() => {
  const idx = P.map((_, i) => i).sort((a, b) => order.indexOf(cats[a]) - order.indexOf(cats[b]) || a - b);
  const s: number[] = [];
  idx.forEach((i, k) => (s[i] = k));
  return s;
})();
rows(
  v,
  T2,
  [
    { t: 24, slot: sortedSlots },
    { t: 26, bg: firstIdx.map((f) => (f ? null : DUP)) },
    { t: 28, slot: P.map((_, i) => (firstIdx[i] ? order.indexOf(cats[i]) : null)), bg: P.map(() => GREEN) },
  ],
  [22.2, 30.6]
);
codePanel(v, { x: 140, y: 165, lines: ["SELECT DISTINCT category", "FROM products;"], size: 27, width: 800 }).at([{ t: 22, on: [0] }], [22.2, 30.6]);

// D: CASE
const tier = (p: number) => (p >= 100 ? "premium" : p >= 30 ? "standard" : "budget");
const T3 = table(v, {
  x: 100,
  y: 400,
  cols: [
    { key: "name", w: 370 },
    { key: "price", w: 150, align: "right" },
    { key: "tier", w: 200, align: "center" },
  ],
  rows: P.map((r) => [r[0], (r[2] as number).toFixed(2), ""]),
  rowH: 52,
  size: 26,
});
rows(
  v,
  T3,
  P.map((r, i) => ({ t: 33 + i * 0.6, set: [[i, 2, tier(r[2] as number)]] as [number, number, Val][], bg: P.map((q, j) => (j <= i ? TIER[tier(q[2] as number)] : null)), dur: 0.3 })),
  [31.2, 41]
);
codePanel(v, {
  x: 100,
  y: 150,
  lines: ["SELECT name, price,", "  CASE WHEN price >= 100 THEN 'premium'", "       WHEN price >= 30  THEN 'standard'", "       ELSE 'budget' END AS tier", "FROM products;"],
  size: 25,
  width: 880,
}).at([{ t: 31, on: [1, 2, 3] }], [31.2, 41]);

v.ready();
