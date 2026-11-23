import { createVideo, prog, smooth, span } from "./engine";
import { table, rows, codePanel, shorts, type Val } from "./sqlkit";

const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: 48 });
const { C, W, text, life, s, set, frame } = v;
const GREEN = "rgba(5,206,145,0.22)";
const RED = "rgba(226,72,61,0.14)";

shorts(
  v,
  "Subqueries and CTEs",
  "Queries inside queries",
  "In one line",
  ["Answer a small question first,", "then use it in the big one."],
  [
    [5, 14.8, "The inner query runs first and returns the average price."],
    [15, 23.8, "The outer query uses that number like any other value."],
    [24, 32.8, "Trap: NOT IN a list containing NULL never returns TRUE."],
    [33, 41, "CTEs give each step a name, so long queries read top to bottom."],
  ]
);

const P: Val[][] = [
  ["Two-Person Tent", 179.0],
  ["Trail Running Shoes", 89.99],
  ["Wireless Earbuds", 79.0],
  ["Daypack 20L", 64.0],
  ["Everyday Sneakers", 59.99],
  ["Rain Boots", 44.5],
  ["Water Bottle", 24.99],
  ["Coffee Beans 1lb", 12.49],
];
const AVG = 53.77;
const T = table(v, {
  x: 90,
  y: 400,
  rowH: 52,
  size: 26,
  title: "products (8 of 22)",
  cols: [
    { key: "name", w: 360 },
    { key: "price", w: 150, align: "right" },
  ],
  rows: P.map((r) => [r[0], (r[1] as number).toFixed(2)]),
});
const above = P.map((r) => (r[1] as number) > AVG);
let k = 0;
rows(
  v,
  T,
  [
    { t: 16.5, bg: above.map((b) => (b ? GREEN : RED)) },
    { t: 19.5, slot: above.map((b) => (b ? k++ : null)) },
  ],
  [5.2, 23.6]
);
const AV = table(v, { x: 720, y: 400, rowH: 52, size: 26, title: "inner result", titleColor: "#007A7A", cols: [{ key: "AVG(price)", w: 220, align: "right" }], rows: [[AVG.toFixed(2)]] });
rows(v, AV, [], [9, 23.6]);
codePanel(v, { x: 90, y: 165, lines: ["SELECT name, price FROM products", "WHERE price > (", "  SELECT AVG(price) FROM products", ");"], size: 25, width: 900 }).at(
  [
    { t: 5, on: [2] },
    { t: 15, on: [0, 1, 3] },
  ],
  [5.2, 23.6]
);

// NOT IN trap
codePanel(v, { x: 90, y: 165, lines: ["SELECT * FROM customers", "WHERE customer_id NOT IN (", "  SELECT customer_id FROM sessions", ");  -- some sessions have NULL ids"], size: 25, width: 900 }).at([{ t: 24, on: [1, 2, 3] }], [24.2, 32.8]);
const L = (str: string, a: number, y: number, size = 34, color?: string) => life(text(str, { x: W / 2, y }, { size, ax: 0.5, color, font: "'DejaVu Sans Mono',monospace" }), a, 32.8, "fade");
L("7 NOT IN (4, 9, NULL)", 25, 440, 40);
L("= 7 <> 4  AND  7 <> 9  AND  7 <> NULL", 26.5, 530, 32);
L("=  TRUE   AND   TRUE   AND   NULL", 28, 600, 32, C.dim);
life(text("= {orange:NULL}  →  row dropped. Every row is dropped.", { x: W / 2, y: 690 }, { size: 36, ax: 0.5, weight: 600 }), 29.5, 32.8, "fade");
life(text("Use NOT EXISTS instead: it ignores the NULLs.", { x: W / 2, y: 780 }, { size: 32, ax: 0.5, color: "#047857" }), 30.5, 32.8, "fade");

// CTE pipeline
const STEPS = ["order_values", "customer_stats", "tiers", "final SELECT"];
const DESC = ["one row per order, with its value", "one row per customer: orders, lifetime value", "label each customer VIP / regular / occasional", "count customers per tier"];
codePanel(v, { x: 90, y: 165, lines: ["WITH order_values AS (...),", "     customer_stats AS (...),", "     tiers AS (...)", "SELECT tier, COUNT(*) FROM tiers GROUP BY tier;"], size: 25, width: 900 }).at([{ t: 33, on: "all" }], [33.2, 41]);
STEPS.forEach((name, i) => {
  const y = 400 + i * 135;
  const box = s("rect", { x: 140, y, width: 800, height: 100, rx: 14, fill: i === 3 ? "#E6F6F1" : "#E2E8F0", stroke: i === 3 ? "#007A7A" : "#94A3B8", "stroke-width": 2, opacity: 0 });
  const arrow = i < 3 ? s("path", { d: `M540,${y + 104} L540,${y + 131} M530,${y + 120} L540,${y + 131} L550,${y + 120}`, stroke: "#64748B", "stroke-width": 3, fill: "none", opacity: 0 }) : null;
  life(text(name, { x: 170, y: y + 14 }, { size: 32, weight: 600, font: "'DejaVu Sans Mono',monospace" }), 34 + i * 1.3, 41, "fade");
  life(text(DESC[i], { x: 170, y: y + 58 }, { size: 26, color: C.dim }), 34.2 + i * 1.3, 41, "fade");
  frame((t) => {
    const o = span(t, 34 + i * 1.3, 41, 0.4);
    set(box, { opacity: o });
    if (arrow) set(arrow, { opacity: span(t, 34.6 + i * 1.3, 41, 0.4) });
  });
});
void prog;
void smooth;

v.ready();
