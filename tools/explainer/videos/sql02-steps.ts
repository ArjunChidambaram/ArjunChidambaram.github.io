import { createVideo } from "./engine";
import { table, rows, codePanel, type Val } from "./sqlkit";

const DUR = 100;
const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: DUR });
const { C, W, text, life } = v;
const OK = "rgba(131,193,103,0.28)";
const NO = "rgba(252,98,85,0.22)";
const TIER: Record<string, string> = { premium: "rgba(199,125,255,0.30)", standard: "rgba(88,196,221,0.22)", budget: "rgba(244,211,94,0.22)" };

v.centerTitle("ORDER BY, LIMIT and CASE, Step by Step", 0.2, 7.6, 70, 60, 760);
life(text("The question: {green:the 4 priciest footwear and outdoor products, labelled by tier}.", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 7.6, "fade");
life(text("Five clauses, run in a fixed order.", { x: W / 2, y: 400 }, { size: 38, ax: 0.5, color: C.dim }), 3, 7.6, "fade");

const code = codePanel(v, {
  x: 60,
  y: 200,
  size: 26,
  width: 700,
  lines: [
    "SELECT name, price,",
    "  CASE WHEN price >= 100 THEN 'premium'",
    "       WHEN price >= 30  THEN 'standard'",
    "       ELSE 'budget' END AS tier",
    "FROM products",
    "WHERE category IN ('Footwear', 'Outdoor')",
    "ORDER BY price DESC",
    "LIMIT 4;",
  ],
});
code.at(
  [
    { t: 8, on: [4] },
    { t: 18, on: [5] },
    { t: 30, on: [0, 1, 2, 3] },
    { t: 46, on: [6] },
    { t: 56, on: [7] },
    { t: 63, on: "all" },
  ],
  [8.2, 65.6]
);

const P: Val[][] = [
  ["Trail Running Shoes", "Footwear", 89.99],
  ["Everyday Sneakers", "Footwear", 59.99],
  ["Rain Boots", "Footwear", 44.5],
  ["Wool Socks (3-pack)", "Footwear", 14.99],
  ["Water Bottle", "Outdoor", 24.99],
  ["Daypack 20L", "Outdoor", 64.0],
  ["Two-Person Tent", "Outdoor", 179.0],
  ["Sleeping Bag", "Outdoor", 119.0],
  ["Wireless Earbuds", "Electronics", 79.0],
  ["Coffee Beans 1lb", "Grocery", 12.49],
];
const tier = (p: number) => (p >= 100 ? "premium" : p >= 30 ? "standard" : "budget");
const T = table(v, {
  x: 860,
  y: 200,
  rowH: 52,
  size: 25,
  title: "products",
  titleColor: C.blue,
  cols: [
    { key: "name", w: 330 },
    { key: "category", w: 190 },
    { key: "price", w: 140, align: "right" },
    { key: "tier", w: 190, align: "center" },
  ],
  rows: P.map((r) => [r[0], r[1], (r[2] as number).toFixed(2), ""]),
});
const keep = P.map((r) => r[1] === "Footwear" || r[1] === "Outdoor");
let k = 0;
const afterWhere = keep.map((b) => (b ? k++ : null));
const kept = P.map((_, i) => i).filter((i) => keep[i]);
const byPrice = [...kept].sort((a, b) => (P[b][2] as number) - (P[a][2] as number));
const sortSlot = P.map((_, i) => (keep[i] ? byPrice.indexOf(i) : null));
rows(
  v,
  T,
  [
    { t: 0, cols: [true, true, true, false], dur: 0.01 },
    { t: 20, bg: keep.map((b) => (b ? OK : NO)) },
    { t: 23, dim: keep.map((b) => !b) },
    { t: 26, slot: afterWhere, dim: keep.map(() => false), bg: P.map(() => null) },
    { t: 31, cols: [true, false, true, true] },
    ...kept.map((i, n) => ({ t: 33 + n * 1.1, set: [[i, 3, tier(P[i][2] as number)]] as [number, number, Val][], bg: P.map((_, j) => (kept.indexOf(j) !== -1 && kept.indexOf(j) <= n ? TIER[tier(P[j][2] as number)] : null)), dur: 0.3 })),
    { t: 47.5, slot: sortSlot, dur: 1.4 },
    { t: 57.5, slot: sortSlot.map((s) => (s !== null && s < 4 ? s : null)) },
  ],
  [8.6, 65.6]
);

const L = (s: string, a: number, b: number, y: number, color?: string) => life(text(s, { x: 60, y }, { size: 28, width: 700, color }), a, b, "fade");
L("{blue:1. FROM}: every row of products.", 8.6, 17.8, 620);
L("{blue:2. WHERE}: keep footwear and outdoor.", 18.4, 29.8, 620);
L("IN is shorthand for category = 'Footwear' OR category = 'Outdoor'.", 21, 29.8, 680, C.dim);
L("{blue:3. SELECT}: compute the columns, including CASE.", 30.4, 45.8, 620);
L("Each row takes the {yellow:first} WHEN that's true; ELSE catches the rest.", 32, 45.8, 680, C.dim);
L("{blue:4. ORDER BY}: sort by price, highest first.", 46.4, 55.8, 620);
L("{blue:5. LIMIT}: keep the first 4 rows.", 56.4, 65.6, 620);
L("LIMIT without ORDER BY gives you an arbitrary 4.", 58.5, 65.6, 680, C.dim);

// run order
v.centerTitle("The Run Order So Far", 66.2, 79.6, 70, 52, 460);
["FROM", "WHERE", "SELECT", "ORDER BY", "LIMIT"].forEach((s, i) =>
  life(text(`{green:${s}}`, { x: 330 + i * 320, y: 300 }, { size: 46, ax: 0.5, font: "'DejaVu Sans Mono',monospace" }), 67 + i * 0.4, 79.6, "fade")
);
[0, 1, 2, 3].forEach((i) => life(text("→", { x: 490 + i * 320, y: 300 }, { size: 46, ax: 0.5, color: C.dim }), 67.3 + i * 0.4, 79.6, "fade"));
life(text("ORDER BY runs after SELECT, so it {green:can} use aliases like tier. WHERE can't (in standard SQL).", { x: W / 2, y: 480 }, { size: 34, ax: 0.5 }), 70, 79.6, "fade");
life(text("Where do NULLs go when you sort? Last for ASC in PostgreSQL, DuckDB and Oracle;", { x: W / 2, y: 600 }, { size: 32, ax: 0.5, color: C.dim }), 73, 79.6, "fade");
life(text("first in MySQL, SQL Server and SQLite. Say NULLS FIRST / NULLS LAST to be sure.", { x: W / 2, y: 650 }, { size: 32, ax: 0.5, color: C.dim }), 73.2, 79.6, "fade");

// pitfalls
v.centerTitle("Two CASE and DISTINCT Pitfalls", 80.2, 91.6, 70, 52, 560);
life(text("{yellow:CASE stops at the first match.} Put the narrowest condition first:", { x: W / 2, y: 260 }, { size: 34, ax: 0.5 }), 81, 91.6, "fade");
life(text("WHEN price >= 30 ... WHEN price >= 100 labels a $179 tent 'standard', not 'premium'.", { x: W / 2, y: 320 }, { size: 30, ax: 0.5, color: C.dim }), 82, 91.6, "fade");
life(text("{yellow:DISTINCT applies to the whole row}, not just the first column:", { x: W / 2, y: 480 }, { size: 34, ax: 0.5 }), 84.5, 91.6, "fade");
life(text("SELECT DISTINCT segment, channel gives one row per segment-and-channel pair.", { x: W / 2, y: 540 }, { size: 30, ax: 0.5, color: C.dim }), 85.5, 91.6, "fade");
life(text("And no ELSE means unmatched rows get NULL.", { x: W / 2, y: 690 }, { size: 34, ax: 0.5 }), 87.5, 91.6, "fade");

v.endCard(92.2, 99, [
  { text: "ORDER BY sorts, LIMIT cuts, DISTINCT dedupes, CASE labels.", size: 42, y: 260 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
