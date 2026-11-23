import { createVideo } from "./engine";
import { table, rows, codePanel, shorts, type Val } from "./sqlkit";

const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: 48 });
const COL: Record<string, string> = { web: "rgba(43,140,190,0.20)", app: "rgba(5,206,145,0.22)", store: "rgba(212,160,23,0.26)" };
const RED = "rgba(226,72,61,0.18)";

shorts(
  v,
  "GROUP BY",
  "Many rows in, one row per group out",
  "GROUP BY in one line",
  ["Sort rows into groups,", "then summarize each group."],
  [
    [5, 12.8, "Nine orders, each from one sales channel."],
    [13, 21.8, "GROUP BY channel puts rows with the same channel together."],
    [22, 31.8, "Each group collapses to one row: count it, sum it, average it, find its max."],
    [32, 41, "HAVING filters the groups, after they're summarized."],
  ]
);

const D: Val[][] = [
  [1001, "web", 3.49],
  [1002, "app", 16.99],
  [1003, "web", 62.48],
  [1004, "web", 28.47],
  [1005, "app", 99.39],
  [1006, "app", 9.99],
  [1007, "web", 138.99],
  [1021, "store", 59.99],
  [1027, "store", 59.96],
];
const ORDER = ["web", "app", "store"];
const ch = D.map((r) => r[1] as string);
const grouped = (() => {
  const idx = D.map((_, i) => i).sort((a, b) => ORDER.indexOf(ch[a]) - ORDER.indexOf(ch[b]) || a - b);
  const s: number[] = [];
  idx.forEach((i, k) => (s[i] = k));
  return s;
})();
const T = table(v, {
  x: 60,
  y: 385,
  rowH: 50,
  size: 25,
  title: "orders",
  cols: [
    { key: "order_id", w: 150 },
    { key: "channel", w: 140 },
    { key: "value", w: 150, align: "right" },
  ],
  rows: D.map((r) => [r[0], r[1], (r[2] as number).toFixed(2)]),
});
rows(
  v,
  T,
  [
    { t: 14, bg: ch.map((c) => COL[c]) },
    { t: 16, slot: grouped, dur: 1.2 },
  ],
  [5.2, 41]
);

const agg = ORDER.map((c) => {
  const vs = D.filter((r) => r[1] === c).map((r) => r[2] as number);
  return { c, n: vs.length, sum: vs.reduce((a, b) => a + b, 0) };
});
const RT = table(v, {
  x: 560,
  y: 385,
  rowH: 50,
  size: 25,
  title: "result",
  cols: [
    { key: "channel", w: 130 },
    { key: "COUNT(*)", w: 140, align: "right" },
    { key: "SUM(value)", w: 180, align: "right" },
  ],
  rows: agg.map((a) => [a.c, "", ""]),
});
rows(
  v,
  RT,
  [
    { t: 0, slot: [null, null, null], dur: 0.01 },
    ...agg.map((a, i) => ({
      t: 23 + i * 1.6,
      slot: agg.map((_, j) => (j <= i ? j : null)),
      bg: agg.map((b, j) => (j <= i ? COL[b.c] : null)),
      set: [
        [i, 1, a.n],
        [i, 2, a.sum.toFixed(2)],
      ] as [number, number, Val][],
    })),
    { t: 34, bg: agg.map((a) => (a.n >= 3 ? COL[a.c] : RED)) },
    { t: 36.5, slot: agg.map((a, j) => (a.n >= 3 ? j : null)) },
  ],
  [22.2, 41]
);

codePanel(v, { x: 60, y: 160, lines: ["SELECT *", "FROM orders;"], size: 25, width: 960 }).at([{ t: 5, on: "all" }], [5.2, 12.9]);
codePanel(v, { x: 60, y: 160, lines: ["SELECT channel, COUNT(*), SUM(value)", "FROM orders", "GROUP BY channel;"], size: 25, width: 960 }).at(
  [
    { t: 13, on: [2] },
    { t: 22, on: [0] },
  ],
  [13, 31.9]
);
codePanel(v, { x: 60, y: 160, lines: ["SELECT channel, COUNT(*), SUM(value)", "FROM orders", "GROUP BY channel", "HAVING COUNT(*) >= 3;"], size: 25, width: 960 }).at([{ t: 32, on: [3] }], [32, 41]);

v.ready();
