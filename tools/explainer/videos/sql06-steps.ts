import { createVideo } from "./engine";
import { table, rows, codePanel, type Val } from "./sqlkit";

const DUR = 100;
const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: DUR });
const { C, W, text, life } = v;
const SEG: Record<string, string> = { business: "rgba(88,196,221,0.20)", consumer: "rgba(131,193,103,0.20)" };
const HL = "rgba(244,211,94,0.30)";

v.centerTitle("How a Window Function Runs", 0.2, 7.6, 70, 60, 600);
life(text("The question: {green:rank customers by order count, separately for each segment}.", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 7.6, "fade");
life(text("Three steps: partition, order, then compute for each row.", { x: W / 2, y: 400 }, { size: 36, ax: 0.5, color: C.dim }), 3, 7.6, "fade");

const code = codePanel(v, {
  x: 60,
  y: 190,
  size: 25,
  width: 740,
  lines: ["SELECT first_name, segment, orders,", "  ROW_NUMBER() OVER w AS row_number,", "  RANK()       OVER w AS rank,", "  DENSE_RANK() OVER w AS dense_rank", "FROM customer_orders", "WINDOW w AS (PARTITION BY segment", "             ORDER BY orders DESC);"],
});
code.at(
  [
    { t: 8, on: [4] },
    { t: 15, on: [5] },
    { t: 23, on: [6] },
    { t: 31, on: [1] },
    { t: 37, on: [2] },
    { t: 43, on: [3] },
    { t: 50, on: "all" },
  ],
  [8.2, 55.6]
);

const D: Val[][] = [
  ["Sofia", "business", 19],
  ["Noah", "consumer", 18],
  ["Kenji", "consumer", 15],
  ["Liam", "business", 13],
  ["Elijah", "business", 11],
  ["Sofia", "consumer", 11],
  ["Wei", "business", 11],
  ["Liam", "consumer", 10],
  ["Zoe", "consumer", 9],
];
const seg = D.map((r) => r[1] as string);
const n = D.map((r) => r[2] as number);
const ORDER = ["business", "consumer"];
const sorted = D.map((_, i) => i).sort((a, b) => ORDER.indexOf(seg[a]) - ORDER.indexOf(seg[b]) || n[b] - n[a] || a - b);
const slot = D.map((_, i) => sorted.indexOf(i));
const part = (i: number) => sorted.filter((j) => seg[j] === seg[i]);
const rowNum = D.map((_, i) => part(i).indexOf(i) + 1);
const rnk = D.map((_, i) => part(i).filter((j) => n[j] > n[i]).length + 1);
const dense = D.map((_, i) => new Set(part(i).filter((j) => n[j] > n[i]).map((j) => n[j])).size + 1);
const T = table(v, {
  x: 860,
  y: 190,
  rowH: 54,
  size: 25,
  title: "customer_orders",
  titleColor: C.blue,
  cols: [
    { key: "first_name", w: 170 },
    { key: "segment", w: 160 },
    { key: "orders", w: 110, align: "right" },
    { key: "row_number", w: 170, align: "center" },
    { key: "rank", w: 110, align: "center" },
    { key: "dense_rank", w: 170, align: "center" },
  ],
  rows: D.map((r) => [r[0], r[1], r[2], "", "", ""]),
});
const fillCol = (col: number, vals: number[], t0: number) => sorted.map((i, k) => ({ t: t0 + k * 0.45, set: [[i, col, vals[i]]] as [number, number, Val][], bg: D.map((_, j) => (j === i ? HL : SEG[seg[j]])), dur: 0.2 }));
rows(
  v,
  T,
  [
    { t: 0, cols: [true, true, true, false, false, false], dur: 0.01 },
    { t: 16.5, bg: seg.map((s) => SEG[s]) },
    { t: 24.5, slot, dur: 1.4 },
    { t: 31.2, cols: [true, true, true, true, false, false] },
    ...fillCol(3, rowNum, 31.8),
    { t: 37.2, cols: [true, true, true, true, true, false] },
    ...fillCol(4, rnk, 37.6),
    { t: 43.2, cols: [true, true, true, true, true, true] },
    ...fillCol(5, dense, 43.6),
    { t: 48, bg: seg.map((s) => SEG[s]) },
  ],
  [8.6, 55.6]
);

const L = (s: string, a: number, b: number, y: number, color?: string) => life(text(s, { x: 60, y }, { size: 28, width: 760, color }), a, b, "fade");
L("{blue:1.} The window function sees the rows {blue:after} FROM, WHERE, GROUP BY and HAVING.", 8.6, 14.8, 620);
L("{blue:2. PARTITION BY} splits rows into independent groups. Nothing collapses.", 15.4, 22.8, 620);
L("{blue:3. ORDER BY} (inside OVER) orders rows within each partition.", 23.4, 30.8, 620);
L("{blue:4.} Each row gets a value computed from its partition.", 31.4, 55.6, 620);
L("ROW_NUMBER: 1, 2, 3, … always distinct. Ties get an {yellow:arbitrary} order.", 32, 36.8, 700, C.dim);
L("RANK: Elijah and Wei tie at 3. A next row would get 5: ties {yellow:skip} ranks.", 38, 42.8, 700, C.dim);
L("DENSE_RANK: ties also share 3, but the next would get 4: {yellow:no gaps}.", 44, 49.6, 700, C.dim);
L("Every input row is still here: windows add columns, never remove rows.", 50, 55.6, 700, C.green);

// order of execution
v.centerTitle("Where Windows Run", 56.2, 69.6, 70, 52, 420);
["FROM", "WHERE", "GROUP BY", "HAVING", "WINDOW", "SELECT", "ORDER BY", "LIMIT"].forEach((s, i) =>
  life(text(`{${s === "WINDOW" ? "yellow" : "green"}:${s}}`, { x: 170 + i * 226, y: 270 }, { size: 34, ax: 0.5, font: "'DejaVu Sans Mono',monospace" }), 57 + i * 0.3, 69.6, "fade")
);
life(text("Windows are computed after WHERE, so {red:WHERE rn <= 2} is an error: rn doesn't exist yet.", { x: W / 2, y: 430 }, { size: 34, ax: 0.5 }), 60, 69.6, "fade");
life(text("Filter on a window in an outer query (CTE), or with {green:QUALIFY} where it exists", { x: W / 2, y: 510 }, { size: 34, ax: 0.5 }), 62.5, 69.6, "fade");
life(text("(DuckDB, Snowflake, BigQuery, Databricks): QUALIFY is to windows what HAVING is to GROUP BY.", { x: W / 2, y: 565 }, { size: 32, ax: 0.5, color: C.dim }), 63, 69.6, "fade");
life(text("They run after GROUP BY too, so you can rank groups: RANK() OVER (ORDER BY SUM(revenue) DESC).", { x: W / 2, y: 680 }, { size: 32, ax: 0.5 }), 65.5, 69.6, "fade");

// patterns
v.centerTitle("Three Patterns You'll Use Constantly", 70.2, 91.6, 70, 52, 620);
const PAT: [string, string, string][] = [
  ["Top N per group", "ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) <= 2", "the 2 priciest products in every category"],
  ["Latest row per key", "ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) = 1", "each customer's most recent order; also how you dedupe"],
  ["Share of a total", "price / SUM(price) OVER ()", "an empty OVER () makes the whole result one window"],
];
PAT.forEach(([a, b, c], i) => {
  life(text(`{blue:${a}}`, { x: 140, y: 220 + i * 190 }, { size: 36 }), 71 + i * 2, 91.6, "fade");
  life(text(b, { x: 140, y: 272 + i * 190 }, { size: 27, font: "'DejaVu Sans Mono',monospace" }), 71.4 + i * 2, 91.6, "fade");
  life(text(c, { x: 140, y: 320 + i * 190 }, { size: 28, color: C.dim }), 71.8 + i * 2, 91.6, "fade");
});
life(text("Add a unique tie-breaker to ORDER BY when you need ROW_NUMBER to be repeatable.", { x: W / 2, y: 820 }, { size: 32, ax: 0.5, color: C.yellow }), 79, 91.6, "fade");

v.endCard(92.2, 99.6, [
  { text: "PARTITION BY groups, ORDER BY orders, and every row stays.", size: 42, y: 260 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
