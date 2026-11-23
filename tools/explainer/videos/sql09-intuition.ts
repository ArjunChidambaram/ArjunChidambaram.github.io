import { createVideo } from "./engine";
import { table, rows, codePanel, shorts, type Val } from "./sqlkit";

const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: 48 });
const NOV = "rgba(43,140,190,0.20)";
const DEC = "rgba(5,206,145,0.22)";
const DUP = "rgba(226,72,61,0.16)";
const CH: Record<string, string> = { web: "rgba(43,140,190,0.20)", app: "rgba(5,206,145,0.22)", store: "rgba(212,160,23,0.26)" };

shorts(
  v,
  "UNION and PIVOT",
  "Stacking and reshaping results",
  "In one line",
  ["Set operations stack rows.", "Pivots turn rows into columns."],
  [
    [5, 13.8, "UNION ALL stacks one result on top of another."],
    [14, 21.8, "UNION does the same, then removes duplicate rows."],
    [22, 30.8, "INTERSECT: in both. EXCEPT: in the first, not the second."],
    [31, 41, "A pivot spreads one column's values across new columns."],
  ]
);

// Nov and Dec buyers
const NB = ["Ava", "Liam", "Noah", "Emma"];
const DB = ["Liam", "Noah", "Mia"];
const ALL: Val[][] = [...NB.map((n) => [n, "Nov"]), ...DB.map((n) => [n, "Dec"])];
const T = table(v, {
  x: 290,
  y: 360,
  rowH: 56,
  size: 27,
  cols: [
    { key: "customer", w: 300 },
    { key: "from", w: 260 },
  ],
  rows: ALL,
});
const isDup = ALL.map((r, i) => i >= NB.length && NB.includes(r[0] as string));
const inBoth = ALL.map((r) => NB.includes(r[0] as string) && DB.includes(r[0] as string));
const unionSlots = (() => {
  let k = 0;
  return ALL.map((_, i) => (isDup[i] ? null : k++));
})();
const both = (() => {
  let k = 0;
  return ALL.map((r, i) => (i < NB.length && inBoth[i] ? k++ : null));
})();
const nOnly = (() => {
  let k = 0;
  return ALL.map((r, i) => (i < NB.length && !DB.includes(r[0] as string) ? k++ : null));
})();
rows(
  v,
  T,
  [
    { t: 0, slot: ALL.map((_, i) => (i < NB.length ? i : null)), bg: ALL.map((_, i) => (i < NB.length ? NOV : DEC)), cols: [true, false], dur: 0.01 },
    { t: 7.5, slot: ALL.map((_, i) => i) },
    { t: 15.5, bg: ALL.map((_, i) => (isDup[i] ? DUP : i < NB.length ? NOV : DEC)) },
    { t: 18, slot: unionSlots },
    { t: 23.5, slot: both, bg: ALL.map(() => NOV) },
    { t: 27.5, slot: nOnly },
  ],
  [5.2, 30.8]
);
codePanel(v, { x: 90, y: 165, lines: ["SELECT customer FROM nov_buyers", "UNION ALL", "SELECT customer FROM dec_buyers;"], size: 26, width: 900 }).at([{ t: 5, on: [1] }], [5.2, 13.9]);
codePanel(v, { x: 90, y: 165, lines: ["SELECT customer FROM nov_buyers", "UNION", "SELECT customer FROM dec_buyers;"], size: 26, width: 900 }).at([{ t: 14, on: [1] }], [14, 21.9]);
codePanel(v, { x: 90, y: 165, lines: ["SELECT customer FROM nov_buyers", "INTERSECT", "SELECT customer FROM dec_buyers;"], size: 26, width: 900 }).at([{ t: 22, on: [1] }], [22, 26.9]);
codePanel(v, { x: 90, y: 165, lines: ["SELECT customer FROM nov_buyers", "EXCEPT", "SELECT customer FROM dec_buyers;"], size: 26, width: 900 }).at([{ t: 27, on: [1] }], [27, 30.8]);

v.life(v.text("{blue:blue} = November buyers, {green:green} = December buyers", { x: 540, y: 820 }, { size: 28, ax: 0.5 }), 6, 21.8, "fade");

// pivot
const LONG: Val[][] = [
  ["Nov", "web", 46],
  ["Nov", "app", 27],
  ["Nov", "store", 9],
  ["Dec", "web", 42],
  ["Dec", "app", 34],
  ["Dec", "store", 13],
];
const L = table(v, {
  x: 50,
  y: 380,
  rowH: 56,
  size: 25,
  title: "long",
  cols: [
    { key: "month", w: 110 },
    { key: "channel", w: 140 },
    { key: "orders", w: 120, align: "right" },
  ],
  rows: LONG,
});
rows(v, L, [{ t: 0, bg: LONG.map((r) => CH[r[1] as string]), dur: 0.01 }], [31.2, 41]);
const Wd = table(v, {
  x: 490,
  y: 380,
  rowH: 56,
  size: 25,
  title: "wide",
  cols: [
    { key: "month", w: 110 },
    { key: "web", w: 130, align: "right" },
    { key: "app", w: 130, align: "right" },
    { key: "store", w: 130, align: "right" },
  ],
  rows: [
    ["Nov", "", "", ""],
    ["Dec", "", "", ""],
  ],
});
const colOf: Record<string, number> = { web: 1, app: 2, store: 3 };
rows(
  v,
  Wd,
  LONG.map((r, i) => ({ t: 33.5 + i * 0.9, set: [[r[0] === "Nov" ? 0 : 1, colOf[r[1] as string], r[2]]] as [number, number, Val][], dur: 0.3 })),
  [32, 41]
);
codePanel(v, { x: 50, y: 150, lines: ["SELECT month,", "  COUNT(*) FILTER (WHERE channel = 'web')   AS web,", "  COUNT(*) FILTER (WHERE channel = 'app')   AS app,", "  COUNT(*) FILTER (WHERE channel = 'store') AS store", "FROM orders GROUP BY month;"], size: 22, width: 980 }).at([{ t: 31, on: [1, 2, 3] }], [31.2, 41]);

v.ready();
