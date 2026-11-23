import { createVideo } from "./engine";
import { table, rows, codePanel, connector, type Val } from "./sqlkit";

const DUR = 104;
const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: DUR });
const { C, W, text, life } = v;
const HL = "rgba(88,196,221,0.25)";
const MATCH = "rgba(131,193,103,0.28)";
const AMBER = "rgba(244,211,94,0.28)";
const NO = "rgba(252,98,85,0.24)";

v.centerTitle("How a LEFT JOIN Runs", 0.2, 7.6, 70, 60, 520);
life(text("The question: {green:every customer with each of their orders, including customers who never ordered}.", { x: W / 2, y: 330 }, { size: 36, ax: 0.5 }), 1.4, 7.6, "fade");
life(text("Watch the database match rows, one customer at a time.", { x: W / 2, y: 400 }, { size: 36, ax: 0.5, color: C.dim }), 3, 7.6, "fade");

const code = codePanel(v, {
  x: 60,
  y: 190,
  size: 27,
  width: 700,
  lines: ["SELECT c.first_name, o.order_id", "FROM customers AS c", "LEFT JOIN orders AS o", "  ON o.customer_id = c.customer_id;"],
});
code.at(
  [
    { t: 8, on: [1] },
    { t: 15, on: [2, 3] },
    { t: 40, on: "all" },
  ],
  [8.2, 49.6]
);

const CU: Val[][] = [
  [1, "Sophia"],
  [6, "Ethan"],
  [7, "Kenji"],
  [11, "Henry"],
];
const OR: Val[][] = [
  [1125, 6],
  [1127, 11],
  [1165, 11],
  [1190, 7],
  [1287, 6],
];
const A = table(v, {
  x: 60,
  y: 480,
  rowH: 54,
  size: 26,
  title: "customers  c",
  titleColor: C.blue,
  cols: [
    { key: "customer_id", w: 180 },
    { key: "first_name", w: 170 },
  ],
  rows: CU,
});
const B = table(v, {
  x: 930,
  y: 190,
  rowH: 50,
  size: 25,
  title: "orders  o",
  titleColor: C.blue,
  cols: [
    { key: "order_id", w: 150 },
    { key: "customer_id", w: 190 },
  ],
  rows: OR,
});
// walk through customers: each gets 5 seconds starting at 17
const T0 = 17;
const STEP = 5.2;
rows(
  v,
  A,
  CU.map((_, i) => ({ t: T0 + i * STEP, bg: CU.map((__, j) => (j === i ? HL : null)) })).concat([{ t: T0 + 4 * STEP, bg: CU.map(() => null) }]),
  [8.6, 49.6]
);
rows(
  v,
  B,
  CU.flatMap((c, i) => [
    { t: T0 + i * STEP + 1, bg: OR.map((o) => (o[1] === c[0] ? MATCH : null)) },
    { t: T0 + (i + 1) * STEP - 0.3, bg: OR.map(() => null) },
  ]),
  [15.2, 49.6]
);
const cy = (T: typeof A, i: number) => T.y + T.slotY(i) + T.rowH / 2;
CU.forEach((c, i) =>
  OR.forEach((o, j) => {
    if (o[1] === c[0]) connector(v, [A.x + A.width + 8, cy(A, i)], [B.x - 8, cy(B, j)], C.green, T0 + i * STEP + 1.2, T0 + (i + 1) * STEP - 0.3, 0.5, 3);
  })
);
// result rows appear as matches are found
const RES: { r: Val[]; t: number; nul: boolean }[] = [];
CU.forEach((c, i) => {
  const m = OR.filter((o) => o[1] === c[0]);
  if (!m.length) RES.push({ r: [c[1], null], t: T0 + i * STEP + 2.6, nul: true });
  m.forEach((o, k) => RES.push({ r: [c[1], o[0]], t: T0 + i * STEP + 2.2 + k * 0.7, nul: false }));
});
const RT = table(v, {
  x: 1400,
  y: 190,
  rowH: 50,
  size: 25,
  title: "result",
  titleColor: C.green,
  cols: [
    { key: "first_name", w: 200 },
    { key: "order_id", w: 160 },
  ],
  rows: RES.map((x) => x.r),
});
rows(
  v,
  RT,
  [
    { t: 0, slot: RES.map(() => null), dur: 0.01 },
    ...RES.map((x, i) => ({ t: x.t, slot: RES.map((_, j) => (RES[j].t <= x.t ? j : null)), bg: RES.map((y, j) => (RES[j].t <= x.t && y.nul ? AMBER : null)) })),
    { t: 42, bg: RES.map((y) => (y.nul ? NO : null)) },
    { t: 45, slot: RES.map((y, j) => (y.nul ? null : j - 1)) },
    { t: 48, slot: RES.map((_, j) => j), bg: RES.map((y) => (y.nul ? AMBER : null)) },
  ],
  [16, 49.6]
);

