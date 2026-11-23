import { createVideo } from "./engine";
import { table, rows, codePanel, type Val } from "./sqlkit";

const DUR = 100;
const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: DUR });
const { C, W, text, life } = v;
const OK = "rgba(131,193,103,0.28)";
const NO = "rgba(252,98,85,0.22)";
const HL = "rgba(88,196,221,0.25)";
const CAT: Record<string, string> = { Footwear: "rgba(88,196,221,0.16)", Outdoor: "rgba(131,193,103,0.16)", Electronics: "rgba(199,125,255,0.18)" };

v.centerTitle("A Correlated Subquery, Step by Step", 0.2, 7.6, 70, 60, 740);
life(text("The question: {green:which products cost more than the average of their own category?}", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 7.6, "fade");
life(text("The inner query depends on the outer row, so it runs once per row.", { x: W / 2, y: 400 }, { size: 36, ax: 0.5, color: C.dim }), 3, 7.6, "fade");

const code = codePanel(v, {
  x: 60,
  y: 190,
  size: 26,
  width: 720,
  lines: ["SELECT p.name, p.category, p.price", "FROM products AS p", "WHERE p.price > (", "  SELECT AVG(p2.price)", "  FROM products AS p2", "  WHERE p2.category = p.category", ");"],
});
code.at(
  [
    { t: 8, on: [1] },
    { t: 14, on: [3, 4, 5] },
    { t: 40, on: [2, 6] },
    { t: 47, on: "all" },
  ],
  [8.2, 51.6]
);

const P: Val[][] = [
  ["Trail Running Shoes", "Footwear", 89.99],
  ["Rain Boots", "Footwear", 44.5],
  ["Wool Socks (3-pack)", "Footwear", 14.99],
  ["Water Bottle", "Outdoor", 24.99],
  ["Two-Person Tent", "Outdoor", 179.0],
  ["Daypack 20L", "Outdoor", 64.0],
  ["Wireless Earbuds", "Electronics", 79.0],
  ["Phone Charger", "Electronics", 19.99],
  ["Smart Watch", "Electronics", 199.0],
];
const AVG: Record<string, number> = { Footwear: 52.37, Outdoor: 83.39, Electronics: 71.59 };
const T = table(v, {
  x: 840,
  y: 190,
  rowH: 52,
  size: 24,
  title: "products  p  (9 of 22)",
  titleColor: C.blue,
  cols: [
    { key: "name", w: 290 },
    { key: "category", w: 170 },
    { key: "price", w: 120, align: "right" },
    { key: "category avg", w: 190, align: "right" },
    { key: "price > avg?", w: 170, align: "center" },
  ],
  rows: P.map((r) => [r[0], r[1], (r[2] as number).toFixed(2), "", ""]),
});
const pass = P.map((r) => (r[2] as number) > AVG[r[1] as string]);
const T0 = 15;
const ST = 2.6;
let k = 0;
rows(
  v,
  T,
  [
    { t: 0, cols: [true, true, true, false, false], dur: 0.01 },
    { t: 14.2, cols: [true, true, true, true, true] },
    ...P.map((r, i) => ({
      t: T0 + i * ST,
      bg: P.map((q, j) => (j === i ? HL : q[1] === r[1] ? CAT[r[1] as string] : j < i ? (pass[j] ? OK : NO) : null)),
      set: [
        [i, 3, AVG[r[1] as string].toFixed(2)],
        [i, 4, ""],
      ] as [number, number, Val][],
    })),
    ...P.map((r, i) => ({ t: T0 + i * ST + 1.4, set: [[i, 4, pass[i] ? "TRUE" : "FALSE"]] as [number, number, Val][], dur: 0.3 })),
    { t: T0 + 9 * ST, bg: pass.map((b) => (b ? OK : NO)) },
    { t: 42, dim: pass.map((b) => !b) },
    { t: 44.5, slot: pass.map((b) => (b ? k++ : null)), dim: pass.map(() => false), cols: [true, true, true, false, false] },
  ],
  [8.6, 51.6]
);

const L = (s: string, a: number, b: number, y: number, color?: string) => life(text(s, { x: 60, y }, { size: 28, width: 740, color }), a, b, "fade");
L("For {blue:each} outer row, the inner query averages the products in {blue:that row's} category.", 14.4, 39.6, 650);
L("p.category inside the subquery is the {yellow:correlation}: it ties the inner query to the current outer row.", 20, 39.6, 760, C.dim);
L("Then WHERE keeps the rows where price beats their category's average.", 40.2, 51.6, 650);
L(`${pass.filter(Boolean).length} of these 9 pass. A subquery that doesn't mention the outer row runs just once.`, 44, 51.6, 760, C.dim);

// three places
v.centerTitle("Where Subqueries Go", 52.2, 66.6, 70, 52, 420);
const PL: [string, string, string][] = [
  ["in WHERE", "WHERE price > (SELECT AVG(price) FROM products)", "a scalar subquery: must return exactly one value"],
  ["with IN / EXISTS", "WHERE customer_id IN (SELECT customer_id FROM orders)", "a list of values, or just whether any row exists"],
  ["in FROM", "FROM (SELECT order_id, SUM(...) AS value ...) AS t", "a derived table: a whole result used as a table"],
];
PL.forEach(([a, b, c], i) => {
  life(text(`{blue:${a}}`, { x: 160, y: 220 + i * 190 }, { size: 36 }), 53 + i * 1.5, 66.6, "fade");
  life(text(b, { x: 160, y: 272 + i * 190 }, { size: 28, font: "'DejaVu Sans Mono',monospace" }), 53.3 + i * 1.5, 66.6, "fade");
  life(text(c, { x: 160, y: 320 + i * 190 }, { size: 28, color: C.dim }), 53.6 + i * 1.5, 66.6, "fade");
});

// NOT IN
v.centerTitle("The NOT IN Trap", 67.2, 81.6, 70, 52, 400);
life(text("customer_id NOT IN (SELECT customer_id FROM sessions WHERE source = 'email')", { x: W / 2, y: 230 }, { size: 30, ax: 0.5, font: "'DejaVu Sans Mono',monospace" }), 68, 81.6, "fade");
life(text("104 of those 280 sessions are anonymous: customer_id is NULL.", { x: W / 2, y: 320 }, { size: 34, ax: 0.5 }), 69.5, 81.6, "fade");
life(text("x NOT IN (…, NULL) is never TRUE, so the query returns {red:0 customers}.", { x: W / 2, y: 400 }, { size: 34, ax: 0.5 }), 71.5, 81.6, "fade");
life(text("NOT EXISTS (SELECT 1 FROM sessions s WHERE s.customer_id = c.customer_id AND …)", { x: W / 2, y: 520 }, { size: 30, ax: 0.5, font: "'DejaVu Sans Mono',monospace", color: C.green }), 74, 81.6, "fade");
life(text("returns the right answer: {green:50 customers}. Prefer NOT EXISTS for \"no match\" questions.", { x: W / 2, y: 590 }, { size: 34, ax: 0.5 }), 75.5, 81.6, "fade");

// CTEs
v.centerTitle("CTEs: Name Each Step", 82.2, 93.6, 70, 52, 480);
life(text("WITH step_one AS (…), step_two AS (… FROM step_one …)  SELECT … FROM step_two", { x: W / 2, y: 240 }, { size: 30, ax: 0.5, font: "'DejaVu Sans Mono',monospace" }), 83, 93.6, "fade");
life(text("Same power as nested subqueries, but read top to bottom, like a recipe.", { x: W / 2, y: 340 }, { size: 34, ax: 0.5 }), 84.5, 93.6, "fade");
life(text("Each step can be tested on its own, and later steps can reuse earlier ones.", { x: W / 2, y: 410 }, { size: 34, ax: 0.5, color: C.dim }), 86, 93.6, "fade");
life(text("Fix join fan-out by aggregating each table to the same grain in its own CTE, then joining.", { x: W / 2, y: 540 }, { size: 32, ax: 0.5 }), 88, 93.6, "fade");

v.endCard(94.2, 99.6, [
  { text: "Answer the small question first, then use it in the big one.", size: 42, y: 260 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
