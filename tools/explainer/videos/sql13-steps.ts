import { createVideo, span } from "./engine";
import { codePanel } from "./sqlkit";

const DUR = 100;
const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: DUR });
const { C, W, text, life, s, set, frame } = v;

v.centerTitle("Reading a Query Plan", 0.2, 7.6, 70, 60, 520);
life(text("SQL says {green:what} you want. The plan is {yellow:how} the database will get it.", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 7.6, "fade");
life(text("EXPLAIN shows the plan. EXPLAIN ANALYZE runs it and adds real row counts and times.", { x: W / 2, y: 400 }, { size: 34, ax: 0.5, color: C.dim }), 3, 7.6, "fade");

function box(x: number, y: number, w: number, label: string, lines: string[], a: number, b: number, color: string) {
  const h = 64 + lines.length * 36;
  const r = s("rect", { x, y, width: w, height: h, rx: 10, fill: "#0f172a", stroke: color, "stroke-width": 3, opacity: 0 });
  frame((t) => set(r, { opacity: span(t, a, b, 0.4) }));
  life(text(label, { x: x + w / 2, y: y + 14 }, { size: 28, ax: 0.5, color, font: "'DejaVu Sans Mono',monospace" }), a, b, "fade", 0.4);
  lines.forEach((l, i) => life(text(l, { x: x + w / 2, y: y + 60 + i * 36 }, { size: 22, ax: 0.5, color: C.ink, font: "'DejaVu Sans Mono',monospace" }), a + 0.1, b, "fade", 0.4));
  return { x, y, w, h };
}
function edge(x1: number, y1: number, x2: number, y2: number, a: number, b: number) {
  const l = s("line", { x1, y1, x2, y2, stroke: "#64748B", "stroke-width": 3, opacity: 0 });
  frame((t) => set(l, { opacity: span(t, a, b, 0.4) }));
}

const E = 49.6;
const code = codePanel(v, {
  x: 50,
  y: 160,
  size: 22,
  width: 760,
  lines: ["EXPLAIN ANALYZE", "SELECT c.state, COUNT(*) AS orders", "FROM orders o", "JOIN customers c", "  ON c.customer_id = o.customer_id", "WHERE o.order_date >= DATE '2025-12-01'", "GROUP BY c.state;"],
});
code.at(
  [
    { t: 8, on: "all" },
    { t: 11, on: [2, 5] },
    { t: 19, on: [3, 4] },
    { t: 27, on: [1, 6] },
    { t: 36, on: [0] },
  ],
  [8.2, E]
);

const s1 = box(900, 700, 440, "SEQ_SCAN orders", ["Projections: customer_id", "Filters: order_date >= ...", "89 rows"], 10.5, E, C.blue);
const s2 = box(1400, 700, 440, "SEQ_SCAN customers", ["Projections: customer_id,", "             state", "150 rows"], 12.5, E, C.blue);
const j = box(1150, 470, 440, "HASH_JOIN", ["customer_id = customer_id", "89 rows"], 19.5, E, C.green);
edge(s1.x + s1.w / 2, s1.y, j.x + j.w / 2, j.y + j.h, 19.4, E);
edge(s2.x + s2.w / 2, s2.y, j.x + j.w / 2, j.y + j.h, 19.4, E);
const g = box(1150, 260, 440, "HASH_GROUP_BY", ["Groups: state", "12 rows"], 27.5, E, C.yellow);
edge(j.x + j.w / 2, j.y, g.x + g.w / 2, g.y + g.h, 27.4, E);

const L = (str: string, a: number, b: number, y: number, color?: string) => life(text(str, { x: 50, y }, { size: 27, width: 800, color }), a, b, "fade");
L("{blue:Scans first.} Each table is read once. Only the columns the", 11, 18.6, 560);
L("query uses are read (Projections), and the date filter", 11.1, 18.6, 605);
L("runs inside the scan (Filters): 420 orders become 89.", 11.2, 18.6, 650);
L("{green:HASH_JOIN} builds a hash table from one side, then", 20, 26.6, 560);
L("probes it with each row of the other. Linear time,", 20.1, 26.6, 605);
L("no sorting. The smaller input should be the build side.", 20.2, 26.6, 650, C.dim);
L("{yellow:HASH_GROUP_BY} hashes each row's state into a bucket", 28, 35.6, 560);
L("and counts. 89 rows in, 12 groups out.", 28.1, 35.6, 605);
L("Read the plan {blue:bottom-up}: data flows from the leaves.", 36.4, E, 560);
L("EXPLAIN shows estimates (~84 rows). EXPLAIN ANALYZE shows", 37.5, E, 605);
L("the actual counts and the time spent in each operator.", 37.6, E, 650);
L("Look for: big row counts early, estimates far from actuals,", 41, E, 720, C.yellow);
L("and operators that take most of the time.", 41.1, E, 765, C.yellow);

// indexes
v.centerTitle("Indexes", 50.2, 71.6, 70, 52, 280);
const tree = [
  [960, 210, "40 | 80"],
  [600, 380, "10 | 20 | 30"],
  [960, 380, "50 | 60 | 70"],
  [1320, 380, "90 | 95 | 99"],
];
tree.forEach(([x, y, lbl], i) => {
  const r = s("rect", { x: (x as number) - 140, y: y as number, width: 280, height: 70, rx: 8, fill: "#0f172a", stroke: i === 0 || i === 2 ? C.green : "#475569", "stroke-width": 3, opacity: 0 });
  frame((t) => set(r, { opacity: span(t, 51 + i * 0.4, 71.6, 0.4), stroke: t > 54.5 && (i === 0 || i === 2) ? C.green : "#475569" }));
  life(text(lbl as string, { x: x as number, y: (y as number) + 18 }, { size: 28, ax: 0.5, font: "'DejaVu Sans Mono',monospace" }), 51 + i * 0.4, 71.6, "fade");
  if (i > 0) edge(960, 280, x as number, 380, 52 + i * 0.3, 71.6);
});
life(text("Find 60: root says 40 < 60 < 80, go to the middle child; it's there. 2 steps, not 1,000,000.", { x: W / 2, y: 520 }, { size: 30, ax: 0.5, color: C.green }), 54.5, 71.6, "fade");
const IX: [string, string][] = [
  ["B-tree", "the default index in PostgreSQL, MySQL, SQL Server, Oracle, SQLite"],
  ["Helps", "selective lookups (WHERE id = ?), joins on the key, ORDER BY ... LIMIT"],
  ["Costs", "every INSERT/UPDATE must also update the index, plus disk space"],
  ["Composite", "(state, city) helps WHERE state = ? and state = ? AND city = ?, not city alone"],
  ["Columnar", "DuckDB, BigQuery, Snowflake mostly skip blocks by min/max instead"],
];
IX.forEach(([a, b], i) => {
  life(text(`{blue:${a}}`, { x: 160, y: 600 + i * 66 }, { size: 30 }), 57 + i * 1, 71.6, "fade");
  life(text(b, { x: 430, y: 602 + i * 66 }, { size: 28 }), 57.2 + i * 1, 71.6, "fade");
});

// checklist
v.centerTitle("A Performance Checklist", 72.2, 92.6, 70, 52, 460);
const CK: [string, string][] = [
  ["Filter on raw columns", "sale_date >= '2025-06-01', not month(sale_date) = 6"],
  ["Select what you need", "columnar engines read only the columns you name"],
  ["Aggregate, then join", "avoid many-to-many fan-out that multiplies rows"],
  ["Filter early", "fewer rows into every join, sort and window"],
  ["Use EXISTS for existence", "a semi join stops at the first match"],
  ["Approximate when it's fine", "APPROX_COUNT_DISTINCT is far cheaper than exact"],
  ["Measure", "EXPLAIN ANALYZE before and after; trust timings, not folklore"],
];
CK.forEach(([a, b], i) => {
  life(text(`{green:${a}}`, { x: 140, y: 180 + i * 92 }, { size: 32 }), 73 + i * 1.2, 92.6, "fade");
  life(text(b, { x: 680, y: 183 + i * 92 }, { size: 29 }), 73.2 + i * 1.2, 92.6, "fade");
});

v.endCard(93.2, 99.6, [
  { text: "Read the plan. Skip work instead of doing it faster.", size: 42, y: 260 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