const L = (s: string, a: number, b: number, y: number, color?: string) => life(text(s, { x: 60, y }, { size: 28, width: 760, color }), a, b, "fade");
L("For each customer, find every order with the same customer_id.", 15.4, 39.6, 820);
L("{yellow:Sophia has no orders}: a LEFT JOIN still keeps her, with NULL for the order columns.", 26, 39.6, 890);
L("{red:INNER JOIN} would drop her: only matched rows survive.", 41.5, 47.6, 820);
L("{green:LEFT JOIN} keeps all rows of the left table.", 47.6, 49.6, 890);

// pitfall 1
v.centerTitle("Pitfall 1: WHERE Can Undo a LEFT JOIN", 50.2, 64.6, 70, 52, 700);
life(text("LEFT JOIN orders o ON o.customer_id = c.customer_id", { x: W / 2, y: 230 }, { size: 34, ax: 0.5, font: "'DejaVu Sans Mono',monospace" }), 51, 64.6, "fade");
life(text("WHERE o.order_date >= '2025-12-01'", { x: W / 2, y: 290 }, { size: 34, ax: 0.5, font: "'DejaVu Sans Mono',monospace", color: C.red }), 51.5, 64.6, "fade");
life(text("Customers with no December order have NULL dates, NULL >= ... is NULL, so WHERE drops them.", { x: W / 2, y: 390 }, { size: 32, ax: 0.5 }), 53, 64.6, "fade");
life(text("Result: {red:63 customers}, as if you'd written INNER JOIN.", { x: W / 2, y: 450 }, { size: 34, ax: 0.5 }), 55, 64.6, "fade");
life(text("ON o.customer_id = c.customer_id AND o.order_date >= '2025-12-01'", { x: W / 2, y: 580 }, { size: 34, ax: 0.5, font: "'DejaVu Sans Mono',monospace", color: C.green }), 57.5, 64.6, "fade");
life(text("Filter the right table in ON: all {green:150 customers} stay, with zero December orders where none exist.", { x: W / 2, y: 650 }, { size: 32, ax: 0.5 }), 59, 64.6, "fade");

// pitfall 2
v.centerTitle("Pitfall 2: Fan-out", 65.2, 79.6, 70, 52, 420);
life(text("One order has many line items. Join them and the order appears once {yellow:per item}.", { x: W / 2, y: 230 }, { size: 34, ax: 0.5 }), 66, 79.6, "fade");
life(text("420 orders  →  765 rows after JOIN order_items", { x: W / 2, y: 330 }, { size: 40, ax: 0.5, font: "'DejaVu Sans Mono',monospace" }), 67.5, 79.6, "fade");
life(text("COUNT(*) now counts items, not orders. Use COUNT(DISTINCT o.order_id).", { x: W / 2, y: 440 }, { size: 32, ax: 0.5 }), 69.5, 79.6, "fade");
life(text("Sums of order-level values (shipping fees, budgets) get multiplied.", { x: W / 2, y: 510 }, { size: 32, ax: 0.5, color: C.dim }), 71, 79.6, "fade");
life(text("And COUNT(DISTINCT) says {yellow:419}, not 420: one order has no items, and the INNER JOIN dropped it.", { x: W / 2, y: 640 }, { size: 32, ax: 0.5 }), 73.5, 79.6, "fade");
life(text("Before joining, know each table's grain: what one row represents.", { x: W / 2, y: 740 }, { size: 34, ax: 0.5, color: C.green }), 76, 79.6, "fade");

// types
v.centerTitle("The Join Family", 80.2, 95.6, 70, 52, 380);
const TYPES: [string, string][] = [
  ["INNER JOIN", "only rows with a match on both sides"],
  ["LEFT JOIN", "all left rows; NULLs where the right has no match"],
  ["RIGHT JOIN", "the mirror image: all right rows"],
  ["FULL OUTER JOIN", "all rows from both sides, matched where possible"],
  ["CROSS JOIN", "every left row paired with every right row"],
  ["self join", "a table joined to itself, e.g. employee to manager"],
  ["anti join", "LEFT JOIN ... WHERE right.key IS NULL: rows with no match"],
];
TYPES.forEach(([a, b], i) => {
  life(text(`{blue:${a}}`, { x: 300, y: 220 + i * 82 }, { size: 34, font: "'DejaVu Sans Mono',monospace" }), 81 + i * 0.6, 95.6, "fade");
  life(text(b, { x: 760, y: 222 + i * 82 }, { size: 32 }), 81.2 + i * 0.6, 95.6, "fade");
});

v.endCard(96.2, 103, [
  { text: "Match rows on keys. Know your grain. Filter the right table in ON.", size: 40, y: 260 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
