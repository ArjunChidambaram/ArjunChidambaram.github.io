import { createVideo } from "./engine";
import { table, rows, codePanel, shorts, connector, type Val } from "./sqlkit";

const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: 48 });
const AMBER = "rgba(212,160,23,0.30)";
const LINE = "#2B8CBE";
const PAIR = ["rgba(43,140,190,0.16)", "rgba(5,206,145,0.18)", "rgba(155,89,208,0.16)", "rgba(232,119,46,0.16)"];

shorts(
  v,
  "JOINs",
  "Putting tables side by side",
  "JOINs in one line",
  ["Match rows on a shared key.", "LEFT JOIN keeps the unmatched."],
  [
    [5, 13.8, "Orders only store a customer_id. Names live in customers."],
    [14, 23.8, "A JOIN matches each order to the customer with the same id."],
    [24, 32.8, "INNER JOIN keeps only matches. Sophia has no orders: gone."],
    [33, 41, "LEFT JOIN keeps every customer. No match means NULLs."],
  ]
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
const cIdx = (id: Val) => CU.findIndex((c) => c[0] === id);
const A = table(v, {
  x: 90,
  y: 380,
  rowH: 56,
  size: 27,
  title: "customers",
  cols: [
    { key: "customer_id", w: 180 },
    { key: "first_name", w: 170 },
  ],
  rows: CU,
});
const B = table(v, {
  x: 620,
  y: 380,
  rowH: 56,
  size: 27,
  title: "orders",
  cols: [
    { key: "order_id", w: 150 },
    { key: "customer_id", w: 200 },
  ],
  rows: OR,
});
rows(v, A, [{ t: 15, bg: CU.map((_, i) => (i === 0 ? null : PAIR[i])) }], [5.2, 23.6]);
rows(v, B, [{ t: 15, bg: OR.map((o) => PAIR[cIdx(o[1])]) }], [5.2, 23.6]);
// connectors from each order to its customer
const cy = (T: typeof A, i: number) => T.y + T.slotY(i) + T.rowH / 2;
OR.forEach((o, j) => connector(v, [B.x - 6, cy(B, j)], [A.x + A.width + 6, cy(A, cIdx(o[1]))], LINE, 15.5 + j * 0.6, 23.6, 0.5, 3));
codePanel(v, { x: 90, y: 170, lines: ["SELECT * FROM customers;", "SELECT * FROM orders;"], size: 27, width: 900 }).at([{ t: 5, on: "all" }], [5.2, 13.9]);
codePanel(v, { x: 90, y: 170, lines: ["-- match rows where the ids are equal", "ON orders.customer_id = customers.customer_id"], size: 25, width: 900 }).at([{ t: 14, on: [1] }], [14, 23.6]);

// inner join result
const INNER: Val[][] = OR.map((o) => [CU[cIdx(o[1])][1], o[0]]).sort((a, b) => String(a[0]).localeCompare(String(b[0])) || (a[1] as number) - (b[1] as number));
const LEFT: Val[][] = [["Sophia", null], ...INNER];
const R = table(v, {
  x: 240,
  y: 380,
  rowH: 56,
  size: 27,
  title: "result",
  cols: [
    { key: "first_name", w: 280 },
    { key: "order_id", w: 280 },
  ],
  rows: LEFT,
});
rows(
  v,
  R,
  [
    { t: 0, slot: [null, 0, 1, 2, 3, 4], dur: 0.01 },
    { t: 34, slot: [0, 1, 2, 3, 4, 5], bg: LEFT.map((_, i) => (i === 0 ? AMBER : null)) },
  ],
  [24.2, 41]
);
codePanel(v, { x: 90, y: 170, lines: ["SELECT c.first_name, o.order_id", "FROM customers c", "INNER JOIN orders o", "  ON o.customer_id = c.customer_id;"], size: 25, width: 900 }).at([{ t: 24, on: [2, 3] }], [24.2, 32.9]);
codePanel(v, { x: 90, y: 170, lines: ["SELECT c.first_name, o.order_id", "FROM customers c", "LEFT JOIN orders o", "  ON o.customer_id = c.customer_id;"], size: 25, width: 900 }).at([{ t: 33, on: [2, 3] }], [33, 41]);

v.ready();
