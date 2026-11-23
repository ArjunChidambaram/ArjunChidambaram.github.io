import { createVideo } from "./engine";
import { table, rows, codePanel, shorts, type Val } from "./sqlkit";

const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: 48 });
const CAT: Record<string, string> = { Footwear: "rgba(43,140,190,0.18)", Outdoor: "rgba(5,206,145,0.20)", Electronics: "rgba(155,89,208,0.18)" };
const AVG: Record<string, number> = { Footwear: 52.37, Outdoor: 83.39, Electronics: 71.59 };

shorts(
  v,
  "Window Functions: Ranking",
  "Compute across rows, keep every row",
  "Window functions in one line",
  ["Like GROUP BY,", "but every row stays."],
  [
    [5, 13.8, "GROUP BY collapses each category into one row."],
    [14, 22.8, "A window function computes the same thing, but keeps every row."],
    [23, 32.8, "ROW_NUMBER numbers rows within each partition, in your order."],
    [33, 41, "Ties: ROW_NUMBER picks, RANK skips, DENSE_RANK doesn't."],
  ]
);

const P: Val[][] = [
  ["Trail Running Shoes", "Footwear", 89.99],
  ["Water Bottle", "Outdoor", 24.99],
  ["Smart Watch", "Electronics", 199.0],
  ["Rain Boots", "Footwear", 44.5],
  ["Two-Person Tent", "Outdoor", 179.0],
  ["Wireless Earbuds", "Electronics", 79.0],
  ["Everyday Sneakers", "Footwear", 59.99],
  ["Daypack 20L", "Outdoor", 64.0],
];
const cats = P.map((r) => r[1] as string);
const fmt = (x: Val) => (x as number).toFixed(2);

// A: GROUP BY collapse
const G = table(v, {
  x: 140,
  y: 400,
  rowH: 54,
  size: 26,
  cols: [
    { key: "category", w: 360 },
    { key: "AVG(price)", w: 260, align: "right" },
  ],
  rows: ["Electronics", "Footwear", "Outdoor"].map((c) => [c, AVG[c].toFixed(2)]),
});
rows(v, G, [{ t: 0, bg: ["Electronics", "Footwear", "Outdoor"].map((c) => CAT[c]), dur: 0.01 }], [7, 13.8]);
codePanel(v, { x: 90, y: 165, lines: ["SELECT category, AVG(price)", "FROM products", "GROUP BY category;"], size: 26, width: 900 }).at([{ t: 5, on: [0, 2] }], [5.2, 13.8]);

// B + C: window avg, then row_number
const order = ["Electronics", "Footwear", "Outdoor"];
const sortedIdx = P.map((_, i) => i).sort((a, b) => order.indexOf(cats[a]) - order.indexOf(cats[b]) || (P[b][2] as number) - (P[a][2] as number));
const slot = P.map((_, i) => sortedIdx.indexOf(i));
const rn = P.map((_, i) => sortedIdx.filter((j) => cats[j] === cats[i]).indexOf(i) + 1);
const W = table(v, {
  x: 60,
  y: 390,
  rowH: 54,
  size: 25,
  cols: [
    { key: "name", w: 290 },
    { key: "category", w: 190 },
    { key: "price", w: 130, align: "right" },
    { key: "category_avg", w: 190, align: "right" },
    { key: "rn", w: 90, align: "center" },
  ],
  rows: P.map((r) => [r[0], r[1], fmt(r[2]), "", ""]),
});
rows(
  v,
  W,
  [
    { t: 0, cols: [true, true, true, false, false], dur: 0.01 },
    { t: 15.5, cols: [true, true, true, true, false], bg: cats.map((c) => CAT[c]) },
    ...P.map((r, i) => ({ t: 16.5 + i * 0.4, set: [[i, 3, AVG[cats[i]].toFixed(2)]] as [number, number, Val][], dur: 0.2 })),
    { t: 24, slot, cols: [true, true, true, false, false], dur: 1.2 },
    { t: 25.6, cols: [true, true, true, false, true] },
    ...sortedIdx.map((i, k) => ({ t: 26.4 + k * 0.5, set: [[i, 4, rn[i]]] as [number, number, Val][], dur: 0.2 })),
  ],
  [14.2, 32.8]
);
codePanel(v, { x: 60, y: 165, lines: ["SELECT name, category, price,", "  AVG(price) OVER (PARTITION BY category)", "FROM products;"], size: 25, width: 960 }).at([{ t: 14, on: [1] }], [14.2, 22.9]);
codePanel(v, { x: 60, y: 165, lines: ["SELECT name, category, price,", "  ROW_NUMBER() OVER (PARTITION BY category", "                     ORDER BY price DESC) AS rn", "FROM products;"], size: 25, width: 960 }).at([{ t: 23, on: [1, 2] }], [23.2, 32.8]);

// D: ties
const TIE: Val[][] = [
  ["Sofia", 19],
  ["Noah", 18],
  ["Kenji", 15],
  ["Liam", 13],
  ["Elijah", 11],
  ["Sofia", 11],
  ["Wei", 11],
  ["Liam", 10],
];
const rnk = TIE.map((r) => TIE.filter((q) => (q[1] as number) > (r[1] as number)).length + 1);
const dense = TIE.map((r) => new Set(TIE.filter((q) => (q[1] as number) > (r[1] as number)).map((q) => q[1])).size + 1);
const D = table(v, {
  x: 90,
  y: 390,
  rowH: 54,
  size: 26,
  cols: [
    { key: "customer", w: 200 },
    { key: "orders", w: 130, align: "right" },
    { key: "ROW_NUMBER", w: 200, align: "center" },
    { key: "RANK", w: 150, align: "center" },
    { key: "DENSE_RANK", w: 200, align: "center" },
  ],
  rows: TIE.map((r) => [r[0], r[1], "", "", ""]),
});
const TIE_BG = "rgba(212,160,23,0.24)";
rows(
  v,
  D,
  [
    { t: 0, bg: TIE.map((r) => (r[1] === 11 ? TIE_BG : null)), dur: 0.01 },
    ...TIE.map((_, i) => ({ t: 34 + i * 0.25, set: [[i, 2, i + 1]] as [number, number, Val][], dur: 0.15 })),
    ...TIE.map((_, i) => ({ t: 36.4 + i * 0.25, set: [[i, 3, rnk[i]]] as [number, number, Val][], dur: 0.15 })),
    ...TIE.map((_, i) => ({ t: 38.6 + i * 0.25, set: [[i, 4, dense[i]]] as [number, number, Val][], dur: 0.15 })),
  ],
  [33.2, 41]
);
codePanel(v, { x: 90, y: 165, lines: ["ROW_NUMBER() OVER (ORDER BY orders DESC)", "RANK()       OVER (ORDER BY orders DESC)", "DENSE_RANK() OVER (ORDER BY orders DESC)"], size: 25, width: 900 }).at([{ t: 33, on: "all" }], [33.2, 41]);

v.ready();
