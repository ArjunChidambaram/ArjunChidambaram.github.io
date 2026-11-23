import { createVideo } from "./engine";
import { table, rows, codePanel, type Val, type RowKey } from "./sqlkit";

const DUR = 100;
const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: DUR });
const { C, W, text, life } = v;
const RC = ["rgba(88,196,221,0.22)", "rgba(131,193,103,0.24)", "rgba(244,211,94,0.24)", "rgba(224,122,159,0.24)", "rgba(199,125,255,0.22)"];
const MONO = "'DejaVu Sans Mono',monospace";

v.centerTitle("How WITH RECURSIVE Runs", 0.2, 7.6, 70, 60, 640);
life(text("The question: {green:everyone above Nina Rossi, all the way to the CEO}.", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 7.6, "fade");
life(text("A plain join climbs one level. We don't know how many levels there are.", { x: W / 2, y: 400 }, { size: 36, ax: 0.5, color: C.dim }), 3, 7.6, "fade");

const code = codePanel(v, {
  x: 60,
  y: 170,
  size: 22,
  width: 900,
  lines: [
    "WITH RECURSIVE chain AS (",
    "  SELECT employee_id, name, manager_id, 0 AS steps_up",
    "  FROM employees WHERE name = 'Nina Rossi'   -- anchor",
    "  UNION ALL",
    "  SELECT e.employee_id, e.name, e.manager_id, c.steps_up + 1",
    "  FROM employees e",
    "  JOIN chain c ON e.employee_id = c.manager_id  -- step",
    ")",
    "SELECT steps_up, name FROM chain;",
  ],
});
code.at(
  [
    { t: 8, on: [1, 2] },
    { t: 15, on: [4, 5, 6] },
    { t: 40, on: [3] },
    { t: 44, on: [8] },
  ],
  [8.2, 49.6]
);

const CHAIN: Val[][] = [
  [15, "Nina Rossi", 11, 0],
  [11, "Hannah Weiss", 6, 1],
  [6, "Sam Okafor", 3, 2],
  [3, "Priya Raman", 1, 3],
  [1, "Dana Whitfield", null, 4],
];
const T = table(v, {
  x: 1040,
  y: 170,
  rowH: 54,
  size: 25,
  title: "chain (result so far)",
  titleColor: C.green,
  cols: [
    { key: "employee_id", w: 170, align: "right" },
    { key: "name", w: 260 },
    { key: "manager_id", w: 170, align: "right" },
    { key: "steps_up", w: 150, align: "right" },
  ],
  rows: CHAIN,
});
const k: RowKey[] = [{ t: 0, slot: [0, null, null, null, null], bg: CHAIN.map((_, i) => RC[i]), dur: 0.01 }];
for (let r = 1; r <= 4; r++) {
  k.push({ t: 16 + (r - 1) * 5, slot: CHAIN.map((_, i) => (i <= r ? i : null)), dim: CHAIN.map((_, i) => i < r - 1) });
}
k.push({ t: 38, dim: CHAIN.map(() => false) });
rows(v, T, k, [9, 49.6]);

const L = (s: string, a: number, b: number, y: number, color?: string) => life(text(s, { x: 60, y }, { size: 28, width: 880, color }), a, b, "fade");
L("{blue:Round 0.} The anchor runs once: Nina's row.", 9.5, 15.6, 640);
L("Her manager_id is 11. That's the thread we follow next.", 11, 15.6, 700, C.dim);
L("{blue:Each round}, the step joins employees to {yellow:only the last round's rows}", 16.5, 37.6, 640);
L("and finds their managers. Earlier rounds are already done (dimmed).", 16.7, 37.6, 690);
L("Round 4 finds Dana. Her manager_id is NULL, so round 5 finds nobody:", 30, 37.6, 760, C.dim);
L("{red:no new rows = stop}.", 31, 37.6, 810, C.red);
L("{blue:UNION ALL} glues every round together into one result.", 40.4, 49.6, 640);
L("The final SELECT reads it like any other table.", 44.5, 49.6, 700, C.dim);
L("Same shape, other direction: anchor = a manager, step = their reports.", 46, 49.6, 780, C.green);

// rules
v.centerTitle("Termination, Cycles and Dialects", 50.2, 70.6, 70, 52, 600);
const RULES: [string, string][] = [
  ["Stops when", "a round adds zero rows (not when a counter says so)"],
  ["Guard it", "WHERE depth < 20, or a limit in the step, for safety"],
  ["Cycles", "A > B > A loops forever with UNION ALL"],
  ["UNION", "drops rows that exactly repeat, which stops some cycles"],
];
RULES.forEach(([a, b], i) => {
  life(text(`{blue:${a}}`, { x: 220, y: 200 + i * 78 }, { size: 34 }), 51 + i * 0.7, 70.6, "fade");
  life(text(b, { x: 560, y: 202 + i * 78 }, { size: 32 }), 51.2 + i * 0.7, 70.6, "fade");
});
life(text("Dialects", { x: 220, y: 560 }, { size: 34, color: C.yellow }), 56, 70.6, "fade");
const DIA = [
  "PostgreSQL, MySQL 8+, SQLite, DuckDB: WITH RECURSIVE",
  "SQL Server, Oracle: plain WITH (SQL Server stops at 100 levels unless OPTION (MAXRECURSION n))",
  "PostgreSQL 14+ adds CYCLE ... SET is_cycle to detect loops; Oracle also has CONNECT BY",
];
DIA.forEach((d, i) => life(text(d, { x: 220, y: 630 + i * 62 }, { size: 29, color: C.dim, width: 1500 }), 56.5 + i * 0.8, 70.6, "fade"));

// gaps and islands
v.centerTitle("Gaps and Islands", 71.2, 92.6, 70, 52, 380);
life(text("Streaks of consecutive days with orders. No recursion needed: one window function.", { x: W / 2, y: 160 }, { size: 32, ax: 0.5, color: C.dim }), 72, 92.6, "fade");
const DAYS: Val[][] = [
  ["2025-11-01", 1, "2025-10-31"],
  ["2025-11-02", 2, "2025-10-31"],
  ["2025-11-03", 3, "2025-10-31"],
  ["2025-11-04", 4, "2025-10-31"],
  ["2025-11-07", 5, "2025-11-02"],
  ["2025-11-08", 6, "2025-11-02"],
  ["2025-11-10", 7, "2025-11-03"],
  ["2025-11-11", 8, "2025-11-03"],
];
const ISL = [0, 0, 0, 0, 1, 1, 2, 2];
const G = table(v, {
  x: 100,
  y: 230,
  rowH: 54,
  size: 26,
  title: "order days",
  titleColor: C.blue,
  cols: [
    { key: "day", w: 220 },
    { key: "rn", w: 110, align: "right" },
    { key: "day − rn", w: 230, align: "right" },
  ],
  rows: DAYS,
});
rows(
  v,
  G,
  [
    { t: 0, cols: [true, false, false], dur: 0.01 },
    { t: 74.5, cols: [true, true, false] },
    { t: 77.5, cols: [true, true, true] },
    { t: 80.5, bg: ISL.map((g) => RC[g]) },
  ],
  [72.4, 92.6]
);
const RES = table(v, {
  x: 1080,
  y: 600,
  rowH: 54,
  size: 26,
  title: "streaks",
  titleColor: C.green,
  cols: [
    { key: "start", w: 210 },
    { key: "end", w: 210 },
    { key: "days", w: 120, align: "right" },
  ],
  rows: [
    ["2025-11-01", "2025-11-04", 4],
    ["2025-11-07", "2025-11-08", 2],
    ["2025-11-10", "2025-11-11", 2],
  ],
});
rows(v, RES, [{ t: 0, bg: [RC[0], RC[1], RC[2]], dur: 0.01 }], [84, 92.6]);
const L2 = (s: string, a: number, y: number, color?: string) => life(text(s, { x: 800, y }, { size: 28, width: 1060, color }), a, 92.6, "fade");
L2("{blue:1.} Number the days in order: ROW_NUMBER() OVER (ORDER BY day).", 75, 250);
L2("{blue:2.} Subtract. Inside a streak, day and rn both go up by 1,", 78, 330);
L2("so day − rn stays the same. A gap makes it jump.", 78.2, 375);
L2("{blue:3.} GROUP BY that value: MIN(day), MAX(day), COUNT(*).", 81.5, 455);
L2("The constant is meaningless on its own; it only labels the island.", 82.5, 510, C.dim);

v.endCard(93.2, 99.6, [
  { text: "Anchor, step, repeat until nothing new.", size: 44, y: 260 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
