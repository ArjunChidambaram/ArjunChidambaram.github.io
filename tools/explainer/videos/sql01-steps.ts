import { createVideo } from "./engine";
import { table, rows, codePanel, type Val } from "./sqlkit";

const DUR = 100;
const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: DUR });
const { C, W, text, tex, life } = v;
const OK = "rgba(131,193,103,0.28)";
const NO = "rgba(252,98,85,0.22)";

v.centerTitle("SELECT, FROM and WHERE, Step by Step", 0.2, 7.6, 70, 60, 760);
life(text("You write the clauses in one order. The database runs them in another.", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 7.6, "fade");
life(text("Watch it answer: {green:Texas customers who signed up in 2025}.", { x: W / 2, y: 400 }, { size: 38, ax: 0.5 }), 3, 7.6, "fade");

const code = codePanel(v, {
  x: 70,
  y: 220,
  size: 30,
  width: 640,
  lines: ["SELECT first_name, city", "FROM customers", "WHERE state = 'TX'", "  AND signup_date >= '2025-01-01';"],
});
code.at(
  [
    { t: 8, on: [1] },
    { t: 20, on: [2, 3] },
    { t: 44, on: [0] },
    { t: 54, on: "all" },
  ],
  [8.2, 57.6]
);

const DATA: Val[][] = [
  [1, "Sophia", "Austin", "TX", "2025-10-02", "", ""],
  [2, "Aiden", "Houston", "TX", "2025-09-16", "", ""],
  [3, "Wei", "Portland", "OR", "2025-10-31", "", ""],
  [4, "Daniel", "Seattle", "WA", "2024-12-20", "", ""],
  [8, "Arjun", "New York", "NY", "2025-05-17", "", ""],
  [12, "Chloe", "Houston", "TX", "2024-01-26", "", ""],
  [51, "Chloe", null, "OR", "2024-06-14", "", ""],
  [60, "David", null, "MA", "2025-10-08", "", ""],
];
const T = table(v, {
  x: 770,
  y: 230,
  rowH: 56,
  size: 25,
  title: "customers",
  titleColor: C.blue,
  cols: [
    { key: "id", w: 70 },
    { key: "first_name", w: 160 },
    { key: "city", w: 160 },
    { key: "state", w: 90 },
    { key: "signup_date", w: 175 },
    { key: "state = 'TX'", w: 170, align: "center" },
    { key: "≥ 2025-01-01", w: 170, align: "center" },
  ],
  rows: DATA,
});
const tx = DATA.map((r) => r[3] === "TX");
const y25 = DATA.map((r) => String(r[4]) >= "2025-01-01");
const both = DATA.map((_, i) => tx[i] && y25[i]);
let k = 0;
const keepSlots = both.map((b) => (b ? k++ : null));
const fill = (col: number, vals: boolean[], t0: number) => vals.map((b, i) => ({ t: t0 + i * 0.45, set: [[i, col, b ? "TRUE" : "FALSE"]] as [number, number, Val][], dur: 0.2 }));
rows(
  v,
  T,
  [
    { t: 0, cols: [true, true, true, true, true, false, false], dur: 0.01 },
    { t: 22, cols: [true, true, true, true, true, true, false] },
    ...fill(5, tx, 23),
    { t: 27.4, cols: [true, true, true, true, true, true, true] },
    ...fill(6, y25, 28.2),
    { t: 33, bg: both.map((b) => (b ? OK : NO)) },
    { t: 36.5, dim: both.map((b) => !b) },
    { t: 39.5, slot: keepSlots, dim: both.map(() => false) },
    { t: 44.6, cols: [false, true, true, false, false, false, false] },
  ],
  [8.6, 57.6]
);

// left-panel narration
const L = (s: string, a: number, b: number, y: number, color?: string) => life(text(s, { x: 70, y }, { size: 30, width: 640, color }), a, b, "fade");
L("{blue:1. FROM}", 8.6, 19.8, 520);
L("Start with every row of the customers table.", 9.2, 19.8, 570);
L("{blue:2. WHERE}", 20.4, 43.6, 520);
L("Test each row. Each condition gives TRUE or FALSE.", 21, 43.6, 570);
L("AND keeps a row only if both are TRUE.", 31, 43.6, 680);
L(`${both.filter(Boolean).length} of 8 rows pass. The rest are thrown away.`, 37, 43.6, 760, C.green);
L("{blue:3. SELECT}", 44.4, 57.6, 520);
L("Finally, keep only the columns you asked for.", 45, 57.6, 570);
L("SELECT runs last, even though it's written first.", 49, 57.6, 680, C.dim);

// ---------------- NULL ----------------
v.centerTitle("NULL: the Third Truth Value", 58.2, 77.6, 70, 52, 560);
life(text("A missing value is {yellow:NULL}: unknown. Comparing anything to unknown gives unknown.", { x: W / 2, y: 210 }, { size: 34, ax: 0.5 }), 59, 77.6, "fade");
life(
  tex(
    "\\begin{array}{c|ccc} \\textbf{AND} & \\text{TRUE} & \\text{FALSE} & \\textcolor{#F4D35E}{\\text{NULL}} \\\\ \\hline \\text{TRUE} & \\text{TRUE} & \\text{FALSE} & \\textcolor{#F4D35E}{\\text{NULL}} \\\\ \\text{FALSE} & \\text{FALSE} & \\text{FALSE} & \\text{FALSE} \\\\ \\textcolor{#F4D35E}{\\text{NULL}} & \\textcolor{#F4D35E}{\\text{NULL}} & \\text{FALSE} & \\textcolor{#F4D35E}{\\text{NULL}} \\end{array}",
    { x: 520, y: 300 },
    { size: 34, ax: 0.5 }
  ),
  61,
  77.6,
  "fade"
);
life(
  tex(
    "\\begin{array}{c|ccc} \\textbf{OR} & \\text{TRUE} & \\text{FALSE} & \\textcolor{#F4D35E}{\\text{NULL}} \\\\ \\hline \\text{TRUE} & \\text{TRUE} & \\text{TRUE} & \\text{TRUE} \\\\ \\text{FALSE} & \\text{TRUE} & \\text{FALSE} & \\textcolor{#F4D35E}{\\text{NULL}} \\\\ \\textcolor{#F4D35E}{\\text{NULL}} & \\text{TRUE} & \\textcolor{#F4D35E}{\\text{NULL}} & \\textcolor{#F4D35E}{\\text{NULL}} \\end{array}",
    { x: 1400, y: 300 },
    { size: 34, ax: 0.5 }
  ),
  62,
  77.6,
  "fade"
);
life(text("WHERE keeps a row only when the condition is {green:TRUE}. FALSE and NULL are both dropped.", { x: W / 2, y: 610 }, { size: 34, ax: 0.5 }), 65, 77.6, "fade");
life(tex("\\texttt{city <> 'Austin'} \\;\\text{ on a NULL city }\\;\\longrightarrow\\; \\textcolor{#F4D35E}{\\text{NULL}} \\;\\longrightarrow\\; \\text{row dropped}", { x: W / 2, y: 700 }, { size: 40, ax: 0.5 }), 68, 77.6, "write", 1.4);
life(text("150 customers: 12 in Austin, 136 \"not Austin\", and 2 with unknown city that match neither.", { x: W / 2, y: 820 }, { size: 32, ax: 0.5, color: C.dim }), 71, 77.6, "fade");
life(text("Test for missing values with {green:IS NULL} / {green:IS NOT NULL}, never = NULL.", { x: W / 2, y: 900 }, { size: 34, ax: 0.5 }), 73.5, 77.6, "fade");

// ---------------- order ----------------
v.centerTitle("Written Order vs Run Order", 78.2, 91.6, 70, 52, 520);
const order = (items: string[], x: number, head: string, a: number, color: string) => {
  life(text(head, { x, y: 230 }, { size: 36, ax: 0.5, color: C.dim }), a, 91.6, "fade");
  items.forEach((s, i) => life(text(`{${color}:${s}}`, { x, y: 320 + i * 90 }, { size: 52, ax: 0.5, font: "'DejaVu Sans Mono',monospace" }), a + 0.5 + i * 0.5, 91.6, "fade"));
};
order(["SELECT", "FROM", "WHERE"], 560, "You write", 79, "blue");
order(["FROM", "WHERE", "SELECT"], 1360, "It runs", 81, "green");
life(text("→", { x: W / 2, y: 410 }, { size: 80, ax: 0.5, color: C.dim }), 81, 91.6, "fade");
life(text("So a column alias made in SELECT doesn't exist yet when WHERE runs.", { x: W / 2, y: 690 }, { size: 34, ax: 0.5 }), 84, 91.6, "fade");
life(text("Standard SQL and PostgreSQL reject it; DuckDB and Snowflake allow it as a shortcut.", { x: W / 2, y: 760 }, { size: 32, ax: 0.5, color: C.dim }), 86, 91.6, "fade");

v.endCard(92.2, 99, [
  { text: "FROM picks the table. WHERE picks the rows. SELECT picks the columns.", size: 40, y: 260 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
