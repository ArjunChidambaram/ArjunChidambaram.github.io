import { createVideo } from "./engine";
import { table, rows, codePanel, type Val, type RowKey } from "./sqlkit";

const DUR = 100;
const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: DUR });
const { C, W, text, life } = v;
const CH: Record<string, string> = { web: "rgba(88,196,221,0.22)", app: "rgba(131,193,103,0.24)", store: "rgba(244,211,94,0.24)" };
const MON: Record<string, string> = { Nov: "rgba(199,125,255,0.18)", Dec: "rgba(224,122,159,0.18)" };

v.centerTitle("Pivoting with Conditional Aggregation", 0.2, 7.6, 70, 60, 760);
life(text("The question: {green:orders per month, with one column per channel}.", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 7.6, "fade");
life(text("Every database can do it with GROUP BY and a condition inside the aggregate.", { x: W / 2, y: 400 }, { size: 36, ax: 0.5, color: C.dim }), 3, 7.6, "fade");

const code = codePanel(v, {
  x: 60,
  y: 190,
  size: 22,
  width: 880,
  lines: ["SELECT month,", "  SUM(CASE WHEN channel = 'web'   THEN 1 ELSE 0 END) AS web,", "  SUM(CASE WHEN channel = 'app'   THEN 1 ELSE 0 END) AS app,", "  SUM(CASE WHEN channel = 'store' THEN 1 ELSE 0 END) AS store", "FROM orders", "GROUP BY month;"],
});
code.at(
  [
    { t: 8, on: [4] },
    { t: 14, on: [1, 2, 3] },
    { t: 34, on: [5, 0] },
    { t: 44, on: "all" },
  ],
  [8.2, 49.6]
);

const O: Val[][] = [
  [1301, "Nov", "web"],
  [1302, "Nov", "app"],
  [1303, "Nov", "web"],
  [1304, "Nov", "store"],
  [1305, "Dec", "app"],
  [1306, "Dec", "web"],
  [1307, "Dec", "app"],
  [1308, "Dec", "app"],
];
const T = table(v, {
  x: 1010,
  y: 190,
  rowH: 52,
  size: 25,
  title: "orders",
  titleColor: C.blue,
  cols: [
    { key: "order_id", w: 130 },
    { key: "month", w: 110 },
    { key: "channel", w: 130 },
    { key: "web?", w: 110, align: "center" },
    { key: "app?", w: 110, align: "center" },
    { key: "store?", w: 120, align: "center" },
  ],
  rows: O.map((r) => [...r, "", "", ""]),
});
const k: RowKey[] = [{ t: 0, cols: [true, true, true, false, false, false], dur: 0.01 }];
k.push({ t: 14.5, cols: [true, true, true, true, true, true], bg: O.map((r) => CH[r[2] as string]) });
O.forEach((r, i) => k.push({ t: 16 + i * 1.6, set: ["web", "app", "store"].map((c, j) => [i, 3 + j, r[2] === c ? 1 : 0] as [number, number, Val]), dur: 0.3 }));
k.push({ t: 35, bg: O.map((r) => MON[r[1] as string]) });
rows(v, T, k, [8.6, 49.6]);

const sums = ["Nov", "Dec"].map((m) => ["web", "app", "store"].map((c) => O.filter((r) => r[1] === m && r[2] === c).length));
const RT = table(v, {
  x: 1240,
  y: 720,
  rowH: 52,
  size: 25,
  title: "result",
  titleColor: C.green,
  cols: [
    { key: "month", w: 120 },
    { key: "web", w: 110, align: "right" },
    { key: "app", w: 110, align: "right" },
    { key: "store", w: 120, align: "right" },
  ],
  rows: [
    ["Nov", "", "", ""],
    ["Dec", "", "", ""],
  ],
});
rows(
  v,
  RT,
  [
    { t: 0, slot: [null, null], dur: 0.01 },
    { t: 37, slot: [0, null], bg: [MON.Nov, null], set: sums[0].map((s, j) => [0, 1 + j, s] as [number, number, Val]) },
    { t: 40, slot: [0, 1], bg: [MON.Nov, MON.Dec], set: sums[1].map((s, j) => [1, 1 + j, s] as [number, number, Val]) },
  ],
  [36.4, 49.6]
);
const L = (s: string, a: number, b: number, y: number, color?: string) => life(text(s, { x: 60, y }, { size: 28, width: 840, color }), a, b, "fade");
L("{blue:1.} Each CASE turns a row into a 1 or a 0: is this order from that channel?", 15, 33.6, 560);
L("Every row gets exactly one 1, in its channel's column.", 22, 33.6, 640, C.dim);
L("{blue:2.} GROUP BY month, then SUM each column: counting the 1s.", 34.6, 49.6, 560);
L("Rows became columns. That's a {green:pivot}.", 41, 49.6, 640, C.green);
L("COUNT(*) FILTER (WHERE channel = 'web') says the same thing more briefly.", 44, 49.6, 720, C.dim);

// pivot keyword / unpivot
v.centerTitle("PIVOT, UNPIVOT and Their Limits", 50.2, 66.6, 70, 52, 600);
life(text("PIVOT orders ON channel USING COUNT(*) GROUP BY month", { x: W / 2, y: 230 }, { size: 34, ax: 0.5, font: "'DejaVu Sans Mono',monospace" }), 51, 66.6, "fade");
life(text("Shorter, and the columns come from the data. Syntax differs by database (DuckDB, Snowflake,", { x: W / 2, y: 300 }, { size: 32, ax: 0.5, color: C.dim }), 52, 66.6, "fade");
life(text("SQL Server, Oracle, BigQuery each have their own); PostgreSQL and MySQL have none.", { x: W / 2, y: 345 }, { size: 32, ax: 0.5, color: C.dim }), 52.2, 66.6, "fade");
life(text("UNPIVOT goes the other way: columns back into rows, the {yellow:long} format", { x: W / 2, y: 470 }, { size: 34, ax: 0.5 }), 55, 66.6, "fade");
life(text("most charting and modeling tools prefer. UNION ALL of one SELECT per column works everywhere.", { x: W / 2, y: 520 }, { size: 34, ax: 0.5 }), 55.2, 66.6, "fade");
life(text("A SQL result has fixed columns: a new channel means editing the query (or PIVOT in DuckDB/Snowflake).", { x: W / 2, y: 650 }, { size: 30, ax: 0.5, color: C.yellow }), 58.5, 66.6, "fade");

// set operations
v.centerTitle("Set Operations: Rules", 67.2, 92.6, 70, 52, 440);
const RULES: [string, string][] = [
  ["UNION ALL", "stack results, keep every row (fast)"],
  ["UNION", "stack, then remove duplicates (sorts or hashes: slower)"],
  ["INTERSECT", "rows that appear in both results"],
  ["EXCEPT", "rows in the first result but not the second (MINUS in Oracle)"],
];
RULES.forEach(([a, b], i) => {
  life(text(`{blue:${a}}`, { x: 260, y: 220 + i * 80 }, { size: 34, font: "'DejaVu Sans Mono',monospace" }), 68 + i * 0.6, 92.6, "fade");
  life(text(b, { x: 620, y: 222 + i * 80 }, { size: 32 }), 68.2 + i * 0.6, 92.6, "fade");
});
life(text("Same number of columns, compatible types, matched {yellow:by position} (not by name).", { x: W / 2, y: 600 }, { size: 34, ax: 0.5 }), 72, 92.6, "fade");
life(text("Column names come from the first SELECT. ORDER BY applies to the whole combined result.", { x: W / 2, y: 670 }, { size: 32, ax: 0.5, color: C.dim }), 74, 92.6, "fade");
life(text("Unlike =, set operations treat NULLs as equal to each other.", { x: W / 2, y: 740 }, { size: 32, ax: 0.5, color: C.dim }), 76, 92.6, "fade");
life(text("Default to UNION ALL unless you actually need duplicates removed.", { x: W / 2, y: 840 }, { size: 34, ax: 0.5, color: C.green }), 78, 92.6, "fade");

v.endCard(93.2, 99.6, [
  { text: "Stack with UNION ALL. Pivot with a condition inside the aggregate.", size: 40, y: 260 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
