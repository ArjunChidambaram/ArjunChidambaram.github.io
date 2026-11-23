import { createVideo } from "./engine";
import { table, rows, codePanel, type Val } from "./sqlkit";

const DUR = 104;
const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: DUR });
const { C, W, text, life } = v;
const OK = "rgba(131,193,103,0.28)";
const NO = "rgba(252,98,85,0.24)";
const COL: Record<string, string> = { web: "rgba(88,196,221,0.22)", app: "rgba(131,193,103,0.24)", store: "rgba(244,211,94,0.24)" };

v.centerTitle("GROUP BY and HAVING, Step by Step", 0.2, 7.6, 70, 60, 700);
life(text("The question: {green:revenue per sales channel, ignoring cancelled orders,}", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 7.6, "fade");
life(text("{green:for channels with at least &#36;100}. Seven clauses, in run order.", { x: W / 2, y: 390 }, { size: 38, ax: 0.5 }), 1.8, 7.6, "fade");

const code = codePanel(v, {
  x: 60,
  y: 190,
  size: 26,
  width: 720,
  lines: ["SELECT channel,", "       COUNT(*)   AS orders,", "       SUM(value) AS revenue", "FROM order_totals", "WHERE status <> 'cancelled'", "GROUP BY channel", "HAVING SUM(value) >= 100", "ORDER BY revenue DESC;"],
});
code.at(
  [
    { t: 8, on: [3] },
    { t: 16, on: [4] },
    { t: 26, on: [5] },
    { t: 35, on: [0, 1, 2] },
    { t: 46, on: [6] },
    { t: 55, on: [7] },
    { t: 61, on: "all" },
  ],
  [8.2, 64.6]
);

const D: Val[][] = [
  [1001, "web", "completed", 3.49],
  [1002, "app", "cancelled", 16.99],
  [1003, "web", "completed", 62.48],
  [1004, "web", "completed", 28.47],
  [1005, "app", "returned", 99.39],
  [1006, "app", "completed", 9.99],
  [1007, "web", "cancelled", 138.99],
  [1021, "store", "returned", 59.99],
  [1027, "store", "completed", 59.96],
];
const ORDER = ["web", "app", "store"];
const keep = D.map((r) => r[2] !== "cancelled");
const ch = D.map((r) => r[1] as string);
const T = table(v, {
  x: 830,
  y: 190,
  rowH: 50,
  size: 24,
  title: "order_totals",
  titleColor: C.blue,
  cols: [
    { key: "order_id", w: 130 },
    { key: "channel", w: 120 },
    { key: "status", w: 160 },
    { key: "value", w: 130, align: "right" },
  ],
  rows: D.map((r) => [r[0], r[1], r[2], (r[3] as number).toFixed(2)]),
});
let k = 0;
const afterWhere = keep.map((b) => (b ? k++ : null));
const kept = D.map((_, i) => i).filter((i) => keep[i]);
const grouped = (() => {
  const idx = [...kept].sort((a, b) => ORDER.indexOf(ch[a]) - ORDER.indexOf(ch[b]) || a - b);
  return D.map((_, i) => (keep[i] ? idx.indexOf(i) : null));
})();
rows(
  v,
  T,
  [
    { t: 18, bg: keep.map((b) => (b ? OK : NO)) },
    { t: 21, dim: keep.map((b) => !b) },
    { t: 23.5, slot: afterWhere, dim: keep.map(() => false), bg: D.map(() => null) },
    { t: 27, bg: ch.map((c) => COL[c]) },
    { t: 29, slot: grouped, dur: 1.2 },
  ],
  [8.6, 64.6]
);

const agg = ORDER.map((c) => {
  const vs = D.filter((r, i) => keep[i] && r[1] === c).map((r) => r[3] as number);
  return { c, n: vs.length, sum: vs.reduce((a, b) => a + b, 0) };
});
const passes = agg.map((a) => a.sum >= 100);
const sortedIdx = agg.map((_, i) => i).filter((i) => passes[i]).sort((a, b) => agg[b].sum - agg[a].sum);
const RT = table(v, {
  x: 1430,
  y: 190,
  rowH: 50,
  size: 24,
  title: "result",
  titleColor: C.green,
  cols: [
    { key: "channel", w: 120 },
    { key: "orders", w: 110, align: "right" },
    { key: "revenue", w: 140, align: "right" },
  ],
  rows: agg.map((a) => [a.c, "", ""]),
});
rows(
  v,
  RT,
  [
    { t: 0, slot: [null, null, null], dur: 0.01 },
    ...agg.map((a, i) => ({
      t: 36.5 + i * 2,
      slot: agg.map((_, j) => (j <= i ? j : null)),
      bg: agg.map((b, j) => (j <= i ? COL[b.c] : null)),
      set: [
        [i, 1, a.n],
        [i, 2, a.sum.toFixed(2)],
      ] as [number, number, Val][],
    })),
    { t: 48, bg: agg.map((a, j) => (passes[j] ? COL[a.c] : NO)) },
    { t: 51, slot: agg.map((_, j) => (passes[j] ? passes.slice(0, j).filter(Boolean).length : null)) },
    { t: 56.5, slot: agg.map((_, j) => (passes[j] ? sortedIdx.indexOf(j) : null)), dur: 1.2 },
  ],
  [35.6, 64.6]
);

const L = (s: string, a: number, b: number, y: number, color?: string) => life(text(s, { x: 60, y }, { size: 28, width: 720, color }), a, b, "fade");
L("{blue:1. FROM}: every row of order_totals.", 8.6, 15.8, 650);
L("{blue:2. WHERE}: drop cancelled orders, row by row.", 16.4, 25.8, 650);
L("WHERE runs before grouping, so it sees individual rows.", 18.5, 25.8, 710, C.dim);
L("{blue:3. GROUP BY}: gather rows with the same channel.", 26.4, 34.8, 650);
L("{blue:4. SELECT}: one output row per group.", 35.4, 45.8, 650);
L("COUNT(*) and SUM(value) summarize each group's rows.", 37.5, 45.8, 710, C.dim);
L("{blue:5. HAVING}: drop groups that fail, here web (&#36;94.44).", 46.4, 54.8, 650);
L("HAVING runs after grouping, so it can test aggregates.", 48.5, 54.8, 710, C.dim);
L("{blue:6. ORDER BY}: sort the surviving groups.", 55.4, 64.6, 650);

// run order
v.centerTitle("The Full Run Order", 65.2, 78.6, 70, 52, 420);
["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY", "LIMIT"].forEach((s, i) =>
  life(text(`{green:${s}}`, { x: 190 + i * 257, y: 290 }, { size: 38, ax: 0.5, font: "'DejaVu Sans Mono',monospace" }), 66 + i * 0.35, 78.6, "fade")
);
life(text("WHERE filters {blue:rows} (before grouping). HAVING filters {blue:groups} (after).", { x: W / 2, y: 450 }, { size: 36, ax: 0.5 }), 69, 78.6, "fade");
life(text("So WHERE COUNT(*) >= 8 is an error: the counts don't exist yet when WHERE runs.", { x: W / 2, y: 530 }, { size: 32, ax: 0.5, color: C.dim }), 71, 78.6, "fade");
life(text("Put plain row conditions in WHERE: it shrinks the data before the expensive grouping.", { x: W / 2, y: 650 }, { size: 32, ax: 0.5 }), 73.5, 78.6, "fade");

// the grouping rule
v.centerTitle("The Golden Rule of GROUP BY", 79.2, 94.6, 70, 52, 560);
life(text("Every column in SELECT must be {green:grouped} or {green:aggregated}.", { x: W / 2, y: 250 }, { size: 40, ax: 0.5 }), 80, 94.6, "fade");
life(text("SELECT customer_id, order_date, COUNT(*) ... GROUP BY customer_id", { x: W / 2, y: 370 }, { size: 32, ax: 0.5, font: "'DejaVu Sans Mono',monospace", color: C.red }), 82, 94.6, "fade");
life(text("A customer has many order dates. Which one should the single output row show?", { x: W / 2, y: 450 }, { size: 32, ax: 0.5, color: C.dim }), 83.5, 94.6, "fade");
life(text("Pick one explicitly: MAX(order_date), MIN(order_date), or add it to GROUP BY.", { x: W / 2, y: 530 }, { size: 32, ax: 0.5 }), 85.5, 94.6, "fade");
life(text("Aggregates skip NULLs: COUNT(email) counts filled-in emails; COUNT(*) counts rows.", { x: W / 2, y: 680 }, { size: 32, ax: 0.5 }), 88, 94.6, "fade");
life(text("And groups with no rows don't exist: days without orders won't appear as 0.", { x: W / 2, y: 750 }, { size: 32, ax: 0.5, color: C.dim }), 90, 94.6, "fade");

v.endCard(95.2, 103, [
  { text: "WHERE picks rows, GROUP BY makes groups, HAVING picks groups.", size: 42, y: 260 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
